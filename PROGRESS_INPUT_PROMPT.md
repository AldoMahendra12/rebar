# Progress Input Aktual Prompt
# Contractor Management SaaS — Field Progress Entry
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT

```
Kamu adalah senior fullstack engineer yang membantu saya membangun
fitur Progress Input Aktual pada contractor management SaaS.

Fitur ini adalah yang paling sering dipakai — supervisor/mandor
input progress pekerjaan setiap minggu atau bulan dari lapangan.

Data yang diinput di sini akan menjadi sumber data S-Curve aktual.
Tanpa fitur ini, S-Curve tidak punya data untuk ditampilkan.

Tech stack:
- Next.js 14 App Router + TypeScript
- Prisma + Neon (database)
- Clerk auth — requireOrg() wajib di setiap API route
- Shadcn/ui + Tailwind + Framer Motion
- React Query + React Hook Form + Zod
- Uploadthing (untuk upload foto lapangan)

Halaman: /projects/[id]/progress
```

---

## STEP 1 — API Routes

```
Buat semua API routes berikut:

══════════════════════════════════════
1. GET /api/projects/[id]/progress/periods
══════════════════════════════════════
Generate list periode berdasarkan startDate, endDate, dan periodType proyek.
Return status setiap periode (belum diisi, draft, submitted, locked).

Return:
[
  {
    periodDate: string,        // ISO date (start of week/month)
    periodLabel: string,       // "Minggu 1 — 1–7 Jan 2025" atau "Januari 2025"
    periodType: string,        // 'weekly' | 'monthly'
    status: string,            // 'empty' | 'draft' | 'submitted' | 'locked'
    submittedAt: string | null,
    submittedByName: string | null,
    isCurrent: boolean,        // apakah ini periode saat ini
    isPast: boolean,
    isFuture: boolean,
  }
]

Logic generate periode:
  Weekly:
    Mulai dari startDate proyek, round ke Senin terdekat
    Generate tiap Senin hingga endDate
    Label: "Minggu {n} — {tgl mulai}–{tgl akhir} {bulan} {tahun}"
    
  Monthly:
    Mulai dari bulan startDate proyek
    Generate tiap tanggal 1 bulan hingga endDate
    Label: "Januari 2025", "Februari 2025", dst.

Status per periode:
  Cek apakah ada progressActuals untuk periode ini
  'empty':     tidak ada record sama sekali
  'draft':     ada record tapi isLocked = false dan belum semua item diisi
  'submitted': semua leaf WBS items sudah diisi, isLocked = false
  'locked':    isLocked = true

══════════════════════════════════════
2. GET /api/projects/[id]/progress/[periodDate]
══════════════════════════════════════
Ambil data progress untuk periode tertentu.
periodDate format: YYYY-MM-DD

Return:
{
  period: {
    periodDate: string,
    periodLabel: string,
    periodType: string,
    status: string,
    isLocked: boolean,
  },
  items: [
    {
      wbsItemId: string,
      code: string,
      name: string,
      level: number,
      isLeaf: boolean,
      unit: string | null,
      weight: number,           // bobot % item ini
      
      // Data rencana
      plannedThisPeriod: number,      // % rencana periode ini
      plannedCumulative: number,      // % kumulatif rencana sampai periode ini
      
      // Data aktual (dari DB kalau sudah ada, null kalau belum)
      actualThisPeriod: number | null,
      actualCumulative: number | null,  // auto-calculated
      
      // Status item ini
      isSubmitted: boolean,
      notes: string | null,
      photos: [
        { id: string, fileUrl: string, fileName: string }
      ],
    }
  ],
  
  // Summary untuk footer
  summary: {
    weightedPlannedThisPeriod: number,   // bobot tertimbang rencana periode ini
    weightedActualThisPeriod: number,    // bobot tertimbang aktual periode ini
    weightedPlannedCumulative: number,   // kumulatif rencana sampai periode ini
    weightedActualCumulative: number,    // kumulatif aktual sampai periode ini
    deviation: number,                   // actual - planned cumulative
    completedItems: number,              // jumlah item yang sudah diisi
    totalLeafItems: number,              // total leaf items
  }
}

Query logic:
  1. Ambil semua WBS items proyek (ordered by sortOrder)
  2. Untuk setiap leaf node, ambil progressPlan untuk periodDate ini
  3. Untuk setiap leaf node, ambil progressActual untuk periodDate ini (kalau ada)
  4. Hitung actualCumulative: sum semua progressActuals sebelum dan termasuk periode ini
  5. Hitung summary

══════════════════════════════════════
3. POST /api/projects/[id]/progress/[periodDate]
══════════════════════════════════════
Save atau update progress aktual untuk periode tertentu.
Bisa partial save (tidak semua item harus diisi).

Body:
{
  items: [
    {
      wbsItemId: string,
      actualPercentage: number,   // 0-100
      notes: string | null,
    }
  ],
  action: 'draft' | 'submit'    // draft = simpan saja, submit = kunci
}

Logic:
  const { organizationId, userId } = await requireOrg()
  
  // Validasi: project milik org ini
  // Validasi: periode tidak locked
  // Validasi: actualPercentage 0-100
  // Validasi: actualCumulative tidak melebihi 100%
    (actualThisPeriod + previousCumulative <= 100)
  
  // Upsert semua items
  for (const item of body.items) {
    await prisma.progressActual.upsert({
      where: {
        wbsItemId_periodDate_periodType: {
          wbsItemId: item.wbsItemId,
          periodDate: new Date(periodDate),
          periodType: project.periodType,
        }
      },
      create: {
        wbsItemId: item.wbsItemId,
        organizationId,
        periodDate: new Date(periodDate),
        periodType: project.periodType,
        actualPercentage: item.actualPercentage,
        notes: item.notes,
        isLocked: body.action === 'submit',
        reportedById: userId,
      },
      update: {
        actualPercentage: item.actualPercentage,
        notes: item.notes,
        isLocked: body.action === 'submit',
      }
    })
  }
  
  return { success: true, action: body.action }

══════════════════════════════════════
4. PATCH /api/projects/[id]/progress/[periodDate]/lock
══════════════════════════════════════
Toggle lock/unlock periode. Hanya PM, Admin, Owner.

Body: { locked: boolean }

Logic:
  Cek role user — hanya 'pm' | 'admin' | 'owner' boleh unlock
  Update semua progressActuals untuk periodDate ini:
    isLocked = body.locked

══════════════════════════════════════
5. POST /api/projects/[id]/progress/[periodDate]/photos
══════════════════════════════════════
Upload foto untuk item progress tertentu.
Menggunakan Uploadthing.

Body: FormData dengan wbsItemId dan file

Simpan ke tabel ProgressPhoto:
  progressActualId, fileUrl, fileName, gpsLat (optional), gpsLng (optional)
```

---

## STEP 2 — Halaman Progress Input

```
Buat halaman app/(app)/projects/[id]/progress/page.tsx

══════════════════════════════════════
LAYOUT HALAMAN
══════════════════════════════════════

<div className="flex flex-col h-full">
  <ProgressHeader />           {/* sticky top */}
  <PeriodSelector />           {/* sticky di bawah header */}
  <ProgressTable />            {/* scrollable content */}
  <ProgressSummaryBar />       {/* sticky bottom */}
</div>

══════════════════════════════════════
PROGRESS HEADER
══════════════════════════════════════

Padding: px-6 py-4 border-b border-zinc-100
Background: white sticky top-0 z-20

Layout: flex items-center justify-between

Kiri:
  Title: "Input Progress" font-display text-xl font-semibold
  Sub: nama proyek + kode, text-sm text-muted-foreground

Kanan:
  Kalau periode locked:
    Badge: bg-zinc-100 text-zinc-500 rounded-full px-3 py-1
    Icon: Lock size 12
    "Periode Terkunci"
    
    Kalau user adalah PM/Admin/Owner:
      Tombol "Buka Kunci" outline size-sm
      onClick: PATCH lock endpoint { locked: false }
      Konfirmasi dulu: Alert dialog "Yakin ingin membuka kunci periode ini?"
  
  Kalau periode belum locked:
    Tombol "Simpan Draft" ghost (auto-save indicator)
    Tombol "Submit & Kunci" primary
      Disabled kalau tidak ada perubahan

══════════════════════════════════════
PERIOD SELECTOR
══════════════════════════════════════

Padding: px-6 py-3
Background: white/95 backdrop-blur sticky top-[65px] z-10
Border bawah: border-b border-zinc-100

Layout: flex items-center gap-3 overflow-x-auto (horizontal scroll)
Scrollbar: hidden (hide scrollbar tapi tetap scrollable)

Tiap periode — pill button:
  Default:
    bg-zinc-100 text-zinc-500 rounded-full px-4 py-2
    text-sm whitespace-nowrap
  
  Current (periode saat ini):
    border border-primary/30 bg-primary/5 text-primary
  
  Active/Selected:
    bg-foreground text-background
  
  Status indicator dot di pojok kanan atas pill:
    empty:     tidak ada dot
    draft:     dot amber (⬤)
    submitted: dot blue (⬤)  
    locked:    dot zinc dengan icon lock kecil (🔒)

Navigasi:
  Tombol arrow kiri/kanan di luar scroll area
  ChevronLeft / ChevronRight
  onClick: scroll ke periode sebelum/sesudah

Saat periode dipilih:
  Fetch data /api/projects/[id]/progress/[periodDate]
  Update URL dengan query param: ?period=2025-01-06
  (supaya bisa di-bookmark dan di-share)
```

---

## STEP 3 — Progress Table Component

```
Buat komponen ProgressTable.

══════════════════════════════════════
CONTAINER
══════════════════════════════════════
flex-1 overflow-y-auto px-6 py-4

══════════════════════════════════════
TABLE STRUCTURE
══════════════════════════════════════
Background: white
Border: 1px solid hsl(var(--border))
Border radius: rounded-xl
Overflow: hidden

TABLE HEADER:
  Background: bg-zinc-50
  Border bawah: border-b border-zinc-200
  Text: text-xs font-semibold uppercase tracking-wide text-zinc-500
  Padding cell: px-4 py-3
  
  Kolom:
    Kode:           70px    left-align
    Nama Pekerjaan: flex-1  left-align  (min 180px)
    Rencana (%):    110px   right-align — header bg-zinc-100 (read-only indicator)
    Kum. Rencana:   110px   right-align — header bg-zinc-100
    Input Aktual:   130px   right-align — header bg-primary/5 (editable indicator)
    Kum. Aktual:    110px   right-align — header bg-zinc-100 (auto-calc)
    Status:         90px    center
    Foto:           60px    center
    Catatan:        40px    center

══════════════════════════════════════
ROW TYPES
══════════════════════════════════════

ROW LEVEL 1 (pekerjaan utama — non-leaf):
  Background: bg-zinc-50/80
  Font: text-sm font-semibold text-foreground
  Tidak ada input — hanya tampil subtotal dari children
  Code: font-mono text-xs font-bold text-zinc-600
  
  Sel angka: tampilkan sum/average dari children
  Sel input: disabled, bg-zinc-100 text-zinc-400 "—"
  Sel foto & catatan: kosong

ROW LEVEL 2 (sub pekerjaan — non-leaf):
  Background: white
  Font: text-sm font-medium
  Indent nama: padding-left 20px
  Dot indicator: w-1.5 h-1.5 bg-zinc-300 rounded-full inline-block mr-2
  
  Sama dengan level 1 — tidak ada input

ROW LEVEL 3 (item / leaf node — bisa diinput):
  Background: white
  Font: text-sm text-foreground
  Indent nama: padding-left 40px
  
  Hover: bg-zinc-50/40
  
  Kalau periode locked:
    Semua sel read-only
    Background input: bg-zinc-50
    Cursor: default

  Kalau periode tidak locked:
    Input aktual bisa diedit

══════════════════════════════════════
SEL — RENCANA (read-only):
══════════════════════════════════════
  Background: bg-zinc-50
  Text: font-mono text-sm text-zinc-500 text-right px-4
  
  Kalau rencana = 0 untuk periode ini:
    Text: "—" text-zinc-300
  
  Kalau rencana > 0:
    Value: "{value}%"

══════════════════════════════════════
SEL — INPUT AKTUAL (editable):
══════════════════════════════════════
  Container: px-2 py-1
  
  Default (tidak sedang edit):
    Background: bg-primary/3
    Border: 1px solid primary/20
    Border radius: rounded-lg
    Text: font-mono text-sm font-medium text-right px-3 py-1.5
    
    Kalau belum ada nilai:
      Text: "—" text-zinc-300
      Background: bg-zinc-50 border-zinc-200
    
    Kalau ada nilai:
      Text: "{value}%" text-primary
    
    Klik → masuk edit mode

  Edit mode:
    <input type="number" min="0" max="100" step="0.1">
    Background: white
    Border: 1px solid primary
    Box shadow: 0 0 0 3px hsl(var(--primary)/0.12)
    Border radius: rounded-lg
    Text: font-mono text-sm text-right px-3 py-1.5
    
    Suffix "%" di kanan (absolute positioned)
    
    Validasi saat blur:
      < 0: set ke 0
      > 100: set ke 100
      Kalau cumulative > 100: tampilkan warning inline
    
    Tab: pindah ke input berikutnya (leaf node berikutnya)
    Enter: konfirmasi + pindah ke bawah
    Escape: cancel, kembali ke nilai sebelumnya

══════════════════════════════════════
SEL — KUMULATIF AKTUAL (auto-calculated):
══════════════════════════════════════
  Background: bg-zinc-50
  Text: font-mono text-sm text-right px-4
  
  Nilai: previousCumulative + actualThisPeriod
  
  Update realtime saat user mengetik di input aktual
  
  Color coding:
    = 100%: text-emerald-600 font-semibold (selesai 100%)
    >= planned cumulative: text-blue-600 (on track / ahead)
    < planned cumulative: text-red-500 (behind)
    null/0: text-zinc-300 "—"

══════════════════════════════════════
SEL — STATUS:
══════════════════════════════════════
  Badge kecil centered:
  
  Belum diisi:   bg-zinc-100 text-zinc-400 "—"
  Behind:        bg-red-500/10 text-red-600 "Behind"
  On Track:      bg-blue-500/10 text-blue-600 "On Track"
  Ahead:         bg-emerald-500/10 text-emerald-600 "Ahead"
  Selesai:       bg-emerald-500/15 text-emerald-700 font-semibold "100%"
  
  Logic:
    Kalau actualThisPeriod = null: "—"
    Kalau actualCumulative >= 100: "Selesai"
    Kalau actualCumulative >= plannedCumulative: "On Track" atau "Ahead"
    Kalau actualCumulative < plannedCumulative: "Behind"

══════════════════════════════════════
SEL — FOTO:
══════════════════════════════════════
  Kalau tidak ada foto:
    Icon: Camera size 14 text-zinc-300
    Klik → buka photo upload modal
    Hanya bisa klik kalau periode tidak locked
  
  Kalau ada 1 foto:
    Thumbnail 28x28px rounded object-cover
    Klik → buka photo viewer modal
  
  Kalau ada beberapa foto:
    Thumbnail pertama + overlay "+N"
    bg-black/50 text-white text-xs

══════════════════════════════════════
SEL — CATATAN:
══════════════════════════════════════
  Kalau tidak ada catatan:
    Icon: MessageSquare size 14 text-zinc-300
    Klik → inline popover dengan textarea
  
  Kalau ada catatan:
    Icon: MessageSquareDot size 14 text-primary (filled indicator)
    Hover tooltip: preview catatan (max 100 char)
    Klik → buka popover untuk edit

══════════════════════════════════════
FOOTER ROW — BOBOT TERTIMBANG:
══════════════════════════════════════
  Background: bg-zinc-50
  Border top: border-t-2 border-zinc-200
  Font: text-sm font-semibold
  Padding: px-4 py-3.5

  Kolom Nama: "BOBOT TERTIMBANG PERIODE INI"
    text-xs font-semibold uppercase tracking-wide text-zinc-500
  
  Kolom Rencana:
    "{weightedPlannedThisPeriod}%"
    font-mono text-zinc-600
  
  Kolom Input Aktual:
    "{weightedActualThisPeriod}%"
    font-mono text-primary font-semibold
    Update realtime saat user input
  
  Kolom Kumulatif Rencana:
    "{weightedPlannedCumulative}%"
    font-mono text-zinc-600
  
  Kolom Kumulatif Aktual:
    "{weightedActualCumulative}%"
    Color: merah kalau behind, biru/hijau kalau on track
    font-mono font-semibold
    Update realtime

══════════════════════════════════════
WARNING — CUMULATIVE > 100%:
══════════════════════════════════════
  Kalau user input menyebabkan cumulative > 100%:
  
  Inline warning di bawah input cell:
    bg-amber-50 border border-amber-200 rounded px-2 py-1 text-xs text-amber-700
    "Kumulatif akan melebihi 100%. Maks: {maxAllowed}%"
  
  Input di-cap otomatis ke maxAllowed
  Framer Motion: shake animation pada input
```

---

## STEP 4 — Summary Bar (Sticky Bottom)

```
Buat komponen ProgressSummaryBar — sticky di bottom halaman.

Background: white
Border top: border-t border-zinc-200
Box shadow: 0 -4px 16px rgba(0,0,0,0.06)
Padding: px-6 py-4
Sticky: bottom-0 z-20

Layout: flex items-center justify-between gap-6

══════════════════════════════════════
KIRI — PROGRESS SUMMARY METRICS
══════════════════════════════════════

Flex row gap-6:

Metric 1 — Rencana Periode:
  Label: "Rencana" text-xs text-zinc-400 uppercase tracking-wide
  Value: "{weightedPlannedThisPeriod}%" text-sm font-mono font-medium text-zinc-600

Metric 2 — Aktual Periode:
  Label: "Aktual" text-xs text-zinc-400 uppercase tracking-wide
  Value: "{weightedActualThisPeriod}%" text-sm font-mono font-semibold text-foreground
  Update realtime

Divider vertikal: w-px h-8 bg-zinc-200

Metric 3 — Kumulatif Rencana:
  Label: "Kum. Rencana" text-xs text-zinc-400 uppercase tracking-wide
  Value: "{weightedPlannedCumulative}%" text-sm font-mono text-zinc-600

Metric 4 — Kumulatif Aktual:
  Label: "Kum. Aktual" text-xs text-zinc-400 uppercase tracking-wide
  Value: "{weightedActualCumulative}%"
  Color: merah kalau behind, biru kalau on track
  text-sm font-mono font-semibold

Divider vertikal

Metric 5 — Deviasi:
  Label: "Deviasi" text-xs text-zinc-400 uppercase tracking-wide
  Value: "{deviation}%"
  Positif: "+{n}%" text-emerald-600 font-semibold
  Negatif: "{n}%" text-red-500 font-semibold
  Nol: "0%" text-zinc-600

Progress completion indicator:
  "{completedItems}/{totalLeafItems} item diisi"
  text-xs text-zinc-400
  Progress pill: bg-zinc-100 rounded-full w-24 h-1.5
  Fill: bg-primary rounded-full
  Width: (completedItems/totalLeafItems) * 100%

══════════════════════════════════════
KANAN — ACTION BUTTONS
══════════════════════════════════════

Kalau periode locked:
  Badge: Lock icon + "Periode terkunci — hanya baca"
  text-sm text-zinc-500

Kalau periode tidak locked:
  Tombol "Simpan Draft":
    Variant: ghost
    Icon: Save size 14
    Disabled saat tidak ada perubahan (isDirty = false)
    Loading state: spinner + "Menyimpan..."
    
    Auto-save:
      Setiap 30 detik kalau ada perubahan yang belum disimpan
      Indicator kecil: "Tersimpan otomatis 2 mnt lalu" text-xs text-zinc-400
  
  Tombol "Submit & Kunci":
    Variant: primary
    Icon: CheckCircle size 14
    Disabled kalau tidak ada item yang diisi
    
    onClick → Alert Dialog konfirmasi:
      Title: "Submit Progress Periode Ini?"
      Body: 
        "Setelah disubmit, data akan dikunci dan tidak bisa diubah
        kecuali PM/Admin membuka kunci."
        
        Summary dalam dialog:
          "Periode: {label}"
          "Item diisi: {completedItems}/{totalLeafItems}"
          "Bobot tertimbang aktual: {weighted}%"
          "Deviasi: {deviation}%"
      
      Cancel: "Batal"
      Confirm: "Ya, Submit & Kunci" (destructive style)

Framer Motion:
  Summary bar slide-up dari bawah saat pertama load
  Metric numbers: animate value changes (smooth transition)
  Tombol submit: pulse subtle saat ada perubahan belum tersimpan
```

---

## STEP 5 — Photo Upload Modal

```
Buat komponen PhotoUploadModal.

Trigger: klik icon Camera di sel foto

Modal size: max-w-md

══════════════════════════════════════
HEADER
══════════════════════════════════════
  Title: "Foto Lapangan"
  Sub: nama WBS item
  Close button

══════════════════════════════════════
EXISTING PHOTOS (kalau sudah ada)
══════════════════════════════════════
  Grid 3 kolom foto-foto yang sudah diupload:
    Tiap foto: 
      Thumbnail dengan aspect-ratio 1:1 object-cover rounded-lg
      Hover: overlay gelap dengan icon Trash2 (hapus)
      Klik foto: buka lightbox full-size

══════════════════════════════════════
UPLOAD AREA
══════════════════════════════════════
  Dropzone:
    Border: 2px dashed zinc-300
    Border radius: rounded-xl
    Padding: p-8
    Hover / drag-over: border-primary bg-primary/3
    
    Icon: ImagePlus size 32 text-zinc-300
    Text: "Drag & drop foto atau klik untuk pilih"
    Sub: "JPG, PNG, WEBP — Maks. 10MB per foto"
    
    Klik → file picker (accept: image/*)
    Multiple: true (bisa pilih beberapa sekaligus)
  
  Upload progress:
    Per file: nama file + progress bar + ukuran
    Setelah upload: thumbnail muncul di grid atas
  
  Menggunakan Uploadthing useUploadThing hook

══════════════════════════════════════
FOOTER
══════════════════════════════════════
  Kiri: "{n} foto" counter
  Kanan: tombol "Selesai" primary → close modal
```

---

## STEP 6 — Notes Popover

```
Buat komponen NotesPopover (Shadcn Popover).

Trigger: klik icon catatan di sel baris

Ukuran popover: w-72

Content:
  Label: nama WBS item (truncate)
  Textarea:
    placeholder: "Tambahkan catatan untuk item ini..."
    rows: 4
    maxLength: 300
    Counter: "{length}/300" text-xs text-right text-zinc-400
    Auto-focus saat popover buka
  
  Footer popover:
    Tombol "Simpan Catatan" size-sm primary
    onClick: update notes di local state + auto-save ke API

Framer Motion:
  Popover: scale 0.95 → 1 + opacity 0 → 1
```

---

## STEP 7 — Auto-save Logic

```
Implementasi auto-save di halaman progress.

State management:
  const [localData, setLocalData] = useState<Map<string, ProgressItemLocal>>()
  const [isDirty, setIsDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  interface ProgressItemLocal {
    wbsItemId: string
    actualPercentage: number | null
    notes: string | null
    isDirty: boolean
  }

Auto-save trigger:
  useEffect(() => {
    if (!isDirty) return
    
    const timer = setTimeout(async () => {
      await saveDraft()
    }, 30_000) // 30 detik
    
    return () => clearTimeout(timer)
  }, [isDirty, localData])

saveDraft function:
  Hanya save item yang isDirty = true
  POST ke API dengan action: 'draft'
  Setelah berhasil:
    setIsDirty(false)
    setLastSaved(new Date())
    Reset isDirty per item

lastSaved indicator text:
  null:            "Belum tersimpan"
  < 1 menit lalu:  "Baru saja tersimpan"
  < 1 jam:         "Tersimpan {n} menit lalu"
  >= 1 jam:        "Tersimpan {format time}"

Keyboard shortcut:
  Ctrl+S / Cmd+S → trigger saveDraft
  Tambahkan useEffect untuk keydown listener
```

---

## STEP 8 — Submit & Lock Flow

```
Implementasi submit dan lock periode.

Submit flow:
  1. User klik "Submit & Kunci"
  2. Alert dialog konfirmasi muncul dengan summary
  3. User confirm
  4. POST ke API dengan action: 'submit'
     Body: semua items (termasuk yang actualPercentage = 0)
  5. Loading state di tombol
  6. Setelah berhasil:
     a. Invalidate React Query untuk periode ini
     b. Update periode status di period selector → 'locked'
     c. Toast sukses: "Progress periode {label} berhasil dikunci"
     d. Halaman masuk read-only mode
     e. Invalidate S-Curve queries (supaya S-Curve update)
        queryClient.invalidateQueries(['s-curve', projectId])
        queryClient.invalidateQueries(['dashboard-kpi'])
        queryClient.invalidateQueries(['dashboard-attention'])

Unlock flow (PM/Admin only):
  1. User klik "Buka Kunci"
  2. Alert dialog: "Yakin membuka kunci? Data bisa diubah kembali."
  3. PATCH ke API { locked: false }
  4. Halaman kembali ke edit mode
  5. Toast: "Periode dibuka. Data bisa diubah kembali."
```

---

## STEP 9 — Loading & Empty States

```
══════════════════════════════════════
LOADING STATE (saat fetch data periode)
══════════════════════════════════════

Table skeleton:
  Header: shimmer row
  8 skeleton rows:
    Tiap row: shimmer cells dengan width bervariasi
    Leaf rows: input cell area lebih highlight (bg-primary/5 shimmer)

Period selector skeleton:
  5 pill skeletons dengan width bervariasi

══════════════════════════════════════
EMPTY STATE — BELUM ADA WBS
══════════════════════════════════════

Kalau proyek belum punya WBS items:
  Center di halaman:
    Icon: ListTree size 48 text-zinc-200
    Title: "WBS belum disetup"
    Sub: "Setup WBS terlebih dahulu sebelum input progress"
    Tombol: "Buka WBS Builder" primary → /projects/[id]/wbs

══════════════════════════════════════
EMPTY STATE — BELUM ADA RENCANA
══════════════════════════════════════

Kalau WBS ada tapi progress planning belum diisi:
  Center di halaman:
    Icon: CalendarRange size 48 text-zinc-200
    Title: "Rencana progress belum dibuat"
    Sub: "Buat rencana S-Curve terlebih dahulu"
    Tombol: "Buka Planning" primary → /projects/[id]/planning

══════════════════════════════════════
STATE — PERIODE DI LUAR RANGE
══════════════════════════════════════

Kalau semua periode sudah locked dan tidak ada yang bisa diinput:
  Banner info di atas tabel:
    bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3
    "Semua periode sudah terkunci. Hubungi PM untuk membuka kunci."
```

---

## STEP 10 — React Query Setup

```
Buat hooks/use-progress.ts:

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch periods list
export function useProgressPeriods(projectId: string) {
  return useQuery({
    queryKey: ['progress-periods', projectId],
    queryFn: () => fetch(`/api/projects/${projectId}/progress/periods`)
      .then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  })
}

// Fetch progress data untuk satu periode
export function useProgressData(projectId: string, periodDate: string | null) {
  return useQuery({
    queryKey: ['progress-data', projectId, periodDate],
    queryFn: () => fetch(`/api/projects/${projectId}/progress/${periodDate}`)
      .then(r => r.json()),
    enabled: !!periodDate,
    staleTime: 2 * 60 * 1000,
  })
}

// Save progress mutation
export function useSaveProgress(projectId: string, periodDate: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: { items: ProgressItemInput[], action: 'draft' | 'submit' }) =>
      fetch(`/api/projects/${projectId}/progress/${periodDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress-data', projectId, periodDate] })
      queryClient.invalidateQueries({ queryKey: ['progress-periods', projectId] })
      
      if (variables.action === 'submit') {
        // Invalidate semua yang berkaitan dengan progress
        queryClient.invalidateQueries({ queryKey: ['s-curve', projectId] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpi'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-attention'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard-portfolio-scurve'] })
      }
    }
  })
}
```

---

## CHECKLIST IMPLEMENTASI

Lakukan dalam urutan ini:

- [ ] Step 1: Buat semua 5 API routes
- [ ] Step 2: Halaman progress + layout structure
- [ ] Step 3: ProgressTable component (baris, sel, input)
- [ ] Step 4: ProgressSummaryBar (sticky bottom + actions)
- [ ] Step 5: PhotoUploadModal (Uploadthing)
- [ ] Step 6: NotesPopover
- [ ] Step 7: Auto-save logic (30 detik + Ctrl+S)
- [ ] Step 8: Submit & Lock flow + Alert dialog
- [ ] Step 9: Loading & empty states
- [ ] Step 10: React Query hooks

Test cases setelah implementasi:
- [ ] Period selector tampil semua periode dengan status ✅
- [ ] Klik periode → load data periode tersebut ✅
- [ ] Input angka → cumulative auto-update realtime ✅
- [ ] Input > max cumulative → warning + cap otomatis ✅
- [ ] Tab key pindah antar input field ✅
- [ ] Auto-save setiap 30 detik ✅
- [ ] Ctrl+S trigger save ✅
- [ ] Upload foto → thumbnail muncul ✅
- [ ] Submit → periode locked → read-only mode ✅
- [ ] PM unlock → kembali editable ✅
- [ ] Setelah submit → S-Curve query invalidated ✅
- [ ] Empty state WBS belum setup ✅
- [ ] Empty state planning belum dibuat ✅

---

*Progress Input Aktual Prompt v1.0*
