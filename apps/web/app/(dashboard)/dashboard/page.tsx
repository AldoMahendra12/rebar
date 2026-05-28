"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/stores/navigation-store";
import { PageHeader } from "@/components/sections/dashboard/PageHeader";
import { KpiBar } from "@/components/sections/dashboard/KpiBar";
import { AttentionPanel } from "@/components/sections/dashboard/AttentionPanel";
import { ActivityFeed } from "@/components/sections/dashboard/ActivityFeed";
import { PortfolioSCurve } from "@/components/sections/dashboard/PortfolioSCurve";
import { DeadlinesPanel } from "@/components/sections/dashboard/DeadlinesPanel";
import { DashboardSkeleton } from "@/components/sections/dashboard/DashboardSkeleton";

export default function DashboardPage() {
  const router = useRouter();
  const { activeProjectId, clearActiveProject } = useNavigationStore();
  const [verifying, setVerifying] = useState(!!activeProjectId);

  useEffect(() => {
    if (!activeProjectId) {
      setVerifying(false);
      return;
    }

    fetch(`/api/projects/${activeProjectId}/verify`)
      .then((res) => {
        if (res.ok) {
          router.replace(`/projects/${activeProjectId}`);
        } else {
          clearActiveProject();
          setVerifying(false);
        }
      })
      .catch(() => {
        clearActiveProject();
        setVerifying(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (verifying) return <DashboardSkeleton />;

  return (
    <main className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* PAGE HEADER */}
      <PageHeader />

      {/* ROW 1: KPI BAR */}
      <KpiBar />

      {/* ROW 2: ATTENTION + ACTIVITY (2 kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttentionPanel />
        <ActivityFeed />
      </div>

      {/* ROW 3: PORTFOLIO S-CURVE + DEADLINES (3:2 ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PortfolioSCurve />
        </div>
        <div className="lg:col-span-2">
          <DeadlinesPanel />
        </div>
      </div>
    </main>
  );
}
