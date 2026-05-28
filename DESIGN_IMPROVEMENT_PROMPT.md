# Design Improvement Prompt
# Contractor Management SaaS — Human Feel Redesign
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT PROMPT (Paste ini di awal sesi)

```
Kamu adalah senior UI/UX engineer dengan spesialisasi di SaaS product design.
Kamu akan membantu saya improve design dari contractor management web app
yang sudah dibangun dengan Next.js 14, Shadcn/ui, Tailwind CSS, dan Framer Motion.

Masalah utama saat ini: UI terlihat terlalu "AI-generated" — generic, 
terlalu ramai shadow, warna terlalu saturated, spacing terlalu rapat, 
tidak ada personality.

Tujuan: Redesign menjadi terasa professional, clean, dan human — 
seperti Linear.app, Vercel Dashboard, atau Raycast.

Tech stack:
- Next.js 14 App Router + TypeScript
- Shadcn/ui + Tailwind CSS
- Framer Motion (sudah terinstall)
- Recharts (untuk S-Curve charts)

Aturan desain yang WAJIB diikuti di semua perubahan:
1. TIDAK BOLEH ada shadow besar (shadow-lg, shadow-xl) di card biasa
2. TIDAK BOLEH ada warna solid terang untuk badge/status — selalu pakai opacity rendah
3. TIDAK BOLEH spacing kurang dari p-6 di dalam card
4. SELALU ada hover state dan transition di setiap elemen interaktif
5. SELALU pakai whitespace — jangan takut kosong
6. TIDAK BOLEH lebih dari 2 brand color di satu halaman
7. SELALU gunakan Framer Motion untuk state changes, bukan CSS transition saja
```

---

## STEP 1 — Global Foundation (globals.css + tailwind.config)

```
Lakukan perubahan global berikut:

═══════════════════════════════════
1. UPDATE app/globals.css
═══════════════════════════════════

Ganti CSS variables di :root dengan ini:

:root {
  /* Background — off-white, bukan putih murni */
  --background: 220 20% 98%;
  --foreground: 222 20% 10%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222 20% 10%;

  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 222 20% 10%;

  /* Brand — biru profesional */
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;

  /* Secondary */
  --secondary: 220 14% 96%;
  --secondary-foreground: 222 20% 20%;

  /* Muted */
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 48%;

  /* Accent */
  --accent: 220 14% 95%;
  --accent-foreground: 222 20% 10%;

  /* Destructive */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  /* Border & Input */
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 221 83% 53%;

  /* Border radius */
  --radius: 0.625rem;
}

Tambahkan custom utility classes di bawah :root:

@layer utilities {
  /* Card dengan feel human */
  .card-base {
    @apply bg-white border border-zinc-200/80 rounded-xl;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.02);
  }

  .card-base:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    @apply border-zinc-300/80;
  }

  /* Subtle section divider */
  .divider {
    @apply border-t border-zinc-100;
  }

  /* Muted badge pattern */
  .badge-muted {
    @apply rounded-full px-2.5 py-0.5 text-xs font-medium;
  }

  /* Focus ring yang tidak terlalu agresif */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
  }
}

═══════════════════════════════════
2. UPDATE tailwind.config.ts
═══════════════════════════════════

Tambahkan font dan animasi custom:

import type { Config } from 'tailwindcss'

const config: Config = {
  // ... existing config ...
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist)', 'var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.08)',
        'dropdown': '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        'tooltip': '0 2px 8px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
    },
  },
}

═══════════════════════════════════
3. UPDATE app/layout.tsx
═══════════════════════════════════

Import dan apply font:

import { Inter, Geist } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${geist.variable}`}>
      <body className="bg-zinc-50 text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

## STEP 2 — Sidebar & Navigation

```
Redesign komponen sidebar/navigation dengan spesifikasi berikut:

LAYOUT:
- Width: 240px (fixed), collapsible ke 60px di mobile
- Background: white (#ffffff)
- Border kanan: 1px solid hsl(var(--border))
- Tidak ada shadow di sidebar
- Full height: h-screen sticky

LOGO/BRAND AREA (top):
- Padding: px-4 py-5
- Logo atau nama app: font-display font-semibold text-base text-foreground
- Tagline atau org name: text-xs text-muted-foreground mt-0.5
- Border bawah: 1px solid hsl(var(--border))

NAV ITEMS:
- Padding per item: px-3 py-2
- Border radius: rounded-lg
- Font: text-sm font-medium
- Icon: 16px, Lucide icons
- Gap icon ke label: gap-2.5

State styles:
  Default:   text-muted-foreground, icon opacity-60, bg-transparent
  Hover:     bg-zinc-100 text-foreground, icon opacity-100
             transition-colors duration-150
  Active:    bg-primary/8 text-primary font-medium
             icon: text-primary
             Tambah dot kecil atau left border indicator:
             border-l-2 border-primary di luar nav item

NAV GROUP LABELS:
- text-2xs font-semibold uppercase tracking-wider text-zinc-400
- Margin: mt-6 mb-1 px-3

PROJECT SWITCHER (kalau ada):
- Di bawah logo area
- Dropdown dengan nama proyek aktif
- Chevron icon kanan
- Background: bg-zinc-50 rounded-lg px-3 py-2
- Hover: bg-zinc-100

BOTTOM SECTION:
- User avatar + nama + role
- Settings icon
- Border top: 1px solid border
- Padding: p-3

FRAMER MOTION:
- Active indicator: layoutId="active-nav" untuk smooth transition antar item
- Sidebar collapse: animate width dengan spring
- Nav item hover: subtle x translate (1-2px)

Contoh struktur komponen:

const navItems = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    ]
  },
  {
    group: 'Projects',
    items: [
      { label: 'All Projects', href: '/projects', icon: FolderKanban },
      { label: 'Reports', href: '/reports', icon: FileText },
    ]
  },
  {
    group: 'Settings',
    items: [
      { label: 'Team', href: '/settings/team', icon: Users },
      { label: 'Billing', href: '/settings/billing', icon: CreditCard },
    ]
  }
]
```

---

## STEP 3 — Dashboard Page

```
Redesign halaman /dashboard dengan spesifikasi berikut:

═══════════════════════════════════
HEADER SECTION
═══════════════════════════════════
- Page title: font-display text-2xl font-semibold text-foreground
- Subtitle: text-sm text-muted-foreground mt-0.5
- Kanan: tombol "Buat Proyek" — primary button dengan icon Plus
- Padding bawah: pb-6 border-b border-zinc-100

═══════════════════════════════════
KPI SUMMARY BAR
═══════════════════════════════════
Grid 4 kolom. Tiap KPI card:

- Background: white
- Border: 1px solid zinc-200/80
- Border radius: rounded-xl
- Padding: p-5
- Box shadow: shadow-card (custom dari config)
- TIDAK ADA icon besar di tengah

Layout dalam KPI card:
  Top: label text-xs font-medium uppercase tracking-wide text-muted-foreground
  Middle: nilai besar font-display text-3xl font-semibold text-foreground
  Bottom: perbandingan/trend text-xs text-muted-foreground

  Contoh "Total Proyek Aktif":
    Label: "PROYEK AKTIF"
    Value: "12"
    Sub: "3 selesai bulan ini"

  Contoh "Behind Schedule":
    Label: "PERLU PERHATIAN"
    Value: "3"
    Sub: text-red-500 "Deviasi > 5%"

Framer Motion: staggered fade-up saat pertama mount
  variants={{ hidden: opacity 0 y 8, visible: opacity 1 y 0 }}
  stagger: 0.08s

═══════════════════════════════════
FILTER & SORT BAR
═══════════════════════════════════
- Padding: py-4
- Layout: flex items-center justify-between
- Kiri: filter tabs (All, Active, On Hold, Completed)
  Style tabs: pill/rounded, tidak pakai Shadcn Tabs default
  Active tab: bg-foreground text-background
  Inactive: text-muted-foreground hover:text-foreground
- Kanan: Sort dropdown (Shadcn Select, minimal styling)

═══════════════════════════════════
PROJECT CARDS GRID
═══════════════════════════════════
Grid: 3 kolom di desktop, 2 di tablet, 1 di mobile
Gap: gap-4

SPESIFIKASI TIAP PROJECT CARD:
Background: white
Border: 1px solid zinc-200/80
Border radius: rounded-xl
Padding: p-0 (pakai internal sections)
Box shadow: shadow-card
Hover: shadow-card-hover, translateY(-2px), border-zinc-300/80
Transition: all 200ms ease
Cursor: pointer (seluruh card clickable)

Struktur internal card:

[CARD HEADER] px-5 pt-5 pb-4
  Row 1:
    Kiri: 
      - Nama proyek: text-base font-semibold text-foreground (max 1 baris, truncate)
      - Kode proyek: text-xs text-muted-foreground font-mono mt-0.5
    Kanan:
      - Status badge: badge-muted
        planning:   bg-zinc-100 text-zinc-600
        active:     bg-blue-500/10 text-blue-600
        on_hold:    bg-amber-500/10 text-amber-600
        completed:  bg-emerald-500/10 text-emerald-600

[DIVIDER] border-t border-zinc-100

[PROGRESS SECTION] px-5 py-4
  Label row: flex justify-between
    "Progress" text-xs text-muted-foreground
    Deviation badge kecil:
      on_track: bg-emerald-500/10 text-emerald-600 "On Track"
      behind:   bg-red-500/10 text-red-600 "Behind −X%"
      ahead:    bg-blue-500/10 text-blue-600 "Ahead +X%"

  Progress bars (dua baris):
    Planned:
      Label "Rencana" text-xs text-zinc-400 w-16
      Bar: h-1.5 bg-zinc-200 rounded-full flex-1
           Fill: bg-zinc-400 rounded-full
      Value: text-xs text-zinc-400 w-10 text-right
    
    Actual:
      Label "Aktual" text-xs text-zinc-400 w-16
      Bar: h-1.5 bg-zinc-100 rounded-full flex-1
           Fill: bg-primary rounded-full (merah kalau behind)
           Framer Motion: animate width dari 0 saat mount
      Value: text-xs font-medium text-foreground w-10 text-right

[DIVIDER] border-t border-zinc-100

[CARD FOOTER] px-5 py-3.5
  Grid 3 kolom:
    Col 1: Klien
      Label: text-2xs uppercase tracking-wide text-zinc-400
      Value: text-xs text-foreground font-medium truncate
    Col 2: Nilai Kontrak
      Label: text-2xs uppercase tracking-wide text-zinc-400
      Value: text-xs text-foreground font-medium
             Format: "Rp 2,4 M" atau "Rp 850 Jt"
    Col 3: Sisa Waktu
      Label: text-2xs uppercase tracking-wide text-zinc-400
      Value: text-xs font-medium
             Hijau kalau > 30 hari, kuning 10-30 hari, merah < 10 hari
             Format: "42 hari" atau "Terlambat 3 hari"

FRAMER MOTION untuk cards:
  - Mount: staggerChildren 0.06s, fade-up tiap card
  - Hover: whileHover scale 1.005 + y -2
  - Tap: whileTap scale 0.998

═══════════════════════════════════
EMPTY STATE
═══════════════════════════════════
Centered di area cards:
- SVG ilustrasi simpel (building/construction, monochromatic zinc-200/zinc-300)
- Heading: text-base font-semibold "Belum ada proyek"
- Subtext: text-sm text-muted-foreground "Mulai dengan membuat proyek pertama"
- Button: primary "Buat Proyek Pertama" dengan icon Plus

═══════════════════════════════════
LOADING SKELETON
═══════════════════════════════════
Sama persis layout dengan card asli tapi:
- Semua text diganti div dengan bg-zinc-200 rounded animate-shimmer
- Shimmer: gradient yang bergerak kiri ke kanan
- Ukuran placeholder harus mencerminkan konten asli
```

---

## STEP 4 — WBS Builder Table

```
Redesign halaman /projects/[id]/wbs dengan spesifikasi berikut:

═══════════════════════════════════
PAGE HEADER
═══════════════════════════════════
- Breadcrumb: Dashboard > Nama Proyek > WBS & RAB
  text-sm text-muted-foreground dengan separator "/"
  Last item: text-foreground font-medium
- Judul: "WBS & Rencana Anggaran" font-display text-xl font-semibold
- Sub: "Rincian item pekerjaan dan estimasi biaya proyek"
- Kanan: 
  - Status bobot badge: "Total Bobot: 100% ✓" atau "98.5% ⚠"
  - Tombol "Export RAB" outline variant
  - Tombol "Simpan" primary (disabled kalau tidak ada perubahan)

═══════════════════════════════════
TOOLBAR
═══════════════════════════════════
Padding: py-3 border-b border-zinc-100
Background: white sticky top-0 z-10

Kiri:
  - Tombol "+ Item Utama" (outline, icon Plus)
  - Tombol "Import Excel" (ghost, icon Upload, grayed out dengan tooltip "Coming soon")

Kanan:
  - Unsaved indicator: dot kuning + "Ada perubahan belum disimpan" text-xs text-amber-600
    Hanya muncul kalau ada perubahan. Animate fade-in
  - Keyboard shortcut hint: "Ctrl+S untuk simpan" text-xs text-zinc-400

═══════════════════════════════════
TABLE
═══════════════════════════════════
Container: border border-zinc-200 rounded-xl overflow-hidden bg-white

HEADER ROW:
- Background: bg-zinc-50
- Border bawah: border-b border-zinc-200
- Text: text-xs font-semibold uppercase tracking-wide text-zinc-500
- Padding cell: px-4 py-3
- Kolom widths:
  Code:        80px
  Nama:        flex-1 (min 200px)
  Satuan:      90px
  Volume:      110px
  Harga Sat:   140px
  Total Harga: 150px
  Bobot %:     90px
  Aksi:        80px

ROW STYLING per level:
  Level 1 (pekerjaan utama):
    - Background: bg-zinc-50/60
    - Font: text-sm font-semibold text-foreground
    - Code: font-mono text-xs font-bold text-primary
    - Border top: border-t-2 border-zinc-200 (separator antar level 1)
    - Tidak ada indent

  Level 2 (sub pekerjaan):
    - Background: white
    - Font: text-sm font-medium text-foreground
    - Code: font-mono text-xs text-zinc-500
    - Indent: padding-left 24px di kolom nama
    - Dot indicator kiri: w-1 h-1 rounded-full bg-zinc-300

  Level 3 (item / leaf node):
    - Background: white
    - Font: text-sm text-foreground
    - Code: font-mono text-xs text-zinc-400
    - Indent: padding-left 48px di kolom nama
    - Dot indicator kiri: w-1 h-1 rounded-full bg-zinc-200

ROW HOVER STATE:
  - Background: bg-blue-50/40
  - Cursor: default (jadi cursor text saat hover cell yang bisa diedit)
  - Action buttons muncul (opacity 0 → 1)
  - Transition: 100ms

ROW SELECTED/EDITING STATE:
  - Border left: 2px solid primary
  - Background: bg-primary/3

INLINE EDIT CELLS:
  - Default: tampil sebagai text biasa
  - Hover: subtle underline dashed zinc-300
  - Click/Focus: 
    Input muncul dengan border 1px solid primary
    Background: white
    Box shadow: 0 0 0 3px hsl(var(--primary)/0.12)
    Border radius: rounded-md
    Padding: px-2 py-1
    Tidak ada label/placeholder yang mengganggu

ANGKA CELLS (Volume, Harga, Total, Bobot):
  - Text align: right
  - Font: font-mono text-sm
  - Total Harga dan Bobot: font-medium

AKSI BUTTONS (muncul saat hover row):
  - Icon buttons 24x24px
  - Gap: gap-1
  - Icons: ChevronRight (indent), ChevronLeft (outdent), 
           GripVertical (drag handle), Trash2 (hapus)
  - Color: text-zinc-400 hover:text-zinc-700
  - Drag handle: cursor-grab, color zinc-300

FOOTER ROW:
  - Background: bg-zinc-50
  - Border top: border-t-2 border-zinc-200
  - Font: text-sm font-semibold
  - "TOTAL" label di kolom nama
  - Total harga di kolom Total Harga: font-mono font-bold text-foreground
  - Total bobot di kolom Bobot: 
    = 100%: text-emerald-600 font-bold
    ≠ 100%: text-red-500 font-bold + shake animation

FRAMER MOTION:
  - Row baru: height 0 → auto, opacity 0 → 1, durasi 200ms
  - Row hapus: height → 0, opacity → 0, durasi 150ms
  - Drag: scale 1.02, shadow-card-hover, zIndex 50, spring animation
  - Indent/outdent: animate paddingLeft, spring
  - Bobot warning: keyframes shake (x: 0, -4, 4, -4, 4, 0)

═══════════════════════════════════
RAB EXPORT MODAL
═══════════════════════════════════
Saat klik "Export RAB":
- Modal/Sheet dari kanan (Shadcn Sheet)
- Preview format RAB sebelum download
- Options: include PPN (toggle), format (PDF/Excel placeholder)
- Tombol "Download PDF"
- Loading state saat generate
```

---

## STEP 5 — S-Curve Visualization

```
Redesign halaman /projects/[id]/s-curve dengan spesifikasi berikut:

═══════════════════════════════════
LAYOUT
═══════════════════════════════════
Split layout:
  Kiri (flex-1): Chart area
  Kanan (300px): Metrics panel
  Gap: gap-6

═══════════════════════════════════
METRICS PANEL (kanan)
═══════════════════════════════════
Background: white
Border: 1px solid zinc-200
Border radius: rounded-xl
Padding: p-5

Section 1 — Status:
  Large status indicator:
    Icon besar (TrendingUp/TrendingDown/Minus) 48px
    On Track: text-emerald-500
    Behind: text-red-500
    Ahead: text-blue-500
  Text status: font-display text-lg font-semibold

Section 2 — Numbers:
  Divider border-t border-zinc-100 my-4

  Grid 2x2 untuk metrics:
  ┌────────────┬────────────┐
  │  Rencana   │  Aktual    │
  │   67.5%    │   62.1%    │
  ├────────────┼────────────┤
  │  Deviasi   │  Est. Selesai│
  │  −5.4%     │  15 Mar 26 │
  └────────────┴────────────┘

  Style tiap metric:
    Label: text-xs uppercase tracking-wide text-zinc-400
    Value: font-display text-2xl font-semibold text-foreground
    Deviasi negatif: text-red-500
    Deviasi positif: text-emerald-500

Section 3 — Period Detail:
  Divider border-t border-zinc-100 my-4
  "Periode Ini" label text-xs text-zinc-400
  Planned periode: text-sm text-zinc-500
  Actual periode: text-sm font-medium text-foreground
  Mini bar: planned vs actual (h-1 bar)

Section 4 — Actions:
  Divider border-t border-zinc-100 my-4
  Tombol "Export PNG" ghost full-width icon Download
  Tombol "Buat Laporan" outline full-width icon FileText

═══════════════════════════════════
CHART AREA (kiri)
═══════════════════════════════════

LEVEL SELECTOR (di atas chart):
  Pill tabs: Project | Level 1 | Level 2 | Item
  Style:
    Container: bg-zinc-100 rounded-lg p-1 inline-flex gap-1
    Active: bg-white shadow-sm rounded-md px-3 py-1.5 text-sm font-medium
    Inactive: text-zinc-500 px-3 py-1.5 text-sm hover:text-zinc-700
  Framer Motion: layoutId="level-indicator" untuk sliding indicator

  Tambah: Toggle Weekly/Monthly (di kanan level selector)

UPPER CHART — S-CURVE:
Height: 320px
Background: transparan (TIDAK ada box/border di chart)

Recharts config:
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
      
      <CartesianGrid 
        strokeDasharray="0" 
        stroke="#f1f5f9" 
        vertical={false}
      />
      
      <XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#94a3b8', fontSize: 11 }}
        tickMargin={8}
      />
      
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#94a3b8', fontSize: 11 }}
        tickFormatter={(v) => `${v}%`}
        width={40}
        domain={[0, 100]}
      />
      
      <Tooltip content={<CustomTooltip />} />
      
      {/* Today vertical line */}
      <ReferenceLine
        x={todayPeriod}
        stroke="#f59e0b"
        strokeDasharray="4 3"
        strokeWidth={1.5}
        label={{ value: 'Hari ini', fill: '#f59e0b', fontSize: 10, position: 'top' }}
      />
      
      {/* Planned line */}
      <Line
        dataKey="planned"
        stroke="#cbd5e1"
        strokeWidth={2}
        strokeDasharray="6 3"
        dot={false}
        activeDot={{ r: 4, fill: '#cbd5e1', strokeWidth: 0 }}
      />
      
      {/* Actual line */}
      <Line
        dataKey="actual"
        stroke={isOnTrack ? '#3b82f6' : '#ef4444'}
        strokeWidth={2.5}
        dot={false}
        activeDot={{ r: 5, fill: isOnTrack ? '#3b82f6' : '#ef4444', strokeWidth: 2, stroke: 'white' }}
      />
      
      {/* Area fill bawah actual */}
      <defs>
        <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isOnTrack ? '#3b82f6' : '#ef4444'} stopOpacity={0.06} />
          <stop offset="100%" stopColor={isOnTrack ? '#3b82f6' : '#ef4444'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area dataKey="actual" fill="url(#actualGradient)" stroke="none" />
      
    </LineChart>
  </ResponsiveContainer>

CUSTOM TOOLTIP:
  Background: white
  Border: 1px solid zinc-200
  Border radius: rounded-lg
  Padding: p-3
  Box shadow: shadow-dropdown
  Font: text-xs

  Layout:
    Period label: text-xs font-semibold text-foreground mb-2
    Row Rencana: dot zinc-400 | "Rencana" text-zinc-500 | nilai% font-medium text-right
    Row Aktual:  dot blue/red  | "Aktual"  text-zinc-500 | nilai% font-medium text-right
    Row Deviasi: text-xs (merah/hijau) "+X.X%" atau "−X.X%"

CHART LEGEND (di bawah chart, bukan di dalam):
  Flex row gap-6 justify-center
  Item: dot 8px + label text-xs text-zinc-500
  Planned dot: bg-zinc-300 dashed border
  Actual dot:  bg-primary (atau red)

LOWER CHART — DEVIASI PER PERIODE:
Height: 140px
Margin-top: 16px (gap kecil dari upper chart, NO border antara keduanya)

  <BarChart data={data} margin={{ top: 0, right: 8, bottom: 8, left: 0 }}>
    <CartesianGrid strokeDasharray="0" stroke="#f8fafc" vertical={false} />
    <XAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} 
           tickFormatter={(v) => `${v}%`} width={40} />
    <Tooltip content={<DeviationTooltip />} />
    
    {/* Planned bar */}
    <Bar dataKey="plannedPeriod" fill="#e2e8f0" radius={[3,3,0,0]} maxBarSize={20} />
    
    {/* Actual bar */}
    <Bar dataKey="actualPeriod" radius={[3,3,0,0]} maxBarSize={20}>
      {data.map((entry, i) => (
        <Cell 
          key={i} 
          fill={entry.actualPeriod >= entry.plannedPeriod ? '#3b82f6' : '#ef4444'}
          fillOpacity={0.85}
        />
      ))}
    </Bar>
  </BarChart>

Label di atas lower chart:
  "Progres Per Periode" text-xs font-medium text-zinc-500
  Legend inline: kotak biru "Aktual" | kotak abu "Rencana"

FRAMER MOTION:
  Chart container: fade-in saat level switch
  Metrics panel numbers: animate dari nilai lama ke baru (count-up effect)
  Level selector indicator: layoutId sliding
```

---

## STEP 6 — Progress Input Form

```
Redesign halaman /projects/[id]/progress dengan spesifikasi:

═══════════════════════════════════
PERIOD SELECTOR
═══════════════════════════════════
Card di atas form:
  Background: white, border zinc-200, rounded-xl, p-4
  Layout: flex items-center justify-between
  
  Kiri:
    Label: text-sm font-medium "Periode Pelaporan"
    Value: text-xl font-semibold "Minggu 12 — 18 Mar 2025"
    Sub: text-xs text-muted-foreground "Deadline input: Jumat, 21 Mar 2025"
  
  Kanan:
    Arrow buttons prev/next periode
    Status badge: "Belum Diisi" amber / "Sudah Diisi" emerald / "Terkunci" zinc

═══════════════════════════════════
PROGRESS INPUT TABLE
═══════════════════════════════════
Sama styling dengan WBS table tapi kolom berbeda:

Kolom:
  Code:           70px
  Nama Item:      flex-1
  Rencana (%):    110px (read-only, bg-zinc-50)
  Kum. Rencana:   110px (read-only, bg-zinc-50)
  Input Aktual:   130px (editable, highlighted)
  Kum. Aktual:    110px (auto-calculated, bg-zinc-50)
  Status:         80px
  Foto:           60px

INPUT AKTUAL CELL styling:
  Background: bg-primary/3
  Border: 1px solid primary/30
  Font: font-mono font-medium
  Focus: border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]
  Placeholder: "0.0"
  Suffix: "%" di kanan dalam input

STATUS per row:
  Aktual > Rencana: badge bg-emerald-500/10 text-emerald-600 "Ahead"
  Aktual = Rencana: badge bg-blue-500/10 text-blue-600 "On Track"
  Aktual < Rencana: badge bg-red-500/10 text-red-600 "Behind"
  Belum diisi:      badge bg-zinc-100 text-zinc-400 "—"

FOTO UPLOAD CELL:
  Kalau belum ada foto: icon Camera text-zinc-300, klik → upload
  Kalau ada foto: thumbnail kecil 32x32px rounded, klik → lihat/ganti
  Counter kalau multiple: "+2" overlay

═══════════════════════════════════
SUMMARY BAR (sticky bottom)
═══════════════════════════════════
Sticky di bottom page:
  Background: white
  Border top: 1px solid zinc-200
  Padding: px-6 py-4
  Box shadow: 0 -4px 12px rgba(0,0,0,0.06)

  Layout: flex justify-between items-center
  
  Kiri (summary angka):
    "Bobot Tertimbang Periode Ini:"
    Planned: "X.XX%" text-zinc-500
    Actual:  "X.XX%" font-semibold text-foreground
    Deviasi: "+X.X%" emerald atau "−X.X%" red
  
  Kanan (actions):
    Tombol "Simpan Draft" ghost
    Tombol "Submit & Kunci" primary
      Saat loading: spinner + "Menyimpan..."
      Konfirmasi sebelum submit: Alert dialog

FRAMER MOTION:
  Summary bar: slide-up dari bawah saat ada perubahan
  Status badge per row: animate saat nilai berubah
  Submit success: checkmark animation + toast
```

---

## STEP 7 — Shared Components Redesign

```
Redesign semua shared components berikut:

═══════════════════════════════════
BUTTONS
═══════════════════════════════════

Primary Button:
  Background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)
  Border: 1px solid #1d4ed8
  Box shadow: 0 1px 2px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.12)
  Text: white font-medium text-sm
  Padding: px-4 py-2
  Border radius: rounded-lg
  Hover: brightness(1.05) shadow lebih besar
  Active: scale(0.98) brightness(0.97)
  Disabled: opacity-50 cursor-not-allowed
  Loading: spinner kiri + text tetap ada (jangan hilang)

Secondary/Outline Button:
  Background: white
  Border: 1px solid zinc-300
  Box shadow: 0 1px 2px rgba(0,0,0,0.05)
  Text: text-foreground font-medium text-sm
  Hover: bg-zinc-50 border-zinc-400
  Active: scale(0.98) bg-zinc-100

Ghost Button:
  Background: transparent
  Text: text-zinc-600
  Hover: bg-zinc-100 text-zinc-800
  Tidak ada border, tidak ada shadow

Destructive Button:
  Sama dengan Primary tapi merah:
  Background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%)

═══════════════════════════════════
BADGES / STATUS INDICATORS
═══════════════════════════════════

Pattern wajib — TIDAK BOLEH background solid:
  .badge-success:  bg-emerald-500/10 text-emerald-700 border border-emerald-500/20
  .badge-warning:  bg-amber-500/10 text-amber-700 border border-amber-500/20
  .badge-error:    bg-red-500/10 text-red-700 border border-red-500/20
  .badge-info:     bg-blue-500/10 text-blue-700 border border-blue-500/20
  .badge-neutral:  bg-zinc-100 text-zinc-600 border border-zinc-200

Style: rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex items-center gap-1

Dot indicator opsional: w-1.5 h-1.5 rounded-full bg-current

═══════════════════════════════════
INPUT FIELDS
═══════════════════════════════════

Default state:
  Border: 1px solid zinc-300
  Background: white
  Border radius: rounded-lg
  Padding: px-3 py-2
  Font: text-sm
  Box shadow: 0 1px 2px rgba(0,0,0,0.04)

Focus state:
  Border: 1px solid primary
  Box shadow: 0 0 0 3px hsl(var(--primary)/0.12)
  Transition: 150ms

Error state:
  Border: 1px solid red-400
  Box shadow: 0 0 0 3px rgba(239,68,68,0.12)

Disabled:
  Background: bg-zinc-50
  Text: text-zinc-400
  Cursor: not-allowed

Label styling:
  text-sm font-medium text-foreground mb-1.5
  
Helper text:
  text-xs text-muted-foreground mt-1.5

Error text:
  text-xs text-red-500 mt-1.5

═══════════════════════════════════
LOADING SKELETONS
═══════════════════════════════════

Ganti semua loading state dengan skeleton yang akurat:

Skeleton base:
  @keyframes shimmer:
    background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)
    background-size: 200% 100%
    animation: shimmer 1.5s infinite

Setiap skeleton harus replicate exact layout konten aslinya.
Jangan pakai spinner saja untuk halaman penuh.
Gunakan Shadcn Skeleton component dengan className shimmer.

═══════════════════════════════════
TOAST NOTIFICATIONS
═══════════════════════════════════

Posisi: bottom-right, gap-2 antar toast
Border radius: rounded-xl
Padding: px-4 py-3
Box shadow: shadow-dropdown
Border kiri: 4px solid (warna sesuai type)

Success: border-emerald-500, bg-white, icon CheckCircle emerald
Error:   border-red-500, bg-white, icon XCircle red
Warning: border-amber-500, bg-white, icon AlertTriangle amber
Info:    border-blue-500, bg-white, icon Info blue

Framer Motion:
  Enter: x: 100% → 0, opacity 0 → 1, spring
  Exit:  x: 100%, opacity 0
  Auto-dismiss: 4 detik

═══════════════════════════════════
MODAL / DIALOG
═══════════════════════════════════

Overlay: bg-black/40 backdrop-blur-sm
Dialog: 
  Background: white
  Border: 1px solid zinc-200
  Border radius: rounded-2xl
  Padding: p-6
  Box shadow: shadow-dropdown
  Max width: 480px (small), 640px (medium), 768px (large)

Header:
  Title: font-display text-lg font-semibold
  Close button: top-right, ghost icon button

Footer:
  Border top: border-t border-zinc-100 mt-6 pt-4
  Buttons: flex justify-end gap-3

Framer Motion:
  Enter: scale 0.96 → 1, opacity 0 → 1, y 8 → 0
  Exit:  scale 0.96, opacity 0
```

---

## STEP 8 — Micro-interactions & Polish

```
Tambahkan micro-interactions berikut ke seluruh app:

═══════════════════════════════════
FRAMER MOTION VARIANTS (global)
═══════════════════════════════════

Buat file components/animations.ts dengan variants reusable:

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

export const stagger = {
  visible: { transition: { staggerChildren: 0.06 } }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
}

export const slideRight = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
}

export const spring = {
  type: 'spring', stiffness: 400, damping: 30
}

═══════════════════════════════════
INTERACTIVE ELEMENTS
═══════════════════════════════════

Semua clickable card:
  whileHover={{ y: -2, transition: { duration: 0.15 } }}
  whileTap={{ scale: 0.99 }}

Semua buttons:
  whileTap={{ scale: 0.97 }}

Nav items:
  whileHover={{ x: 2 }} duration 0.1

Progress bars:
  Animate width dari 0 saat pertama mount:
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}

Number counters (KPI):
  Animate dari 0 ke nilai aktual saat mount
  Gunakan useMotionValue + useTransform atau library react-countup

Page transitions:
  Setiap page change: fade-up ringan
  Layout: AnimatePresence mode="wait"

═══════════════════════════════════
ACCESSIBILITY
═══════════════════════════════════

Tambahkan ke semua animasi:
  Gunakan useReducedMotion() dari Framer Motion
  Kalau prefersReducedMotion: skip semua animasi, tetap functional

  const prefersReducedMotion = useReducedMotion()
  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }
```

---

## CARA PAKAI PROMPT INI

1. Paste **CONTEXT PROMPT** di awal setiap sesi
2. Lakukan **STEP 1 dulu** (globals.css + tailwind config) — ini fondasi semua step lain
3. Lakukan **STEP 2** (sidebar) — ada di semua halaman, paling impactful
4. Lakukan per halaman: **STEP 3** (dashboard) → **STEP 4** (WBS) → **STEP 5** (S-Curve) → **STEP 6** (progress input)
5. **STEP 7** (shared components) bisa dilakukan kapan saja tapi lebih baik awal
6. **STEP 8** (micro-interactions) paling terakhir sebagai polish

**Tips:**
- Jangan paste semua sekaligus — paste per step
- Kalau hasil kurang sesuai, minta AI untuk "show me only the changed parts"
- Selalu minta AI untuk "respect existing logic, only change styling"
- Test di mobile view setelah setiap step

---

*Design Improvement Prompt v1.0*
*Reference: Linear.app, Vercel Dashboard, Raycast, Liveblocks*
