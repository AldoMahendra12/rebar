import { WbsRow, SCurveData, PeriodData, WbsProgressRow, ProjectDetail } from "@/types/wbs";
import { addWeeks } from "date-fns";

// ─────────────────────────────────────
// MOCK PROJECT DETAIL
// ─────────────────────────────────────
export const MOCK_PROJECT: ProjectDetail = {
  id: "prj-001",
  name: "Gedung Perkantoran Tower A",
  code: "PRJ-001",
  clientName: "PT. Maju Bersama Tbk",
  location: "Jakarta Selatan",
  contractValue: 18_500_000_000,
  startDate: "2025-01-13",
  endDate: "2025-12-29",
  status: "active",
  periodType: "weekly",
  description: "Pembangunan gedung perkantoran 12 lantai di kawasan SCBD Jakarta Selatan.",
};

// ─────────────────────────────────────
// MOCK WBS DATA (3-level hierarchy)
// ─────────────────────────────────────
export const MOCK_WBS: WbsRow[] = [
  // ── Level 1: Pekerjaan Struktur
  {
    id: "wbs-1",
    projectId: "prj-001",
    parentId: null,
    code: "1",
    name: "Pekerjaan Struktur",
    level: 1,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 0,
    isLeaf: false,
  },
  // Level 2
  {
    id: "wbs-1-1",
    projectId: "prj-001",
    parentId: "wbs-1",
    code: "1.1",
    name: "Pekerjaan Pondasi",
    level: 2,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 0,
    isLeaf: false,
  },
  // Level 3 (leaf)
  {
    id: "wbs-1-1-1",
    projectId: "prj-001",
    parentId: "wbs-1-1",
    code: "1.1.1",
    name: "Galian Tanah Pondasi",
    level: 3,
    unit: "m³",
    volume: 450,
    unitPrice: 85_000,
    totalPrice: 38_250_000,
    weight: 4.12,
    sortOrder: 0,
    isLeaf: true,
  },
  {
    id: "wbs-1-1-2",
    projectId: "prj-001",
    parentId: "wbs-1-1",
    code: "1.1.2",
    name: "Beton Pondasi f'c 25 MPa",
    level: 3,
    unit: "m³",
    volume: 180,
    unitPrice: 1_450_000,
    totalPrice: 261_000_000,
    weight: 28.10,
    sortOrder: 1,
    isLeaf: true,
  },
  {
    id: "wbs-1-1-3",
    projectId: "prj-001",
    parentId: "wbs-1-1",
    code: "1.1.3",
    name: "Besi Tulangan Pondasi",
    level: 3,
    unit: "kg",
    volume: 24_000,
    unitPrice: 14_500,
    totalPrice: 348_000_000,
    weight: 37.47,
    sortOrder: 2,
    isLeaf: true,
  },
  // Level 2
  {
    id: "wbs-1-2",
    projectId: "prj-001",
    parentId: "wbs-1",
    code: "1.2",
    name: "Pekerjaan Kolom & Balok",
    level: 2,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 1,
    isLeaf: false,
  },
  {
    id: "wbs-1-2-1",
    projectId: "prj-001",
    parentId: "wbs-1-2",
    code: "1.2.1",
    name: "Beton Kolom f'c 30 MPa",
    level: 3,
    unit: "m³",
    volume: 120,
    unitPrice: 1_650_000,
    totalPrice: 198_000_000,
    weight: 21.32,
    sortOrder: 0,
    isLeaf: true,
  },
  {
    id: "wbs-1-2-2",
    projectId: "prj-001",
    parentId: "wbs-1-2",
    code: "1.2.2",
    name: "Besi Tulangan Kolom",
    level: 3,
    unit: "kg",
    volume: 6_200,
    unitPrice: 15_000,
    totalPrice: 93_000_000,
    weight: 10.01,
    sortOrder: 1,
    isLeaf: true,
  },
  // ── Level 1: Pekerjaan Arsitektur
  {
    id: "wbs-2",
    projectId: "prj-001",
    parentId: null,
    code: "2",
    name: "Pekerjaan Arsitektur",
    level: 1,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 1,
    isLeaf: false,
  },
  {
    id: "wbs-2-1",
    projectId: "prj-001",
    parentId: "wbs-2",
    code: "2.1",
    name: "Pekerjaan Dinding",
    level: 2,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 0,
    isLeaf: false,
  },
  {
    id: "wbs-2-1-1",
    projectId: "prj-001",
    parentId: "wbs-2-1",
    code: "2.1.1",
    name: "Pasangan Bata Ringan",
    level: 3,
    unit: "m²",
    volume: 2_400,
    unitPrice: 185_000,
    totalPrice: 444_000_000,
    weight: null, // will be recalculated
    sortOrder: 0,
    isLeaf: true,
  },
  {
    id: "wbs-2-2",
    projectId: "prj-001",
    parentId: "wbs-2",
    code: "2.2",
    name: "Pekerjaan Lantai",
    level: 2,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 1,
    isLeaf: false,
  },
  {
    id: "wbs-2-2-1",
    projectId: "prj-001",
    parentId: "wbs-2-2",
    code: "2.2.1",
    name: "Keramik Lantai 60x60",
    level: 3,
    unit: "m²",
    volume: 3_800,
    unitPrice: 265_000,
    totalPrice: 1_007_000_000,
    weight: null,
    sortOrder: 0,
    isLeaf: true,
  },
  // ── Level 1: MEP
  {
    id: "wbs-3",
    projectId: "prj-001",
    parentId: null,
    code: "3",
    name: "Pekerjaan MEP",
    level: 1,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 2,
    isLeaf: false,
  },
  {
    id: "wbs-3-1",
    projectId: "prj-001",
    parentId: "wbs-3",
    code: "3.1",
    name: "Instalasi Listrik",
    level: 2,
    unit: "",
    volume: null,
    unitPrice: null,
    totalPrice: null,
    weight: null,
    sortOrder: 0,
    isLeaf: false,
  },
  {
    id: "wbs-3-1-1",
    projectId: "prj-001",
    parentId: "wbs-3-1",
    code: "3.1.1",
    name: "Panel Listrik Utama",
    level: 3,
    unit: "unit",
    volume: 1,
    unitPrice: 85_000_000,
    totalPrice: 85_000_000,
    weight: null,
    sortOrder: 0,
    isLeaf: true,
  },
];

// ─────────────────────────────────────
// S-CURVE MOCK DATA (Weekly, 52 weeks)
// ─────────────────────────────────────

function generateWeeklyPeriods(
  startDate: Date,
  numWeeks: number,
  todayWeek: number
): PeriodData[] {
  // S-curve shape: slow start, fast middle, slow end
  // Using an S-shaped distribution function
  const plannedWeightPerPeriod: number[] = [];
  let sum = 0;

  for (let i = 0; i < numWeeks; i++) {
    // S-curve distribution: beta-like shape
    const x = (i + 0.5) / numWeeks;
    const bell = Math.exp(-Math.pow((x - 0.55) / 0.22, 2) / 2);
    plannedWeightPerPeriod.push(bell);
    sum += bell;
  }

  // Normalize to sum = 100
  const normalised = plannedWeightPerPeriod.map((v) => (v / sum) * 100);

  // Actual: mostly follows plan but slightly behind
  const actualWeightPerPeriod = normalised.map((v, i) => {
    if (i >= todayWeek) return 0;
    const lag = i < 10 ? 0.8 : i < 20 ? 0.92 : 0.97;
    // Gunakan fungsi pseudo-random deterministik (Math.sin) agar hasil SSR dan Client sama (mencegah hydration mismatch)
    const pseudoRandom = Math.sin(i * 13.7) * 0.03;
    return v * lag * (1 + pseudoRandom);
  });

  const periods: PeriodData[] = [];
  let plannedCum = 0;
  let actualCum = 0;

  for (let i = 0; i < numWeeks; i++) {
    const weekStart = addWeeks(startDate, i);
    plannedCum += normalised[i];
    if (i < todayWeek) {
      actualCum += actualWeightPerPeriod[i];
    }

    periods.push({
      periodDate: weekStart.toISOString(),
      periodLabel: `W${i + 1}`,
      plannedPeriod: parseFloat(normalised[i].toFixed(2)),
      actualPeriod: i < todayWeek ? parseFloat(actualWeightPerPeriod[i].toFixed(2)) : 0,
      plannedCumulative: parseFloat(Math.min(plannedCum, 100).toFixed(2)),
      actualCumulative: i < todayWeek ? parseFloat(Math.min(actualCum, 100).toFixed(2)) : 0,
      deviation: i < todayWeek
        ? parseFloat((Math.min(actualCum, 100) - Math.min(plannedCum, 100)).toFixed(2))
        : 0,
    });
  }

  return periods;
}

const projectStart = new Date("2025-01-13");
const NUM_WEEKS = 51;
// Today = week 19 (about 4.5 months in)
const TODAY_WEEK = 19;

export const MOCK_SCURVE_DATA: SCurveData = (() => {
  const periods = generateWeeklyPeriods(projectStart, NUM_WEEKS, TODAY_WEEK);
  const latest = periods[TODAY_WEEK - 1];

  return {
    periods,
    plannedToDate: latest?.plannedCumulative ?? 0,
    actualToDate: latest?.actualCumulative ?? 0,
    deviation: latest?.deviation ?? 0,
    estimatedCompletion: "2026-02-09", // slightly behind
    status: "behind",
  };
})();

// ─────────────────────────────────────
// MOCK PROGRESS PLANNING DATA
// ─────────────────────────────────────
export const MOCK_WBS_PROGRESS: WbsProgressRow[] = [
  {
    wbsItemId: "wbs-1-1-1",
    code: "1.1.1",
    name: "Galian Tanah Pondasi",
    level: 3,
    weight: 4.12,
    unit: "m³",
    periods: Array.from({ length: NUM_WEEKS }, (_, i) => ({
      periodDate: addWeeks(projectStart, i).toISOString(),
      planned: i < 4 ? 25 : 0, // done in first 4 weeks
      actual: i < 4 ? 25 : 0,
    })),
    totalPlanned: 100,
    totalActual: 100,
  },
  {
    wbsItemId: "wbs-1-1-2",
    code: "1.1.2",
    name: "Beton Pondasi f'c 25 MPa",
    level: 3,
    weight: 28.10,
    unit: "m³",
    periods: Array.from({ length: NUM_WEEKS }, (_, i) => ({
      periodDate: addWeeks(projectStart, i).toISOString(),
      planned: i >= 2 && i < 10 ? 12.5 : 0,
      actual: i >= 2 && i < 10 ? (i < 7 ? 11 : 13) : 0,
    })),
    totalPlanned: 100,
    totalActual: 88,
  },
  {
    wbsItemId: "wbs-1-1-3",
    code: "1.1.3",
    name: "Besi Tulangan Pondasi",
    level: 3,
    weight: 37.47,
    unit: "kg",
    periods: Array.from({ length: NUM_WEEKS }, (_, i) => ({
      periodDate: addWeeks(projectStart, i).toISOString(),
      planned: i >= 3 && i < 19 ? 6.25 : 0,
      actual: i >= 3 && i < 19 ? (i < TODAY_WEEK ? 5.8 : 0) : 0,
    })),
    totalPlanned: 100,
    totalActual: 23.2,
  },
];

// ─────────────────────────────────────
// MOCK BUDGET & COST CONTROL DATA
// ─────────────────────────────────────

import { BudgetItem, CostActual } from "@/types/budget";

export const MOCK_BUDGET_ITEMS: BudgetItem[] = [
  {
    id: "budget-mat",
    projectId: "prj-001",
    category: "material",
    description: "Pembelian Semen, Besi, Pasir, Batu Bata",
    budgetedAmount: 8_500_000_000,
  },
  {
    id: "budget-lab",
    projectId: "prj-001",
    category: "labor",
    description: "Upah Tukang dan Mandor",
    budgetedAmount: 4_200_000_000,
  },
  {
    id: "budget-eq",
    projectId: "prj-001",
    category: "equipment",
    description: "Sewa Alat Berat, Crane, Excavator",
    budgetedAmount: 2_100_000_000,
  },
  {
    id: "budget-sub",
    projectId: "prj-001",
    category: "subcon",
    description: "Subkontraktor MEP & Interior",
    budgetedAmount: 2_800_000_000,
  },
  {
    id: "budget-ovh",
    projectId: "prj-001",
    category: "overhead",
    description: "Biaya Operasional Lapangan & Keamanan",
    budgetedAmount: 900_000_000,
  },
];

export const MOCK_COST_ACTUALS: CostActual[] = [
  {
    id: "cost-1",
    budgetItemId: "budget-mat",
    amount: 150_000_000,
    description: "Besi Beton Ulir 16mm",
    transactionDate: "2025-02-10T10:00:00Z",
  },
  {
    id: "cost-2",
    budgetItemId: "budget-lab",
    amount: 85_000_000,
    description: "Upah Tukang Minggu ke-4",
    transactionDate: "2025-02-12T16:00:00Z",
  },
  {
    id: "cost-3",
    budgetItemId: "budget-eq",
    amount: 45_000_000,
    description: "Sewa Excavator PC200 (Bulan 1)",
    transactionDate: "2025-02-15T09:00:00Z",
  },
  {
    id: "cost-4",
    budgetItemId: "budget-mat",
    amount: 220_000_000,
    description: "Semen Holcim 50kg",
    transactionDate: "2025-03-01T11:30:00Z",
  },
  {
    id: "cost-5",
    budgetItemId: "budget-ovh",
    amount: 12_500_000,
    description: "Listrik & Air Lapangan Bulan Februari",
    transactionDate: "2025-03-05T10:00:00Z",
  },
];

// ─────────────────────────────────────
// MOCK DOCUMENTS DATA
// ─────────────────────────────────────

import { ProjectDocument } from "@/types/document";

export const MOCK_DOCUMENTS: ProjectDocument[] = [
  {
    id: "doc-1",
    projectId: "prj-001",
    name: "Gambar Kerja Arsitektur (For Construction).pdf",
    fileUrl: "#",
    fileType: "drawing",
    uploadedBy: "Budi Santoso",
    createdAt: "2025-01-10T08:30:00Z",
    sizeBytes: 15_400_000,
  },
  {
    id: "doc-2",
    projectId: "prj-001",
    name: "Kontrak Perjanjian Pemborongan.pdf",
    fileUrl: "#",
    fileType: "contract",
    uploadedBy: "Andi Saputra",
    createdAt: "2025-01-12T14:15:00Z",
    sizeBytes: 2_100_000,
  },
  {
    id: "doc-3",
    projectId: "prj-001",
    name: "Laporan Mingguan W12.pdf",
    fileUrl: "#",
    fileType: "report",
    uploadedBy: "Siti Aminah",
    createdAt: "2025-04-07T16:45:00Z",
    sizeBytes: 4_800_000,
  },
  {
    id: "doc-4",
    projectId: "prj-001",
    name: "Foto Pengecoran Pondasi.jpg",
    fileUrl: "#",
    fileType: "photo",
    uploadedBy: "Agus Mandor",
    createdAt: "2025-02-15T11:20:00Z",
    sizeBytes: 3_200_000,
  },
  {
    id: "doc-5",
    projectId: "prj-001",
    name: "BAP Termin 1.pdf",
    fileUrl: "#",
    fileType: "other",
    uploadedBy: "Andi Saputra",
    createdAt: "2025-03-20T09:10:00Z",
    sizeBytes: 1_500_000,
  },
];
