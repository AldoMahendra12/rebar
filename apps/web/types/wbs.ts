// WBS & S-Curve Types

export interface WbsRow {
  id: string;
  projectId: string;
  organizationId?: string;
  parentId: string | null;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  unit: string;
  volume: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  weight: number | null; // % bobot dari total proyek
  sortOrder: number;
  isLeaf: boolean;
  children?: WbsRow[];
  // UI state
  isEditing?: boolean;
  isNew?: boolean;
}

export interface WbsTableState {
  rows: WbsRow[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

// S-Curve Types
export interface PeriodData {
  periodDate: string; // ISO date
  periodLabel: string; // "W1", "Jan", etc.
  plannedPeriod: number; // % bobot tertimbang per periode (non-cumulative)
  actualPeriod: number;
  plannedCumulative: number; // running sum
  actualCumulative: number;
  deviation: number; // actual - planned cumulative
}

export interface WbsProgressRow {
  wbsItemId: string;
  code: string;
  name: string;
  level: number;
  weight: number; // bobot %
  unit: string;
  periods: {
    periodDate: string;
    planned: number; // % rencana periode ini untuk item ini
    actual: number;
  }[];
  totalPlanned: number; // sum semua periode (harus = 100)
  totalActual: number;
}

export interface SCurveData {
  periods: PeriodData[];
  plannedToDate: number;
  actualToDate: number;
  deviation: number;
  estimatedCompletion: string | null;
  status: "on_track" | "behind" | "ahead";
}

export interface ProjectDetail {
  id: string;
  name: string;
  code: string;
  clientName: string;
  location: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: string;
  periodType: "weekly" | "monthly";
  description?: string;
}
