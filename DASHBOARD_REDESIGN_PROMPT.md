# Dashboard Redesign Prompt
# Contractor Management SaaS — Command Center Dashboard
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT

```
Kamu adalah senior fullstack engineer yang membantu saya redesign 
halaman dashboard dari contractor management SaaS.

Perubahan utama:
- HAPUS: Grid project cards dari dashboard
- PINDAHKAN: Project cards ke halaman /projects (Semua Proyek)
- TAMBAHKAN: 4 section baru yang lebih informatif dan actionable

Dashboard sekarang menjadi "Command Center" — bukan list proyek,
tapi ringkasan kesehatan seluruh portfolio + hal yang butuh perhatian hari ini.

Tech stack:
- Next.js 14 App Router + TypeScript
- Prisma + Neon (database)
- Clerk (auth) — gunakan requireOrg() untuk semua API calls
- Shadcn/ui + Tailwind + Framer Motion
- Recharts (untuk Portfolio S-Curve)
- React Query (TanStack Query) untuk semua data fetching

Aturan:
- Setiap API route WAJIB panggil requireOrg() dari lib/auth.ts
- Setiap Prisma query WAJIB include where: { organizationId }
- Gunakan Framer Motion untuk semua animasi
- Gunakan React Query untuk fetching — bukan useEffect manual
- Loading state: skeleton yang akurat, bukan spinner
```

---

## STEP 1 — API Routes yang Dibutuhkan

```
Buat semua API routes berikut sebelum mulai build UI:

══════════════════════════════════════
1. GET /api/dashboard/kpi
══════════════════════════════════════
Return:
{
  activeProjects: number,           // status = 'active'
  completedOrOnHold: number,        // status = 'completed' | 'on_hold'
  totalContractValue: number,       // sum contractValue semua proyek
  portfolioProgress: number,        // rata-rata actual progress semua proyek aktif
  projectsNeedingAttention: number, // proyek dengan deviasi < -5%
}

Query logic:
  const { organizationId } = await requireOrg()
  
  const projects = await prisma.project.findMany({
    where: { organizationId, status: 'active' },
    include: {
      wbsItems: {
        where: { isLeaf: true },
        include: {
          progressPlans: true,
          progressActuals: true
        }
      }
    }
  })
  
  // Hitung progress per proyek dari wbsItems
  // portfolioProgress = rata-rata actual cumulative semua proyek aktif

══════════════════════════════════════
2. GET /api/dashboard/attention
══════════════════════════════════════
Return list proyek yang butuh perhatian:
[
  {
    id: string,
    name: string,
    code: string,
    plannedProgress: number,   // % kumulatif rencana sampai hari ini
    actualProgress: number,    // % kumulatif aktual
    deviation: number,         // actual - planned (negatif = behind)
    daysRemaining: number,
    status: string,
  }
]

Filter: hanya proyek dengan deviation <= -3%
Sort: deviation ascending (paling parah duluan)
Limit: 5 proyek

══════════════════════════════════════
3. GET /api/dashboard/activity
══════════════════════════════════════
Return recent activity feed dari semua proyek:
[
  {
    id: string,
    type: 'progress_input' | 'document_upload' | 'report_generated' | 'cost_recorded',
    projectName: string,
    projectCode: string,
    projectId: string,
    description: string,      // e.g. "Input progress Minggu 12"
    userName: string,
    userAvatar: string | null,
    createdAt: string,        // ISO timestamp
  }
]

Query:
  Gabungkan dari beberapa tabel:
  - progressActuals (type: progress_input)
  - documents (type: document_upload)
  - costActuals (type: cost_recorded)
  
  Sort by createdAt DESC
  Limit: 10 aktivitas terbaru
  Include: project name, user info

══════════════════════════════════════
4. GET /api/dashboard/portfolio-scurve
══════════════════════════════════════
Return data untuk portfolio S-Curve gabungan:
[
  {
    period: string,         // "W1", "W2" atau "Jan", "Feb"
    periodDate: string,     // ISO date
    planned: number,        // rata-rata weighted planned % semua proyek
    actual: number | null,  // rata-rata weighted actual % (null kalau belum ada data)
  }
]

Logic:
  - Ambil semua proyek aktif
  - Hitung planned dan actual cumulative per periode per proyek
  - Average semua proyek (weighted by contractValue agar proyek besar lebih berpengaruh)
  - Return sebagai time series

══════════════════════════════════════
5. GET /api/dashboard/deadlines
══════════════════════════════════════
Return:
{
  upcomingDeadlines: [
    {
      id: string,
      name: string,
      code: string,
      endDate: string,
      daysRemaining: number,   // negatif kalau sudah lewat
      status: string,
    }
  ],
  openPeriod: {
    label: string,             // "Minggu 21" atau "Mei 2026"
    deadlineDate: string,      // deadline input periode ini
    daysUntilDeadline: number,
    projectsNotSubmitted: number,  // proyek yang belum input periode ini
    projectsNotSubmittedNames: string[],  // nama proyek yang belum input
  } | null
}

upcomingDeadlines:
  - Proyek dengan endDate dalam 60 hari ke depan
  - Sort by endDate ASC
  - Limit: 5
  - Include proyek yang sudah lewat deadline (daysRemaining negatif)

openPeriod logic:
  - Cari periode saat ini (weekly: minggu ini, monthly: bulan ini)
  - Cek proyek mana yang belum submit progressActual untuk periode ini
  - Deadline input: hari Jumat (weekly) atau tanggal 5 bulan berikutnya (monthly)
```

---

## STEP 2 — Dashboard Page Layout

```
Update app/(app)/dashboard/page.tsx dengan layout berikut.

Gunakan React Query untuk semua fetching:
  - useQuery(['dashboard-kpi'], fetchKPI)
  - useQuery(['dashboard-attention'], fetchAttention)
  - useQuery(['dashboard-activity'], fetchActivity)
  - useQuery(['dashboard-portfolio-scurve'], fetchPortfolioSCurve)
  - useQuery(['dashboard-deadlines'], fetchDeadlines)

Semua queries bisa parallel (tidak perlu sequential).
staleTime: 5 * 60 * 1000 (5 menit)
refetchOnWindowFocus: true

══════════════════════════════════════
HALAMAN STRUCTURE
══════════════════════════════════════

<main className="p-6 space-y-6 max-w-[1400px] mx-auto">

  {/* PAGE HEADER */}
  <PageHeader />

  {/* ROW 1: KPI BAR */}
  <KPIBar />

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
```

---

## STEP 3 — Page Header Component

```
Buat komponen PageHeader untuk dashboard:

Layout: flex items-start justify-between

KIRI:
  Greeting dinamis berdasarkan waktu:
    06:00–11:59 → "Selamat pagi,"
    12:00–14:59 → "Selamat siang,"
    15:00–17:59 → "Selamat sore,"
    18:00–05:59 → "Selamat malam,"
  
  Nama user dari Clerk: useUser()
  Style: font-display text-2xl font-semibold text-foreground
  
  Sub text: tanggal hari ini (format Indonesia)
  "Minggu, 24 Mei 2026"
  Style: text-sm text-muted-foreground mt-0.5

KANAN:
  Tombol "Buat Proyek Baru"
  Icon: Plus size 15
  Variant: primary
  onClick: router.push('/projects/new')

Framer Motion:
  animate={{ opacity: 1, y: 0 }}
  initial={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.3 }}
```

---

## STEP 4 — KPI Bar Component

```
Buat komponen KPIBar dengan 4 cards.

Grid: grid-cols-2 lg:grid-cols-4 gap-4

Framer Motion:
  Parent: variants stagger (staggerChildren: 0.08)
  Tiap card: variants fadeUp

══════════════════════════════════════
CARD STYLING (semua 4 card sama):
══════════════════════════════════════
  Background: white
  Border: 1px solid hsl(var(--border))
  Border radius: rounded-xl
  Padding: p-5
  Box shadow: 0 1px 2px rgba(0,0,0,0.04)

  Layout dalam card:
    Label: text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3
    Value: font-display text-3xl font-semibold text-foreground
    Sub:   text-sm text-muted-foreground mt-1

══════════════════════════════════════
CARD 1 — PROYEK AKTIF
══════════════════════════════════════
  Label: "PROYEK AKTIF"
  Value: {activeProjects} (number, animate count-up dari 0)
  Sub: "{completedOrOnHold} proyek selesai/on-hold"
  
  Kanan atas: icon FolderKanban size 18 text-zinc-300

══════════════════════════════════════
CARD 2 — NILAI KONTRAK
══════════════════════════════════════
  Label: "NILAI KONTRAK"
  Value: format rupiah singkat:
    < 1 Juta:   "Rp X Rb"
    < 1 Miliar: "Rp X.XM"  (Juta)
    < 1 Triliun:"Rp X.XM" (Miliar → "Rp X.XMd")
    
    Fungsi format:
    function formatRupiah(value: number): string {
      if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}Md`
      if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`
      if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}Rb`
      return `Rp ${value}`
    }
  
  Sub: "Total estimasi portfolio saat ini"
  Kanan atas: icon Banknote size 18 text-zinc-300

══════════════════════════════════════
CARD 3 — PROGRESS PORTFOLIO
══════════════════════════════════════
  Label: "PROGRESS PORTFOLIO"
  Value: "{portfolioProgress}%" animate count-up
  Sub: "Rata-rata kumulatif aktual"
  
  Tambahkan mini progress bar di bawah value:
    Height: h-1.5
    Background: bg-zinc-100
    Fill: bg-primary
    Width: portfolioProgress%
    Framer Motion: animate width 0 → portfolioProgress%, duration 0.8s delay 0.3s
  
  Kanan atas: icon TrendingUp size 18 text-zinc-300

══════════════════════════════════════
CARD 4 — PERLU PERHATIAN
══════════════════════════════════════
  Label: "PERLU PERHATIAN"
  Value: {projectsNeedingAttention}
  
  Kondisional styling untuk value:
    = 0: text-emerald-600 (semua aman)
    > 0: text-red-500 (ada yang bermasalah)
  
  Sub:
    = 0: text-emerald-600 "Semua proyek on track ✓"
    > 0: text-red-500 "{count} proyek terlambat"
  
  Kalau > 0: tambah subtle red ring di border card:
    border-red-200 bg-red-50/30
  
  Kanan atas: 
    = 0: icon CheckCircle size 18 text-emerald-300
    > 0: icon AlertTriangle size 18 text-red-300 (animate pulse)

══════════════════════════════════════
SKELETON STATE (saat loading):
══════════════════════════════════════
  Tiap card: 
    Label skeleton: h-3 w-24 bg-zinc-200 rounded animate-shimmer
    Value skeleton: h-9 w-16 bg-zinc-200 rounded animate-shimmer mt-3
    Sub skeleton:   h-3 w-32 bg-zinc-200 rounded animate-shimmer mt-2
```

---

## STEP 5 — Attention Panel Component

```
Buat komponen AttentionPanel.

══════════════════════════════════════
CARD CONTAINER
══════════════════════════════════════
  Background: white
  Border: 1px solid hsl(var(--border))
  Border radius: rounded-xl
  Overflow: hidden (untuk sticky header)

══════════════════════════════════════
CARD HEADER
══════════════════════════════════════
  Padding: px-5 py-4
  Border bawah: border-b border-zinc-100
  
  Layout: flex items-center justify-between
  
  Kiri:
    Icon: AlertTriangle size 16 text-amber-500
    Title: "Perlu Perhatian" text-sm font-semibold text-foreground
    Badge count: 
      Kalau ada proyek: bg-red-500/10 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium
      Kalau kosong: tidak tampil
  
  Kanan:
    Link "Semua Proyek →" 
    text-xs text-primary hover:underline
    onClick: router.push('/projects?filter=behind')

══════════════════════════════════════
LIST ITEM (per proyek bermasalah)
══════════════════════════════════════
  Padding: px-5 py-3.5
  Border bawah: border-b border-zinc-50 (kecuali item terakhir)
  Cursor: pointer
  Hover: bg-zinc-50/60 transition-colors

  Layout:
  ┌─────────────────────────────────────────┐
  │ [indicator] Nama Proyek    Deviation    │
  │             PRJ-001        Badge        │
  │             ████░░░░░░░░░  58% / 62%   │
  └─────────────────────────────────────────┘

  Kiri:
    Deviation indicator bar: w-1 h-10 rounded-full
      Deviation <= -10%: bg-red-500
      Deviation -5% to -10%: bg-orange-400
      Deviation -3% to -5%: bg-amber-400
    
    Gap: gap-3
    
    Info:
      Nama proyek: text-sm font-medium text-foreground truncate max-w-[160px]
      Kode + sisa waktu: text-xs text-muted-foreground
        "{code} · {daysRemaining} hari lagi"
        Kalau negatif: text-red-500 "Terlambat {abs} hari"
  
  Kanan:
    Deviation badge:
      bg-red-500/10 text-red-600 rounded-full px-2.5 py-1 text-xs font-semibold
      "{deviation}%" (contoh: "−4%")
    
    Progress text di bawah badge:
      text-xs text-muted-foreground text-right
      "{actual}% / {planned}%"

  onClick: setActiveProject + router.push(`/projects/${id}`)

══════════════════════════════════════
EMPTY STATE (semua on track)
══════════════════════════════════════
  Padding: px-5 py-10
  Center content:
    Icon: CheckCircle size 32 text-emerald-300
    Text: "Semua proyek on track" text-sm font-medium text-zinc-500 mt-3
    Sub: "Tidak ada proyek yang membutuhkan perhatian" text-xs text-zinc-400 mt-1

══════════════════════════════════════
SKELETON STATE
══════════════════════════════════════
  3 skeleton rows:
  Tiap row: flex gap-3 px-5 py-3.5
    Bar: w-1 h-10 bg-zinc-200 rounded animate-shimmer
    Info: 
      w-32 h-3.5 bg-zinc-200 rounded animate-shimmer
      w-24 h-3 bg-zinc-100 rounded animate-shimmer mt-2
    Kanan: w-12 h-6 bg-zinc-200 rounded animate-shimmer ml-auto

Framer Motion:
  List items: staggerChildren 0.05s, fadeUp tiap item
  Empty state: scaleIn
```

---

## STEP 6 — Activity Feed Component

```
Buat komponen ActivityFeed.

══════════════════════════════════════
CARD CONTAINER
══════════════════════════════════════
  Sama dengan AttentionPanel (border, rounded-xl, white)

══════════════════════════════════════
CARD HEADER
══════════════════════════════════════
  Icon: Activity size 16 text-blue-500
  Title: "Aktivitas Terbaru" text-sm font-semibold
  
  Kanan: 
    Refresh button (icon RotateCw size 14 text-zinc-400)
    onClick: queryClient.invalidateQueries(['dashboard-activity'])
    Animate rotate saat loading

══════════════════════════════════════
ACTIVITY ITEM
══════════════════════════════════════
  Padding: px-5 py-3
  Border bawah: border-b border-zinc-50
  Cursor: pointer → navigate ke proyek terkait
  Hover: bg-zinc-50/60

  Layout:
  ┌─────────────────────────────────────────┐
  │ [Avatar]  Nama User                2j  │
  │  [icon]   Deskripsi aktivitas          │
  │           Nama Proyek · Kode           │
  └─────────────────────────────────────────┘

  Avatar:
    Gambar user 28x28px rounded-full
    Fallback: inisial nama, bg-primary/10 text-primary
    Relative position untuk icon overlay

  Activity type icon (overlay di pojok kanan bawah avatar):
    Size: 14x14px rounded-full border-2 border-white
    progress_input:    bg-blue-500   icon: TrendingUp size 8 white
    document_upload:   bg-purple-500 icon: FileUp size 8 white
    report_generated:  bg-emerald-500 icon: FileText size 8 white
    cost_recorded:     bg-amber-500  icon: Receipt size 8 white

  Konten:
    Row 1: 
      Nama user: text-sm font-medium text-foreground
      Waktu: text-xs text-muted-foreground ml-auto (relative time)
        Fungsi relative time Indonesia:
          < 1 menit:  "Baru saja"
          < 1 jam:    "{n} menit lalu"
          < 24 jam:   "{n} jam lalu"
          < 7 hari:   "{n} hari lalu"
          >= 7 hari:  format tanggal "12 Mei"
    
    Row 2:
      Deskripsi: text-xs text-muted-foreground
        progress_input:    "Input progress {period} · {projectName}"
        document_upload:   "Upload dokumen · {projectName}"
        report_generated:  "Generate laporan {period} · {projectName}"
        cost_recorded:     "Catat pengeluaran · {projectName}"

══════════════════════════════════════
EMPTY STATE
══════════════════════════════════════
  Icon: Inbox size 32 text-zinc-300
  Text: "Belum ada aktivitas"
  Sub: "Aktivitas tim akan muncul di sini"

══════════════════════════════════════
SKELETON STATE
══════════════════════════════════════
  5 skeleton items:
  Tiap item: flex gap-3 px-5 py-3
    Circle: w-7 h-7 bg-zinc-200 rounded-full animate-shimmer
    Content:
      w-28 h-3 bg-zinc-200 rounded animate-shimmer
      w-40 h-2.5 bg-zinc-100 rounded animate-shimmer mt-2

Framer Motion:
  New activity masuk dari atas (saat refetch ada item baru):
    animate: height 0 → auto, opacity 0 → 1
  Stagger items saat pertama load
```

---

## STEP 7 — Portfolio S-Curve Component

```
Buat komponen PortfolioSCurve menggunakan Recharts.

══════════════════════════════════════
CARD CONTAINER
══════════════════════════════════════
  Background: white
  Border: 1px solid hsl(var(--border))
  Border radius: rounded-xl
  Padding: p-5

══════════════════════════════════════
CARD HEADER
══════════════════════════════════════
  Kiri:
    Icon: BarChart3 size 16 text-primary
    Title: "Portfolio S-Curve" text-sm font-semibold
    Sub: "Gabungan semua proyek aktif" text-xs text-muted-foreground
  
  Kanan: 
    Toggle Weekly/Monthly (pill tabs kecil)
    bg-zinc-100 rounded-md p-0.5
    Active tab: bg-white shadow-sm rounded text-xs px-2.5 py-1
    Inactive: text-xs text-zinc-500 px-2.5 py-1

══════════════════════════════════════
CHART METRICS (di bawah header, di atas chart)
══════════════════════════════════════
  3 metric inline pills:
  
  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Rencana 62% │ │ Aktual  58%  │ │ Deviasi −4%  │
  └─────────────┘ └──────────────┘ └──────────────┘
  
  Style tiap pill:
    bg-zinc-50 rounded-lg px-3 py-1.5
    Label: text-xs text-zinc-400
    Value: text-sm font-semibold
    Deviasi: text-red-500 kalau negatif, text-emerald-500 kalau positif

══════════════════════════════════════
RECHARTS S-CURVE
══════════════════════════════════════
  Height: 220px
  Margin: top 8, right 8, bottom 8, left -10

  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={portfolioData} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
      
      <CartesianGrid
        strokeDasharray="0"
        stroke="#f1f5f9"
        vertical={false}
      />
      
      <XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        tickMargin={6}
        interval="preserveStartEnd"
      />
      
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        tickFormatter={(v) => `${v}%`}
        domain={[0, 100]}
        width={36}
      />
      
      <Tooltip content={<PortfolioTooltip />} />
      
      {/* Today vertical line */}
      <ReferenceLine
        x={currentPeriod}
        stroke="#f59e0b"
        strokeDasharray="4 3"
        strokeWidth={1.5}
        label={{
          value: 'Hari ini',
          fill: '#f59e0b',
          fontSize: 9,
          position: 'insideTopRight'
        }}
      />
      
      {/* Area fill bawah actual */}
      <defs>
        <linearGradient id="portfolioActualGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Planned line */}
      <Line
        dataKey="planned"
        stroke="#cbd5e1"
        strokeWidth={1.5}
        strokeDasharray="5 3"
        dot={false}
        activeDot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
        connectNulls
      />
      
      {/* Actual line */}
      <Line
        dataKey="actual"
        stroke="#3b82f6"
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
        connectNulls
      />
      
      {/* Area fill */}
      <Area
        dataKey="actual"
        fill="url(#portfolioActualGrad)"
        stroke="none"
      />
      
    </LineChart>
  </ResponsiveContainer>

CUSTOM TOOLTIP (PortfolioTooltip):
  Background: white
  Border: 1px solid #e4e4e7
  Border radius: rounded-lg
  Padding: px-3 py-2.5
  Box shadow: 0 2px 8px rgba(0,0,0,0.08)

  Content:
    Period label: text-xs font-semibold text-foreground mb-2
    Row: dot + "Rencana" + nilai%
    Row: dot + "Aktual" + nilai%
    Kalau ada keduanya: Deviasi row (merah/hijau)

LEGEND (bawah chart):
  flex gap-6 justify-center mt-2
  Item: flex items-center gap-1.5
  Planned: line dashed zinc-400 + "Rencana" text-xs text-zinc-500
  Actual:  line solid blue-500  + "Aktual"  text-xs text-zinc-500

══════════════════════════════════════
SKELETON STATE
══════════════════════════════════════
  Header skeleton: 2 baris
  Metrics: 3 pill skeletons w-24 h-8
  Chart area: h-220 bg-gradient shimmer dari kiri ke kanan

Framer Motion:
  Chart container: fade-in saat data loaded
  Metric numbers: count-up animation
```

---

## STEP 8 — Deadlines Panel Component

```
Buat komponen DeadlinesPanel.

Dua section dalam satu card:
  1. Deadline Terdekat
  2. Periode Input Terbuka

══════════════════════════════════════
CARD CONTAINER
══════════════════════════════════════
  Background: white
  Border: 1px solid hsl(var(--border))
  Border radius: rounded-xl
  Overflow: hidden

══════════════════════════════════════
SECTION 1: DEADLINE TERDEKAT
══════════════════════════════════════

Header:
  Padding: px-5 pt-4 pb-3
  Icon: CalendarClock size 16 text-zinc-500
  Title: "Deadline Terdekat" text-sm font-semibold

List (max 5 proyek):
  Tiap item — padding: px-5 py-2.5 border-b border-zinc-50
  Hover: bg-zinc-50/60 cursor-pointer
  
  Layout:
  ┌──────────────────────────────────────┐
  │  Nama Proyek           [badge hari]  │
  │  PRJ-001 · Status                   │
  └──────────────────────────────────────┘

  Kiri:
    Nama: text-sm font-medium text-foreground truncate
    Sub: text-xs text-muted-foreground "{code} · {endDate formatted}"
  
  Kanan:
    Days badge — warna berdasarkan sisa waktu:
      > 30 hari:   bg-zinc-100 text-zinc-600         "{n} hari"
      15-30 hari:  bg-amber-500/10 text-amber-600    "{n} hari"
      7-14 hari:   bg-orange-500/10 text-orange-600  "{n} hari"
      1-7 hari:    bg-red-500/10 text-red-600        "{n} hari"
      0 hari:      bg-red-500/10 text-red-600        "Hari ini!"
      < 0 hari:    bg-red-500/15 text-red-700 font-semibold "Tlb {abs}h"

  onClick: setActiveProject + navigate ke proyek

══════════════════════════════════════
DIVIDER
══════════════════════════════════════
  border-t-2 border-zinc-100 mx-5

══════════════════════════════════════
SECTION 2: PERIODE INPUT TERBUKA
══════════════════════════════════════

Padding: px-5 py-4

Kalau tidak ada periode terbuka:
  text-xs text-zinc-400 "Tidak ada periode input yang terbuka"

Kalau ada periode terbuka:

  Header row:
    Icon: Clock size 14 text-primary
    "Periode Input Aktif" text-xs font-semibold text-foreground
    
  Period label: 
    "{label}" (contoh: "Minggu 21 — 18–24 Mei 2026")
    text-sm font-medium text-foreground mt-2
  
  Deadline input:
    Kalau belum lewat:
      "Deadline: {formatted date}" text-xs text-muted-foreground
      "{daysUntilDeadline} hari lagi" — warna sesuai urgency
    Kalau sudah lewat:
      text-red-500 "Deadline sudah lewat"

  Progress submission:
    Bar progress tipis:
      Total proyek aktif vs sudah submit
      h-1.5 bg-zinc-100 rounded-full
      Fill: bg-primary
      "{submitted}/{total} proyek sudah input"
      text-xs text-muted-foreground mt-1

  Kalau ada proyek belum submit:
    Warning section:
      Background: bg-amber-50 rounded-lg px-3 py-2.5 mt-3
      Icon AlertTriangle size 12 text-amber-500
      "{n} proyek belum input:" text-xs font-medium text-amber-700
      List nama proyek: text-xs text-amber-600 mt-1
        Tiap nama: bullet + nama proyek (max 3, sisanya "+N lagi")
    
    Tombol: "Ingatkan Tim" ghost size sm full-width mt-2
      (UI only untuk MVP — fungsional di Fase 2)

══════════════════════════════════════
SKELETON STATE
══════════════════════════════════════
  Section 1: 4 skeleton rows
  Section 2: beberapa baris skeleton

Framer Motion:
  Deadline items: stagger 0.05s
  Days badge: color transition kalau data refresh
  Warning section: slide-down saat muncul
```

---

## STEP 9 — Halaman Semua Proyek (/projects)

```
Pindahkan project cards dari dashboard ke sini.
Buat/update halaman app/(app)/projects/page.tsx.

Ini adalah halaman yang sebelumnya ada di dashboard.
Pindahkan semua logic project listing ke sini.

Tambahan fitur di halaman ini (tidak ada di dashboard sebelumnya):

HEADER:
  Title: "Semua Proyek"
  Sub: "{total} proyek"
  Kanan: tombol "Buat Proyek Baru"

FILTER & SORT BAR:
  Filter tabs: Semua | Aktif | Perencanaan | Ditunda | Selesai
  Search input: "Cari proyek..."
  Sort: Nama | Deadline | Nilai Kontrak | Deviasi

VIEW TOGGLE:
  Grid view (default) — project cards seperti sebelumnya
  List view — tabel compact dengan lebih banyak proyek terlihat

  List view kolom:
  Kode | Nama Proyek | Klien | Status | Rencana% | Aktual% | Deviasi | Deadline | Nilai

PROJECT CARDS:
  Pindahkan exact implementation yang sudah ada
  Tambah: full card clickable → setActiveProject + navigate

EMPTY STATE per filter:
  "Semua" kosong: "Belum ada proyek. Buat yang pertama!"
  Filter aktif: "Tidak ada proyek {status}"

Framer Motion:
  AnimatePresence saat filter berubah (cards keluar/masuk)
  Layout animation saat switch grid ↔ list view
```

---

## STEP 10 — Update Sidebar Navigation

```
Update sidebar untuk tambahkan link "Semua Proyek":

Di global sidebar mode:
  Dashboard  → /dashboard
  Semua Proyek → /projects   ← PASTIKAN link ini ada dan benar

Kalau user klik "Semua Proyek →" di AttentionPanel:
  route ke /projects?filter=behind
  
  Di halaman /projects, detect query param:
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') // 'behind'
  
  Kalau filter='behind': pre-select tab yang sesuai atau 
  filter cards hanya yang deviation < 0
```

---

## CHECKLIST IMPLEMENTASI

Lakukan dalam urutan ini:

- [ ] Step 1: Buat semua 5 API routes
- [ ] Step 2: Setup dashboard page layout + React Query
- [ ] Step 3: PageHeader component
- [ ] Step 4: KPIBar component (4 cards)
- [ ] Step 5: AttentionPanel component
- [ ] Step 6: ActivityFeed component
- [ ] Step 7: PortfolioSCurve component (Recharts)
- [ ] Step 8: DeadlinesPanel component
- [ ] Step 9: Halaman /projects dengan project cards yang dipindah
- [ ] Step 10: Update sidebar link

Test cases setelah implementasi:
- [ ] Dashboard load semua 4 section parallel ✅
- [ ] KPI numbers akurat dari database ✅
- [ ] Attention panel hanya tampil proyek behind schedule ✅
- [ ] Activity feed sorted by terbaru ✅
- [ ] Portfolio S-Curve render dengan data gabungan ✅
- [ ] Deadline colors sesuai urgency ✅
- [ ] Project cards sudah pindah ke /projects ✅
- [ ] "Semua Proyek →" link dari attention panel filter by behind ✅
- [ ] Semua skeleton loading akurat ✅
- [ ] Responsive di mobile ✅

---

*Dashboard Redesign Prompt v1.0*
