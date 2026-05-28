export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type DeviationStatus = "on_track" | "behind" | "ahead";
export type UserRole = "owner" | "admin" | "pm" | "supervisor" | "viewer";
export type SubscriptionTier = "trial" | "starter" | "pro" | "business" | "enterprise";
export type PeriodType = "weekly" | "monthly";
export type BudgetCategory = "material" | "labor" | "equipment" | "subcon" | "overhead";
export type DocumentType = "drawing" | "contract" | "report" | "photo" | "other";

export interface ProjectCard {
  id: string;
  name: string;
  code: string;
  clientName: string;
  location: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  plannedProgress: number;
  actualProgress: number;
  deviation: number;
  deviationStatus: DeviationStatus;
  daysRemaining: number;
  periodType: PeriodType;
}

export interface DashboardKpi {
  totalProjects: number;
  activeProjects: number;
  totalContractValue: number;
  portfolioProgress: number;
  behindSchedule: number;
  onTrack: number;
  ahead: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  trialEndsAt?: string;
}
