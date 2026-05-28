import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireOrg();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "weekly"; // weekly or monthly

    // Generate mock S-curve combining multiple projects
    // We'll create 12 periods representing a generic portfolio curve
    const periods = Array.from({ length: 12 }, (_, i) => {
      const periodLabel = type === "weekly" ? `M${i + 1}` : `Bulan ${i + 1}`;
      
      // Logistic curve math approximation for S-Curve
      // f(x) = L / (1 + e^(-k(x-x0)))
      const x = i;
      const L = 100;
      const k = 0.8;
      const x0 = 5; // midpoint
      
      const planned = L / (1 + Math.exp(-k * (x - x0)));
      
      // Actual lags slightly behind
      const actualK = 0.75;
      const actualX0 = 5.5;
      let actual = L / (1 + Math.exp(-actualK * (x - actualX0)));
      
      // If period is in the future (> week 8), actual is null
      const isFuture = i > 7;

      return {
        period: periodLabel,
        periodDate: new Date(Date.now() + i * 7 * 86400000).toISOString(),
        planned: Number(planned.toFixed(1)),
        actual: isFuture ? null : Number(actual.toFixed(1)),
      };
    });

    return NextResponse.json(periods);
  } catch (error) {
    return NextResponse.json([]);
  }
}
