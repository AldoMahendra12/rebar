# Navigation & User Flow Redesign Prompt
# Contractor Management SaaS — Adaptive Sidebar + Simplified Flow
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT

```
Kamu adalah senior fullstack engineer yang membantu saya redesign 
navigation flow dari contractor management SaaS.

Masalah saat ini: User harus melalui terlalu banyak langkah untuk 
sampai ke fitur utama:
  Login → Dashboard → Pilih Proyek → Halaman Proyek → Pilih Fitur

Target setelah redesign:
  Login → Dashboard → Klik Project Card → Langsung di fitur (sidebar sudah ganti)
  Login kedua kali → Auto redirect ke proyek terakhir → Langsung kerja

Tech stack:
- Next.js 14 App Router + TypeScript
- Clerk (auth)
- Prisma + Neon (database)
- Shadcn/ui + Tailwind + Framer Motion
- Zustand (state management)

Aturan:
- Sidebar TETAP ADA di semua halaman
- Sidebar bersifat ADAPTIF: kontennya berubah tergantung konteks
- Tidak boleh ada halaman perantara yang tidak perlu
- Semua perubahan harus type-safe (TypeScript strict)
```

---

## STEP 1 — Zustand Store untuk Navigation State

```
Buat file stores/navigation-store.ts:

Gunakan Zustand untuk manage global navigation state.

State yang dibutuhkan:
  activeProjectId: string | null     → proyek yang sedang aktif
  activeProjectName: string | null   → nama proyek aktif (untuk display sidebar)
  activeProjectCode: string | null   → kode proyek
  sidebarMode: 'global' | 'project' → mode sidebar saat ini

Actions:
  setActiveProject(project: { id, name, code } | null) → set proyek aktif + switch sidebar mode
  clearActiveProject() → kembali ke global mode
  
Persist ke localStorage dengan key 'last-active-project':
  Simpan activeProjectId saja (bukan semua state)
  Saat app load, cek localStorage → kalau ada → restore activeProjectId

Contoh implementasi:

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationState {
  activeProjectId: string | null
  activeProjectName: string | null
  activeProjectCode: string | null
  sidebarMode: 'global' | 'project'
  setActiveProject: (project: { id: string; name: string; code: string } | null) => void
  clearActiveProject: () => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      activeProjectName: null,
      activeProjectCode: null,
      sidebarMode: 'global',
      setActiveProject: (project) => set({
        activeProjectId: project?.id ?? null,
        activeProjectName: project?.name ?? null,
        activeProjectCode: project?.code ?? null,
        sidebarMode: project ? 'project' : 'global',
      }),
      clearActiveProject: () => set({
        activeProjectId: null,
        activeProjectName: null,
        activeProjectCode: null,
        sidebarMode: 'global',
      }),
    }),
    {
      name: 'last-active-project',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }),
    }
  )
)
```

---

## STEP 2 — Adaptive Sidebar Component

```
Buat/redesign components/sidebar.tsx menjadi sidebar adaptif.

Sidebar memiliki DUA mode yang bisa switch dengan smooth animation:

══════════════════════════════════════
MODE 1: GLOBAL SIDEBAR
(Muncul saat tidak ada proyek aktif)
══════════════════════════════════════

Layout:
┌─────────────────────────┐
│  [Logo] NamaApp         │
│  nama-organisasi        │
├─────────────────────────┤
│                         │
│  Dashboard              │
│  Semua Proyek           │
│                         │
├─────────────────────────┤
│  PENGATURAN             │
│  Tim                    │
│  Billing                │
├─────────────────────────┤
│  [Avatar] Nama User     │
│  role · Settings        │
└─────────────────────────┘

Nav items global:
  - Dashboard       → /dashboard          icon: LayoutGrid
  - Semua Proyek    → /projects           icon: FolderKanban

Group "Pengaturan":
  - Tim             → /settings/team      icon: Users
  - Billing         → /settings/billing   icon: CreditCard

══════════════════════════════════════
MODE 2: PROJECT SIDEBAR
(Muncul saat ada proyek aktif)
══════════════════════════════════════

Layout:
┌─────────────────────────┐
│  [Logo] NamaApp         │
├─────────────────────────┤
│  ← Semua Proyek         │  ← back button
├─────────────────────────┤
│  ┌─────────────────┐    │
│  │ PRJ-001       ▾ │    │  ← Project Switcher
│  │ Nama Proyek     │    │
│  └─────────────────┘    │
├─────────────════════════┤
│                         │
│  Overview               │
│  WBS & RAB              │
│  S-Curve & Progress     │
│  Budget & Cost          │
│  Dokumen                │
│  Laporan                │
│                         │
├─────────────────────────┤
│  Pengaturan Proyek      │
├─────────────────────────┤
│  [Avatar] Nama User     │
└─────────────────────────┘

Nav items project:
  - Overview            → /projects/[id]              icon: LayoutDashboard
  - WBS & RAB           → /projects/[id]/wbs          icon: ListTree
  - S-Curve & Progress  → /projects/[id]/s-curve      icon: TrendingUp
  - Budget & Cost       → /projects/[id]/budget       icon: Wallet
  - Dokumen             → /projects/[id]/documents    icon: FileStack
  - Laporan             → /projects/[id]/reports      icon: FileBarChart

══════════════════════════════════════
BACK BUTTON ("← Semua Proyek"):
══════════════════════════════════════
  - Klik → clearActiveProject() → sidebar kembali ke global mode
  - Navigate ke /dashboard
  - Style: text-sm text-muted-foreground hover:text-foreground
           flex items-center gap-1.5 py-2 px-3
           icon: ChevronLeft size 14

══════════════════════════════════════
PROJECT SWITCHER:
══════════════════════════════════════
  - Tampilkan nama proyek aktif + kode
  - Dropdown saat klik → list semua proyek aktif user
  - Pilih proyek lain → setActiveProject() + navigate ke /projects/[id]
  - Style:
      Container: bg-zinc-50 rounded-lg px-3 py-2.5 mx-2 cursor-pointer
      Hover: bg-zinc-100
      Nama proyek: text-sm font-medium text-foreground truncate
      Kode proyek: text-xs text-muted-foreground font-mono
      Chevron: ChevronDown size 14 text-zinc-400 ml-auto

  Dropdown (Shadcn Popover):
    - Max height: 200px overflow-y-auto
    - Tiap item: nama proyek + kode + status badge
    - Active item: bg-primary/8 text-primary
    - "+ Buat Proyek Baru" di paling bawah

══════════════════════════════════════
NAV ITEM STYLING (sama untuk kedua mode):
══════════════════════════════════════
  Default:   text-sm text-muted-foreground, icon opacity-60
  Hover:     bg-zinc-100 text-foreground, icon opacity-100
             transition-colors duration-150
  Active:    bg-primary/8 text-primary font-medium
             Framer Motion layoutId="active-nav-indicator"

  Padding: px-3 py-2 mx-2 rounded-lg
  Icon size: 16px
  Gap: gap-2.5

══════════════════════════════════════
FRAMER MOTION SIDEBAR TRANSITIONS:
══════════════════════════════════════

Saat switch global → project (dan sebaliknya):
  AnimatePresence mode="wait"
  
  Global nav exit:   opacity 0, x -8, duration 0.15s
  Project nav enter: opacity 0, x 8 → opacity 1, x 0, duration 0.2s
  
  Back button:   fade-in dari atas saat masuk project mode
  Project switcher: scale 0.98 → 1 saat muncul

Active nav indicator:
  Gunakan layoutId="nav-active" untuk smooth slide antar item
  
Sidebar width: fixed 240px, tidak collapse di desktop

══════════════════════════════════════
USER SECTION (bottom, sama di kedua mode):
══════════════════════════════════════
  Border top: border-t border-zinc-100
  Padding: p-3
  
  Layout: flex items-center gap-3
    Avatar: Clerk UserButton component (28px)
    Info:
      Nama: text-sm font-medium text-foreground truncate
      Role: text-xs text-muted-foreground capitalize
    Settings icon: kanan, ghost icon button
```

---

## STEP 3 — Dashboard: Project Card yang Bisa Navigate

```
Update halaman /dashboard/page.tsx dan project card component.

Perubahan utama pada Project Card:
  Seluruh card clickable → klik manapun di card → masuk ke proyek

OnClick handler untuk project card:
  1. Panggil setActiveProject({ id, name, code }) dari navigation store
  2. router.push(`/projects/${project.id}`)
  3. Sidebar otomatis switch ke project mode karena store berubah

Tambahkan visual cue bahwa card clickable:
  - Cursor: pointer
  - Hover: translateY(-2px) + shadow lebih besar
  - Tidak perlu tombol "Buka Proyek" yang terpisah
  - Subtle arrow icon (ArrowRight) di pojok kanan bawah card
    opacity-0 saat default → opacity-100 saat hover
    Framer Motion: animate opacity

Update card footer:
  Hapus tombol "Open Project" yang ada sekarang
  Ganti dengan arrow indicator subtle di kanan bawah

Tambahkan tooltip saat hover card:
  "Klik untuk masuk ke proyek"
  Shadcn Tooltip, delay 500ms
```

---

## STEP 4 — Last Opened Project: Auto Redirect

```
Buat logika auto-redirect saat user login.

Lokasi: app/dashboard/page.tsx (atau middleware)

Logika:
  1. Saat user pertama load /dashboard:
     - Ambil activeProjectId dari Zustand store (sudah persist di localStorage)
     - Kalau activeProjectId ada:
         a. Verify dulu project masih exist dan user punya akses (fetch ke API)
         b. Kalau valid → redirect ke /projects/[activeProjectId]
         c. Kalau tidak valid (project dihapus/tidak ada akses) → 
            clearActiveProject() → tetap di dashboard
     - Kalau tidak ada → tampilkan dashboard normal

  2. Implementasi di page.tsx:

"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigationStore } from '@/stores/navigation-store'

export default function DashboardPage() {
  const router = useRouter()
  const { activeProjectId, clearActiveProject } = useNavigationStore()

  useEffect(() => {
    if (!activeProjectId) return

    // Verify project still exists and accessible
    fetch(`/api/projects/${activeProjectId}/verify`)
      .then(res => {
        if (res.ok) {
          router.replace(`/projects/${activeProjectId}`)
        } else {
          clearActiveProject()
        }
      })
      .catch(() => clearActiveProject())
  }, []) // Run once on mount

  // Render dashboard normally (akan redirect kalau ada lastProject)
  return <DashboardContent />
}

  3. Buat API route app/api/projects/[id]/verify/route.ts:
     GET → cek project exist + organizationId match → return 200 atau 404
     Ringan, tidak perlu return data proyek

  4. Loading state saat verifying:
     Tampilkan skeleton dashboard sebentar
     Jangan flash konten dashboard sebelum redirect
     Gunakan loading.tsx di folder dashboard
```

---

## STEP 5 — Project Overview Page (Landing per Proyek)

```
Update halaman /projects/[id]/page.tsx menjadi project overview 
yang informatif — bukan halaman dengan grid fitur card seperti sekarang.

Halaman ini adalah "home" per proyek setelah user masuk.
Sidebar sudah ada fitur-fitur sebagai nav, jadi halaman ini 
TIDAK perlu menampilkan grid fitur lagi.

Ganti konten halaman dengan:

══════════════════════════════════════
HEADER
══════════════════════════════════════
  Nama proyek: font-display text-2xl font-semibold
  Kode + klien + lokasi: text-sm text-muted-foreground inline dengan separator "·"
  Status badge
  Kanan: tombol "Edit Info Proyek" outline

══════════════════════════════════════
MINI S-CURVE (highlight utama)
══════════════════════════════════════
  Card full-width
  S-Curve ringkas: hanya planned vs actual, tanpa lower chart
  Height: 200px
  Tampilkan 3 metrics di samping chart:
    Planned %, Actual %, Deviasi %
  Link "Lihat S-Curve Detail →" di pojok kanan atas card

══════════════════════════════════════
GRID 3 KOLOM (info ringkas)
══════════════════════════════════════

  Card 1 — Informasi Kontrak:
    Nilai kontrak, tanggal mulai, tanggal selesai
    Sisa hari (highlight kalau < 30 hari)

  Card 2 — Budget Ringkas:
    Total budget vs aktual spending
    Progress bar utilization
    Link "Lihat Detail →"

  Card 3 — Aktivitas Terakhir:
    List 3-5 progress input terakhir
    Siapa yang input, kapan, periode berapa
    Link "Lihat Semua →"

══════════════════════════════════════
QUICK ACTIONS (bukan grid fitur besar)
══════════════════════════════════════
  Row kecil di bawah grid:
  "Aksi cepat:" label
  Tombol-tombol kecil outline:
    [+ Input Progress]  [+ Catat Biaya]  [Upload Dokumen]  [Buat Laporan]
  
  Ini shortcut, bukan navigasi utama — navigasi utama ada di sidebar

HAPUS: Grid fitur card yang ada sekarang (WBS Builder, S-Curve, Budget, Dokumen)
  karena fungsinya sudah digantikan oleh sidebar
```

---

## STEP 6 — Route Structure Update

```
Pastikan route structure mendukung sidebar adaptif.

Update app/layout.tsx atau buat layout baru:

Buat app/(app)/layout.tsx yang wraps semua halaman authenticated:
  - Include Sidebar component
  - Sidebar membaca state dari Zustand store
  - Main content area di sebelah kanan sidebar

Structure:

app/
  (auth)/
    sign-in/
    sign-up/
    onboarding/
    layout.tsx  ← NO sidebar
  
  (app)/
    layout.tsx  ← ADA sidebar (adaptive)
    dashboard/
      page.tsx
      loading.tsx
    projects/
      page.tsx       ← list semua proyek
      new/
        page.tsx     ← wizard buat proyek baru
      [id]/
        page.tsx     ← project overview (BUKAN grid fitur)
        wbs/
        planning/
        s-curve/
        budget/
        documents/
        reports/

app/(app)/layout.tsx:

import { Sidebar } from '@/components/sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

Pastikan:
  - Sidebar width: 240px fixed, tidak scroll
  - Main content: flex-1, overflow-y-auto (yang scroll bukan whole page)
  - Tidak ada double scrollbar
```

---

## STEP 7 — Sync Sidebar dengan URL

```
Sidebar harus sync dua arah dengan URL:

1. Saat user navigate langsung ke /projects/[id]/wbs (misal dari bookmark):
   - useEffect di sidebar atau layout detect URL
   - Extract projectId dari URL params
   - Fetch project info (nama, kode)
   - setActiveProject() otomatis
   - Sidebar switch ke project mode

2. Saat user klik back browser ke /dashboard:
   - Detect URL kembali ke /dashboard
   - clearActiveProject() 
   - Sidebar kembali ke global mode

Implementasi di app/(app)/layout.tsx:

"use client"
import { useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useNavigationStore } from '@/stores/navigation-store'

export default function AppLayout({ children }) {
  const params = useParams()
  const pathname = usePathname()
  const { setActiveProject, clearActiveProject, activeProjectId } = useNavigationStore()
  
  useEffect(() => {
    const projectId = params?.id as string
    
    if (projectId && projectId !== activeProjectId) {
      // User navigated directly to a project URL
      fetch(`/api/projects/${projectId}/basic-info`)
        .then(res => res.json())
        .then(project => {
          if (project) setActiveProject(project)
        })
        .catch(() => {})
    }
    
    if (!pathname.includes('/projects/') || !params?.id) {
      // User left project area
      clearActiveProject()
    }
  }, [pathname, params?.id])

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

Buat API route app/api/projects/[id]/basic-info/route.ts:
  GET → return { id, name, code } saja
  Ringan, dipanggil untuk sync sidebar state
```

---

## FINAL FLOW SETELAH REDESIGN

```
FLOW BARU — USER PERTAMA KALI:
  Landing Page
    ↓ Klik Login
  Dashboard (Global Sidebar: Dashboard, Semua Proyek)
    ↓ Klik project card
  Project Overview (Project Sidebar: semua fitur sebagai nav)
    ↓ Klik "WBS & RAB" di sidebar
  WBS Builder — langsung kerja ✅

FLOW BARU — USER RETURNING (sudah pernah buka proyek):
  Landing Page
    ↓ Klik Login
  Dashboard (loading sebentar...)
    ↓ Auto-redirect ke proyek terakhir
  Project Overview — langsung di proyek ✅
    ↓ Klik fitur di sidebar
  Langsung kerja ✅

FLOW GANTI PROYEK:
  Di dalam proyek
    ↓ Klik Project Switcher di sidebar
  Dropdown muncul → pilih proyek lain
    ↓ 
  Masuk ke proyek baru — sidebar update ✅

FLOW KEMBALI KE DASHBOARD:
  Di dalam proyek
    ↓ Klik "← Semua Proyek" di sidebar
  Dashboard (sidebar kembali ke global mode) ✅
```

---

## CHECKLIST IMPLEMENTASI

Lakukan dalam urutan ini:

- [ ] Step 1: Buat stores/navigation-store.ts (Zustand + persist)
- [ ] Step 2: Redesign components/sidebar.tsx jadi adaptive
- [ ] Step 3: Update project card → full card clickable + setActiveProject
- [ ] Step 4: Auto-redirect logic di dashboard page
- [ ] Step 5: Redesign /projects/[id]/page.tsx → hapus grid fitur
- [ ] Step 6: Update route structure dengan (app)/layout.tsx
- [ ] Step 7: Sync sidebar dengan URL (direct navigation + back button)

Test cases setelah implementasi:
- [ ] Login baru → dashboard → klik proyek → sidebar switch ✅
- [ ] Login returning → auto redirect ke last project ✅
- [ ] Direct URL ke /projects/[id]/wbs → sidebar sync ✅
- [ ] Browser back button → sidebar kembali global ✅
- [ ] Project switcher → ganti proyek → sidebar update ✅
- [ ] Clerk sign out → clearActiveProject → localStorage bersih ✅

---

*Navigation Redesign Prompt v1.0*
