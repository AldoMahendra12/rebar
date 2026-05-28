# Project Card Redesign Prompt
# Credit Card Dimensions — 3 Column Grid
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT

```
Redesign project cards di halaman /projects dengan dimensi credit card
(aspect ratio 1.586:1, landscape) dalam grid 3 kolom.

Tech stack:
- Next.js 14 App Router + TypeScript
- Shadcn/ui + Tailwind CSS + Framer Motion
- Existing data: name, code, clientName, location, status,
  contractValue, startDate, endDate, progressPlanned, 
  progressActual, deviation

Jangan ubah logic atau data fetching — hanya redesign visual component.
```

---

## DIMENSI & GRID

```
GRID LAYOUT:
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-5

CARD DIMENSIONS (credit card ratio 1.586:1):
  Width:  100% (mengisi kolom)
  Aspect ratio: aspect-[1.586/1]
  
  Gunakan CSS:
  .project-card {
    aspect-ratio: 1.586 / 1;
    width: 100%;
  }
  
  Jangan set fixed height — biarkan aspect-ratio yang mengatur.
  Konten di dalam harus menyesuaikan tinggi ini.
```

---

## CARD DESIGN SPECIFICATION

```
══════════════════════════════════════
CARD CONTAINER
══════════════════════════════════════

Background: white
Border: 1px solid hsl(220 13% 91%)
Border radius: rounded-2xl   (16px — lebih rounded dari sebelumnya)
Overflow: hidden
Cursor: pointer
Padding: p-5

Box shadow:
  Default: 0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)
  Hover:   0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)

Transition: all 200ms ease

Hover state:
  border-color: zinc-300
  translateY(-3px)
  shadow: hover shadow

Framer Motion:
  whileHover={{ y: -3, transition: { duration: 0.15 } }}
  whileTap={{ scale: 0.99 }}

──────────────────────────────────────
ACCENT BAR KIRI (bukan border, ini visual):
  Absolute positioned
  Left: 0, top: 0, bottom: 0
  Width: 3px
  Border radius kiri: rounded-l-2xl
  
  Warna berdasarkan status:
    planning: bg-zinc-300
    active:   bg-blue-500
    on_hold:  bg-amber-400
    completed: bg-emerald-500
  
  Warna berdasarkan deviation (override kalau active):
    deviation <= -5%: bg-red-500
    deviation > 0:    bg-emerald-500
    deviation = 0:    bg-blue-500

══════════════════════════════════════
LAYOUT DALAM CARD (3 baris)
══════════════════════════════════════

Gunakan flex-col justify-between h-full:

┌────────────────────────────────────┐
│  ROW 1: Header (nama + status)     │  ~30% height
├────────────────────────────────────┤
│  ROW 2: Progress bars              │  ~35% height
├────────────────────────────────────┤
│  ROW 3: Footer info                │  ~35% height
└────────────────────────────────────┘

══════════════════════════════════════
ROW 1 — HEADER
══════════════════════════════════════

Layout: flex items-start justify-between gap-2

KIRI:
  Nama proyek:
    font-display text-base font-semibold text-foreground
    leading-tight
    max 2 baris (line-clamp-2)
    TIDAK dipotong dengan "..." di satu baris
    Ini perbaikan utama dari card sebelumnya
  
  Kode proyek:
    text-xs font-mono text-zinc-400 mt-0.5

KANAN:
  Status badge:
    rounded-full px-2.5 py-1 text-xs font-medium
    Tidak ada border — pakai bg opacity
    
    planning:   bg-zinc-100 text-zinc-600
    active:     bg-blue-500/12 text-blue-700
    on_hold:    bg-amber-500/12 text-amber-700
    completed:  bg-emerald-500/12 text-emerald-700
    
    Tidak ada icon — text saja lebih clean

══════════════════════════════════════
ROW 2 — PROGRESS
══════════════════════════════════════

Layout: space-y-2

Deviation badge (di atas progress bars):
  flex items-center justify-between mb-1
  
  Kiri: label "Progress" text-xs text-zinc-400
  Kanan: deviation badge
    Behind:   bg-red-500/10 text-red-600 "Behind −X%"
    Ahead:    bg-emerald-500/10 text-emerald-700 "Ahead +X%"
    On Track: bg-blue-500/10 text-blue-700 "On Track"
    No data:  text-zinc-300 text-xs "Belum ada data"
    
    Style badge: rounded-full px-2 py-0.5 text-xs font-medium

PROGRESS BAR — RENCANA:
  Layout: flex items-center gap-2
  
  Label: "Rencana" text-xs text-zinc-400 w-14 shrink-0
  
  Bar container: flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden
  Bar fill: 
    bg-zinc-300 rounded-full
    height: 100%
    width: {progressPlanned}%
    Framer Motion: animate width 0 → value saat mount
    transition: duration 0.8 ease-out delay index*0.05
  
  Value: text-xs font-mono text-zinc-500 w-9 text-right shrink-0

PROGRESS BAR — AKTUAL:
  Layout: flex items-center gap-2
  
  Label: "Aktual" text-xs text-zinc-400 w-14 shrink-0
  
  Bar container: flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden
  Bar fill:
    Warna berdasarkan deviation:
      behind:   bg-red-400
      on track: bg-blue-500
      ahead:    bg-emerald-500
    height: 100%
    width: {progressActual}%
    Framer Motion: animate width 0 → value, delay lebih panjang
  
  Value: text-xs font-mono font-medium text-foreground w-9 text-right shrink-0

══════════════════════════════════════
ROW 3 — FOOTER INFO
══════════════════════════════════════

Divider: border-t border-zinc-100 (tipis)
Padding top: pt-3

Grid: grid-cols-3 gap-1

Tiap info block:
  Label: text-2xs font-medium uppercase tracking-wide text-zinc-400
         (text-2xs = 0.625rem, tambahkan di tailwind config)
  Value: text-xs font-medium text-foreground mt-0.5 truncate

  Block 1 — KLIEN:
    Label: "KLIEN"
    Value: {clientName} truncate

  Block 2 — NILAI:
    Label: "NILAI"
    Value: format Rupiah singkat
      >= 1T: "Rp X,XT"
      >= 1M: "Rp X,XM" (miliar)
      >= 1Jt: "Rp X,XJt" (juta)
    Center-align text

  Block 3 — SISA WAKTU:
    Label: "SISA WAKTU"
    Value:
      Hari ini atau lebih: "{n} hari" 
        > 30 hari: text-foreground
        15-30 hari: text-amber-600
        < 15 hari: text-orange-600 font-semibold
      Sudah lewat: "Tlb {n}h" text-red-500 font-semibold
      Selesai: "Selesai" text-emerald-600
    Right-align text

══════════════════════════════════════
FULL CARD CODE STRUCTURE
══════════════════════════════════════

<motion.div
  className="relative bg-white border border-zinc-200/80 rounded-2xl 
             overflow-hidden cursor-pointer p-5 flex flex-col 
             justify-between"
  style={{ aspectRatio: '1.586 / 1' }}
  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
  whileTap={{ scale: 0.99 }}
  transition={{ duration: 0.15 }}
  onClick={() => handleProjectClick(project)}
>
  {/* Accent bar kiri */}
  <div className={cn(
    "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl",
    getAccentColor(project)
  )} />
  
  {/* Row 1: Header */}
  <div className="flex items-start justify-between gap-2 pl-2">
    <div className="min-w-0">
      <h3 className="font-semibold text-base text-foreground 
                     leading-tight line-clamp-2">
        {project.name}
      </h3>
      <p className="text-xs font-mono text-zinc-400 mt-0.5">
        {project.code}
      </p>
    </div>
    <StatusBadge status={project.status} />
  </div>
  
  {/* Row 2: Progress */}
  <div className="space-y-2 pl-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-400">Progress</span>
      <DeviationBadge deviation={project.deviation} />
    </div>
    <ProgressBar label="Rencana" value={project.progressPlanned} color="zinc" />
    <ProgressBar label="Aktual" value={project.progressActual} 
                 color={getProgressColor(project.deviation)} />
  </div>
  
  {/* Row 3: Footer */}
  <div className="pl-2">
    <div className="border-t border-zinc-100 pt-3 grid grid-cols-3 gap-1">
      <InfoBlock label="KLIEN" value={project.clientName} align="left" />
      <InfoBlock label="NILAI" value={formatRupiah(project.contractValue)} align="center" />
      <InfoBlock label="SISA WAKTU" value={formatDaysRemaining(project.endDate)} 
                 align="right" color={getDaysColor(project.endDate)} />
    </div>
  </div>
  
</motion.div>
```

---

## HELPER FUNCTIONS

```typescript
// Accent bar color berdasarkan status dan deviation
function getAccentColor(project: Project): string {
  if (project.status === 'completed') return 'bg-emerald-500'
  if (project.status === 'on_hold') return 'bg-amber-400'
  if (project.status === 'planning') return 'bg-zinc-300'
  // Active — berdasarkan deviation
  if (project.deviation <= -5) return 'bg-red-500'
  if (project.deviation > 0) return 'bg-emerald-500'
  return 'bg-blue-500'
}

// Progress bar color
function getProgressColor(deviation: number | null): 'red' | 'blue' | 'emerald' {
  if (deviation === null) return 'blue'
  if (deviation <= -3) return 'red'
  if (deviation > 0) return 'emerald'
  return 'blue'
}

// Format Rupiah singkat
function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) return `Rp ${(value / 1_000_000_000_000).toFixed(1)}T`
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}Jt`
  return `Rp ${value.toLocaleString('id-ID')}`
}

// Format sisa hari
function formatDaysRemaining(endDate: Date): string {
  const today = new Date()
  const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff > 0) return `${diff} hari`
  if (diff === 0) return 'Hari ini'
  return `Tlb ${Math.abs(diff)}h`
}

// Warna sisa hari
function getDaysColor(endDate: Date): string {
  const today = new Date()
  const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'text-red-500 font-semibold'
  if (diff < 15) return 'text-orange-600 font-semibold'
  if (diff < 30) return 'text-amber-600'
  return 'text-foreground'
}
```

---

## REUSABLE SUB-COMPONENTS

```typescript
// Progress Bar
function ProgressBar({ label, value, color }: {
  label: string
  value: number
  color: 'zinc' | 'red' | 'blue' | 'emerald'
}) {
  const colorMap = {
    zinc:    'bg-zinc-300',
    red:     'bg-red-400',
    blue:    'bg-blue-500',
    emerald: 'bg-emerald-500',
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorMap[color])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-500 w-9 text-right shrink-0">
        {value}%
      </span>
    </div>
  )
}

// Info Block
function InfoBlock({ label, value, align, color }: {
  label: string
  value: string
  align: 'left' | 'center' | 'right'
  color?: string
}) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]
  
  return (
    <div className={alignClass}>
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className={cn("text-xs font-medium mt-0.5 truncate", color ?? 'text-foreground')}>
        {value}
      </p>
    </div>
  )
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles = {
    planning:  'bg-zinc-100 text-zinc-600',
    active:    'bg-blue-500/12 text-blue-700',
    on_hold:   'bg-amber-500/12 text-amber-700',
    completed: 'bg-emerald-500/12 text-emerald-700',
  }
  
  const labels = {
    planning:  'Perencanaan',
    active:    'Aktif',
    on_hold:   'Ditunda',
    completed: 'Selesai',
  }
  
  return (
    <span className={cn(
      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
      styles[status as keyof typeof styles] ?? 'bg-zinc-100 text-zinc-600'
    )}>
      {labels[status as keyof typeof labels] ?? status}
    </span>
  )
}

// Deviation Badge
function DeviationBadge({ deviation }: { deviation: number | null }) {
  if (deviation === null) {
    return <span className="text-xs text-zinc-300">Belum ada data</span>
  }
  
  if (deviation <= -3) return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium 
                     bg-red-500/10 text-red-600">
      Behind {deviation}%
    </span>
  )
  
  if (deviation > 0) return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium 
                     bg-emerald-500/10 text-emerald-700">
      Ahead +{deviation}%
    </span>
  )
  
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium 
                     bg-blue-500/10 text-blue-700">
      On Track
    </span>
  )
}
```

---

## FRAMER MOTION — GRID ANIMATION

```typescript
// Di parent grid component
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
}

// Render
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {projects.map((project) => (
    <motion.div key={project.id} variants={cardVariants}>
      <ProjectCard project={project} />
    </motion.div>
  ))}
</motion.div>

// Progress bars animate saat card masuk viewport
// Gunakan whileInView jika grid bisa di-scroll panjang:
animate={inView ? { width: `${value}%` } : { width: 0 }}
```

---

## LOADING SKELETON

```typescript
// ProjectCardSkeleton — exact same dimensions sebagai card asli
function ProjectCardSkeleton() {
  return (
    <div
      className="bg-white border border-zinc-200/80 rounded-2xl 
                 overflow-hidden p-5 flex flex-col justify-between"
      style={{ aspectRatio: '1.586 / 1' }}
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] 
                      bg-zinc-200 rounded-l-2xl animate-shimmer" />
      
      {/* Row 1 */}
      <div className="flex items-start justify-between pl-2">
        <div className="space-y-1.5">
          <div className="h-4 w-36 bg-zinc-200 rounded animate-shimmer" />
          <div className="h-3 w-16 bg-zinc-100 rounded animate-shimmer" />
        </div>
        <div className="h-6 w-20 bg-zinc-100 rounded-full animate-shimmer" />
      </div>
      
      {/* Row 2 */}
      <div className="space-y-2.5 pl-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-14 bg-zinc-100 rounded animate-shimmer" />
          <div className="h-2 flex-1 bg-zinc-100 rounded-full animate-shimmer" />
          <div className="h-3 w-9 bg-zinc-100 rounded animate-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-14 bg-zinc-100 rounded animate-shimmer" />
          <div className="h-2 flex-1 bg-zinc-100 rounded-full animate-shimmer" />
          <div className="h-3 w-9 bg-zinc-100 rounded animate-shimmer" />
        </div>
      </div>
      
      {/* Row 3 */}
      <div className="pl-2 border-t border-zinc-100 pt-3">
        <div className="grid grid-cols-3 gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2 w-10 bg-zinc-100 rounded animate-shimmer" />
              <div className="h-3 w-14 bg-zinc-200 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Render 6 skeleton saat loading
{isLoading && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
  </div>
)}
```

---

## TAILWIND CONFIG ADDITION

```typescript
// Pastikan ini ada di tailwind.config.ts
theme: {
  extend: {
    fontSize: {
      '2xs': ['0.625rem', { lineHeight: '1rem' }],
    },
    aspectRatio: {
      'card': '1.586 / 1',
    },
    animation: {
      'shimmer': 'shimmer 1.5s infinite linear',
    },
    keyframes: {
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
  },
},

// Shimmer CSS di globals.css
.animate-shimmer {
  background: linear-gradient(
    90deg,
    #f1f5f9 0%,
    #e2e8f0 50%,
    #f1f5f9 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
```

---

## CHECKLIST

- [ ] Aspect ratio 1.586:1 applied ke semua cards ✅
- [ ] Grid 3 kolom (lg), 2 kolom (sm), 1 kolom (mobile) ✅
- [ ] Nama proyek tidak terpotong — line-clamp-2 ✅
- [ ] Accent bar kiri dengan warna dinamis ✅
- [ ] Progress bar animate dari 0 saat mount ✅
- [ ] Status badge muted (no solid color) ✅
- [ ] Deviation badge muted ✅
- [ ] Footer 3 kolom: Klien, Nilai, Sisa Waktu ✅
- [ ] Sisa waktu color coding (hijau/kuning/merah) ✅
- [ ] Hover: lift + shadow ✅
- [ ] Stagger animation saat grid load ✅
- [ ] Skeleton exact same dimensions ✅
- [ ] Helper functions semua ada ✅

---

*Project Card Redesign Prompt v1.0 — Credit Card Ratio*
