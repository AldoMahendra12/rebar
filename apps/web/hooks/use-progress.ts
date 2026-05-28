import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProgressPeriod {
  periodDate: string;
  periodLabel: string;
  periodType: string;
  status: "empty" | "draft" | "submitted" | "locked";
  submittedAt: string | null;
  submittedByName: string | null;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface ProgressPhoto {
  id: string;
  fileUrl: string;
  fileName: string;
}

export interface ProgressItem {
  wbsItemId: string;
  code: string;
  name: string;
  level: number;
  isLeaf: boolean;
  unit: string | null;
  weight: number;
  plannedThisPeriod: number;
  plannedCumulative: number;
  actualThisPeriod: number | null;
  actualCumulative: number | null;
  isSubmitted: boolean;
  notes: string | null;
  photos: ProgressPhoto[];
}

export interface ProgressSummary {
  weightedPlannedThisPeriod: number;
  weightedActualThisPeriod: number;
  weightedPlannedCumulative: number;
  weightedActualCumulative: number;
  deviation: number;
  completedItems: number;
  totalLeafItems: number;
}

export interface ProgressDataResponse {
  period: {
    periodDate: string;
    periodLabel: string;
    periodType: string;
    status: string;
    isLocked: boolean;
  };
  items: ProgressItem[];
  summary: ProgressSummary;
}

export function useProgressPeriods(projectId: string) {
  return useQuery<ProgressPeriod[]>({
    queryKey: ["progress-periods", projectId],
    queryFn: () => fetch(`/api/projects/${projectId}/progress/periods`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProgressData(projectId: string, periodDate: string | null) {
  return useQuery<ProgressDataResponse>({
    queryKey: ["progress-data", projectId, periodDate],
    queryFn: () => fetch(`/api/projects/${projectId}/progress/${periodDate}`).then(r => r.json()),
    enabled: !!periodDate,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveProgress(projectId: string, periodDate: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { items: any[]; action: "draft" | "submit" }) =>
      fetch(`/api/projects/${projectId}/progress/${periodDate}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    
    onSuccess: (_, variables) => {
      if (!periodDate) return;
      queryClient.invalidateQueries({ queryKey: ["progress-data", projectId, periodDate] });
      queryClient.invalidateQueries({ queryKey: ["progress-periods", projectId] });
      
      if (variables.action === "submit") {
        queryClient.invalidateQueries({ queryKey: ["s-curve", projectId] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-kpi"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-attention"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-portfolio-scurve"] });
      }
    }
  });
}

export function useLockProgress(projectId: string, periodDate: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (locked: boolean) =>
      fetch(`/api/projects/${projectId}/progress/${periodDate}/lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked }),
      }).then(r => r.json()),
    
    onSuccess: () => {
      if (!periodDate) return;
      queryClient.invalidateQueries({ queryKey: ["progress-data", projectId, periodDate] });
      queryClient.invalidateQueries({ queryKey: ["progress-periods", projectId] });
    }
  });
}
