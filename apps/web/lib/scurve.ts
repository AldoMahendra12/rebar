/**
 * S-Curve Calculation Engine
 * Sesuai PRD section 6.7
 */

import { WbsRow } from "@/types/wbs";
import { PeriodData, SCurveData, WbsProgressRow } from "@/types/wbs";

/**
 * Hitung bobot % tiap leaf node berdasarkan totalPrice-nya
 */
export function calculateWeights(rows: WbsRow[]): WbsRow[] {
  const leaves = rows.filter((r) => r.isLeaf && r.totalPrice != null);
  const totalValue = leaves.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);

  if (totalValue === 0) return rows;

  return rows.map((row) => {
    if (row.isLeaf && row.totalPrice != null) {
      return {
        ...row,
        weight: parseFloat(((row.totalPrice / totalValue) * 100).toFixed(4)),
      };
    }
    return { ...row, weight: null };
  });
}

/**
 * Hitung totalPrice = volume * unitPrice untuk setiap row
 */
export function calculateTotals(rows: WbsRow[]): WbsRow[] {
  return rows.map((row) => {
    if (row.volume != null && row.unitPrice != null) {
      return {
        ...row,
        totalPrice: parseFloat((row.volume * row.unitPrice).toFixed(0)),
      };
    }
    return row;
  });
}

/**
 * Untuk setiap periode T:
 * plannedCumulative(T) = Σ [weight(i) × cumulativePlanned%(i, T)]
 * actualCumulative(T)  = Σ [weight(i) × cumulativeActual%(i, T)]
 * deviation(T)         = actualCumulative(T) - plannedCumulative(T)
 */
export function calculateSCurve(
  wbsProgress: WbsProgressRow[],
  totalPeriods: number
): SCurveData {
  const periodData: PeriodData[] = [];

  for (let t = 0; t < totalPeriods; t++) {
    let plannedCumulative = 0;
    let actualCumulative = 0;

    for (const item of wbsProgress) {
      const weight = item.weight / 100; // convert % to decimal

      // Cumulative planned % for item up to period t
      let cumPlanned = 0;
      let cumActual = 0;
      for (let k = 0; k <= t; k++) {
        cumPlanned += item.periods[k]?.planned ?? 0;
        cumActual += item.periods[k]?.actual ?? 0;
      }

      // Weighted contribution
      plannedCumulative += weight * Math.min(cumPlanned, 100);
      actualCumulative += weight * Math.min(cumActual, 100);
    }

    const prevPlanned = t > 0 ? periodData[t - 1].plannedCumulative : 0;
    const prevActual = t > 0 ? periodData[t - 1].actualCumulative : 0;

    periodData.push({
      periodDate: wbsProgress[0]?.periods[t]?.periodDate ?? "",
      periodLabel: `W${t + 1}`,
      plannedPeriod: parseFloat((plannedCumulative - prevPlanned).toFixed(2)),
      actualPeriod: parseFloat((actualCumulative - prevActual).toFixed(2)),
      plannedCumulative: parseFloat(plannedCumulative.toFixed(2)),
      actualCumulative: parseFloat(actualCumulative.toFixed(2)),
      deviation: parseFloat((actualCumulative - plannedCumulative).toFixed(2)),
    });
  }

  // Find today's data (last period with actual > 0)
  const todayIdx = periodData.reduce((last, p, i) => {
    return p.actualCumulative > 0 ? i : last;
  }, 0);

  const todayData = periodData[todayIdx];

  // Estimate completion via linear projection
  let estimatedCompletion: string | null = null;
  if (todayIdx > 0 && todayData.actualCumulative < 100) {
    const rate = todayData.actualCumulative / (todayIdx + 1); // % per period
    if (rate > 0) {
      const remainingPeriods = Math.ceil((100 - todayData.actualCumulative) / rate);
      const lastDate = new Date(todayData.periodDate);
      lastDate.setDate(lastDate.getDate() + remainingPeriods * 7);
      estimatedCompletion = lastDate.toISOString().split("T")[0];
    }
  }

  const deviation = todayData?.deviation ?? 0;

  return {
    periods: periodData,
    plannedToDate: todayData?.plannedCumulative ?? 0,
    actualToDate: todayData?.actualCumulative ?? 0,
    deviation,
    estimatedCompletion,
    status: deviation < -5 ? "behind" : deviation > 5 ? "ahead" : "on_track",
  };
}

/**
 * Build hierarchical WBS tree dari flat list
 */
export function buildWbsTree(rows: WbsRow[]): WbsRow[] {
  const map = new Map<string, WbsRow>();
  const roots: WbsRow[] = [];

  rows.forEach((row) => {
    map.set(row.id, { ...row, children: [] });
  });

  rows.forEach((row) => {
    const node = map.get(row.id)!;
    if (row.parentId) {
      const parent = map.get(row.parentId);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Flatten tree back to sorted array
 */
export function flattenWbsTree(roots: WbsRow[]): WbsRow[] {
  const result: WbsRow[] = [];

  function traverse(nodes: WbsRow[]) {
    const sorted = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of sorted) {
      const { children, ...row } = node;
      result.push(row);
      if (children && children.length > 0) {
        traverse(children);
      }
    }
  }

  traverse(roots);
  return result;
}

/**
 * Format rupiah compact
 */
export function fmtIDR(v: number | null): string {
  if (v == null) return "-";
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  return new Intl.NumberFormat("id-ID").format(v);
}
