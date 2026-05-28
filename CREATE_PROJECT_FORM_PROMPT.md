# Buat Proyek — Form & API Prompt
# Contractor Management SaaS
# Paste this to your AI coding agent (Gemini Flash/Pro)

---

## CONTEXT

```
Kamu adalah senior fullstack engineer yang membantu saya membuat
fitur "Buat Proyek" pada contractor management SaaS.

Ketika user klik tombol "+ Buat Proyek", muncul form multi-step
sebagai modal/sheet yang terhubung langsung ke database.

Tech stack:
- Next.js 14 App Router + TypeScript
- Prisma + Neon (database)
- Clerk auth — requireOrg() wajib di setiap API route
- Shadcn/ui + Tailwind + Framer Motion
- React Query + React Hook Form + Zod (validasi)
- Zustand (navigation store — untuk setActiveProject setelah create)

Setelah proyek berhasil dibuat:
  1. setActiveProject({ id, name, code }) dari navigation store
  2. router.push ke /projects/[id]/wbs (langsung ke WBS builder)
  3. Karena WBS adalah langkah pertama yang harus diisi
```

---

## STEP 1 — Zod Schema & Types

```
Buat file lib/validations/project.ts:

import { z } from 'zod'

export const createProjectSchema = z.object({
  // Step 1 — Info Dasar
  name: z.string()
    .min(3, 'Nama proyek minimal 3 karakter')
    .max(100, 'Nama proyek maksimal 100 karakter'),
  
  code: z.string()
    .min(2, 'Kode proyek minimal 2 karakter')
    .max(20, 'Kode proyek maksimal 20 karakter')
    .regex(/^[A-Z0-9\-]+$/, 'Kode hanya boleh huruf kapital, angka, dan strip')
    .transform(val => val.toUpperCase()),
  
  clientName: z.string()
    .min(2, 'Nama klien minimal 2 karakter')
    .max(100),
  
  location: z.string()
    .min(3, 'Lokasi minimal 3 karakter')
    .max(200),
  
  description: z.string().max(500).optional(),

  // Step 2 — Kontrak
  contractValue: z.coerce.number()
    .positive('Nilai kontrak harus lebih dari 0')
    .min(1000000, 'Nilai kontrak minimal Rp 1.000.000'),
  
  startDate: z.string()
    .min(1, 'Tanggal mulai harus diisi')
    .refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  
  endDate: z.string()
    .min(1, 'Tanggal selesai harus diisi')
    .refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  
  periodType: z.enum(['weekly', 'monthly'], {
    required_error: 'Pilih tipe periode'
  }),

  // Step 3 — Tim (opsional saat create, bisa invite nanti)
  memberIds: z.array(z.string()).optional().default([]),
  
}).refine(data => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['endDate'],
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

// Type untuk step-by-step validation
export const step1Schema = createProjectSchema.pick({
  name: true, code: true, clientName: true, location: true, description: true
})

export const step2Schema = createProjectSchema.pick({
  contractValue: true, startDate: true, endDate: true, periodType: true
})

export const step3Schema = createProjectSchema.pick({
  memberIds: true
})
```

---

## STEP 2 — API Route

```
Buat app/api/projects/route.ts:

Method POST — Create new project

import { NextRequest, NextResponse } from 'next/server'
import { requireOrg } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations/project'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const { organizationId, userId } = await requireOrg()
    
    const body = await req.json()
    const validated = createProjectSchema.parse(body)
    
    // Cek apakah kode proyek sudah dipakai di org ini
    const existingCode = await prisma.project.findFirst({
      where: {
        organizationId,
        code: validated.code,
      }
    })
    
    if (existingCode) {
      return NextResponse.json(
        { error: 'Kode proyek sudah digunakan. Pilih kode lain.' },
        { status: 409 }
      )
    }
    
    // Cek batas subscription (jumlah proyek aktif)
    // Ambil subscription tier dari organization
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true, subscriptionStatus: true }
    })
    
    if (!org) {
      return NextResponse.json({ error: 'Organization tidak ditemukan' }, { status: 404 })
    }
    
    // Hitung proyek aktif saat ini
    const activeProjectCount = await prisma.project.count({
      where: { organizationId, status: { in: ['active', 'planning'] } }
    })
    
    // Batas per tier
    const projectLimits: Record<string, number> = {
      trial:      3,
      starter:    3,
      pro:        15,
      business:   Infinity,
      enterprise: Infinity,
    }
    
    const limit = projectLimits[org.subscriptionTier] ?? 3
    
    if (activeProjectCount >= limit) {
      return NextResponse.json(
        { 
          error: `Batas proyek untuk paket ${org.subscriptionTier} adalah ${limit} proyek. Upgrade untuk menambah lebih banyak.`,
          code: 'PROJECT_LIMIT_REACHED',
          currentTier: org.subscriptionTier,
        },
        { status: 403 }
      )
    }
    
    // Buat proyek
    const project = await prisma.project.create({
      data: {
        organizationId,
        name: validated.name,
        code: validated.code,
        clientName: validated.clientName,
        location: validated.location,
        description: validated.description ?? null,
        contractValue: validated.contractValue,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        periodType: validated.periodType,
        status: 'planning',
        createdById: userId,
      }
    })
    
    // Kalau ada member yang diinvite, tambahkan ke project
    // (implementasi project members — sesuaikan dengan schema kamu)
    
    return NextResponse.json(
      { 
        success: true, 
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
        }
      },
      { status: 201 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat proyek. Coba lagi.' },
      { status: 500 }
    )
  }
}

// Method GET — sudah ada sebelumnya untuk fetch semua projects
// Jangan hapus, biarkan tetap ada
```

---

## STEP 3 — Auto Generate Project Code API

```
Buat app/api/projects/generate-code/route.ts:

Ini dipanggil saat user ketik nama proyek,
auto-suggest kode proyek yang belum dipakai.

import { NextRequest, NextResponse } from 'next/server'
import { requireOrg } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrg()
    const { name } = await req.json()
    
    if (!name || name.length < 2) {
      return NextResponse.json({ code: '' })
    }
    
    // Generate base code dari nama proyek
    // Ambil huruf pertama tiap kata, max 4 huruf, uppercase
    const words = name.trim().split(/\s+/)
    let baseCode = words
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 4)
    
    if (baseCode.length < 2) {
      baseCode = name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')
    }
    
    // Cari nomor urut yang belum dipakai
    let counter = 1
    let candidateCode = ''
    
    while (counter <= 999) {
      candidateCode = `${baseCode}-${String(counter).padStart(3, '0')}`
      
      const existing = await prisma.project.findFirst({
        where: { organizationId, code: candidateCode }
      })
      
      if (!existing) break
      counter++
    }
    
    return NextResponse.json({ code: candidateCode })
    
  } catch {
    return NextResponse.json({ code: '' })
  }
}

Contoh hasil:
  "Gedung Perkantoran Sudirman" → "GPS-001"
  "Jembatan Sungai Musi"       → "JSM-001"
  "Perumahan Grand City"       → "PGC-001"
```

---

## STEP 4 — Modal Form Component

```
Buat komponen components/projects/create-project-modal.tsx.

Gunakan Shadcn Dialog (bukan Sheet) — modal di tengah layar.
Form multi-step dengan 3 langkah.

══════════════════════════════════════
MODAL CONTAINER
══════════════════════════════════════

<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
    {/* Tidak pakai DialogHeader default, buat custom */}
    <CreateProjectForm onSuccess={handleSuccess} onClose={onClose} />
  </DialogContent>
</Dialog>

Ukuran modal: max-w-lg (512px)
Tidak bisa ditutup saat sedang submit (loading)

══════════════════════════════════════
FORM STATE (gunakan useState, bukan library)
══════════════════════════════════════

const [currentStep, setCurrentStep] = useState(1) // 1 | 2 | 3
const [isSubmitting, setIsSubmitting] = useState(false)
const [formData, setFormData] = useState<Partial<CreateProjectInput>>({
  periodType: 'weekly' // default
})

Gunakan React Hook Form per step dengan Zod resolver:
  Step 1: useForm dengan step1Schema
  Step 2: useForm dengan step2Schema
  Step 3: useForm dengan step3Schema (opsional)

══════════════════════════════════════
MODAL HEADER (custom, sticky)
══════════════════════════════════════

Padding: px-6 pt-6 pb-4
Border bawah: border-b border-zinc-100

Kiri:
  Step indicator pills:
    3 pills kecil berjejer
    Active: bg-primary w-6 h-1.5 rounded-full
    Done:   bg-primary/30 w-4 h-1.5 rounded-full
    Todo:   bg-zinc-200 w-4 h-1.5 rounded-full
    Gap: gap-1.5
    Framer Motion: layoutId animate width & color

  Title per step:
    Step 1: "Informasi Proyek"
    Step 2: "Detail Kontrak"
    Step 3: "Undang Tim" + badge "(Opsional)"
    
    font-display text-lg font-semibold text-foreground
  
  Sub per step:
    Step 1: "Isi informasi dasar proyek"
    Step 2: "Isi nilai dan jadwal kontrak"
    Step 3: "Tambahkan anggota tim ke proyek ini"
    
    text-sm text-muted-foreground mt-0.5

Kanan: 
  Close button: X icon, ghost, 
  Disabled saat isSubmitting

══════════════════════════════════════
STEP 1 — INFORMASI PROYEK
══════════════════════════════════════

Padding: px-6 py-5
Space-y: space-y-4

[Field: Nama Proyek]
  Label: "Nama Proyek *"
  Input: placeholder "contoh: Gedung Perkantoran Sudirman"
  
  onBlur atau onChange (debounce 600ms):
    → fetch /api/projects/generate-code dengan nama yang diinput
    → isi otomatis field Kode Proyek kalau masih kosong/belum diedit manual

[Field: Kode Proyek]
  Label: "Kode Proyek *"
  Input: 
    placeholder "GPS-001"
    style: font-mono
    transform: toUpperCase() saat typing
  
  Helper text: "Kode unik untuk identifikasi proyek. Auto-generate dari nama."
  
  Right element dalam input: 
    Spinner kecil saat sedang generate code
    Check icon hijau kalau kode valid & belum dipakai

[Field: Nama Klien]
  Label: "Nama Klien *"
  Input: placeholder "PT. Maju Jaya Indonesia"

[Field: Lokasi]
  Label: "Lokasi Proyek *"
  Input: placeholder "Jl. Sudirman No.1, Jakarta Selatan"

[Field: Deskripsi]
  Label: "Deskripsi" + badge "(Opsional)"
  Textarea: 
    placeholder "Deskripsi singkat tentang proyek ini..."
    rows: 3
    maxLength: 500
  Right bottom: counter "{length}/500" text-xs text-muted-foreground

══════════════════════════════════════
STEP 2 — DETAIL KONTRAK
══════════════════════════════════════

Padding: px-6 py-5
Space-y: space-y-4

[Field: Nilai Kontrak]
  Label: "Nilai Kontrak *"
  
  Input dengan prefix "Rp":
    Container: flex items-center border border-zinc-300 rounded-lg overflow-hidden
    Prefix: px-3 bg-zinc-50 border-r border-zinc-300 text-sm text-zinc-500 "Rp"
    Input: flex-1 px-3 py-2 text-sm font-mono border-0 focus:ring-0
    
  Format: angka saja tanpa separator saat typing
  Display: format dengan titik saat tidak focus "18.500.000.000"
  
  Helper text di bawah: tampilkan dalam format singkat saat diisi
    "= Rp 18,5 Miliar" text-xs text-primary

[Field: Tanggal Mulai & Selesai — dalam satu row]
  Grid: grid-cols-2 gap-4
  
  Tanggal Mulai:
    Label: "Tanggal Mulai *"
    Input type="date"
    Min: hari ini
  
  Tanggal Selesai:
    Label: "Tanggal Selesai *"
    Input type="date"
    Min: startDate + 1 hari (update dinamis)

  Kalau endDate < startDate → error inline merah di bawah field Selesai

  Setelah kedua tanggal diisi — tampilkan durasi proyek:
    Info chip: "Durasi: 18 bulan (547 hari)"
    bg-blue-50 text-blue-600 text-xs rounded-lg px-3 py-2 flex items-center gap-2
    icon: CalendarDays size 14

[Field: Tipe Periode]
  Label: "Tipe Periode Pelaporan *"
  
  Bukan dropdown — pakai 2 card selector:
  
  Grid: grid-cols-2 gap-3
  
  Card Mingguan:
    Border: 1px solid zinc-200
    Border radius: rounded-xl
    Padding: p-4
    Cursor: pointer
    
    Selected state:
      Border: 2px solid primary
      Background: bg-primary/3
      
    Content:
      Icon: CalendarDays size 20 text-primary (atau zinc-400 kalau unselected)
      Title: "Mingguan" text-sm font-semibold mt-2
      Sub: "Input progress setiap minggu" text-xs text-muted-foreground mt-1
      
      Cocok untuk: badge kecil
      "Proyek jangka pendek" text-2xs text-zinc-400 mt-2
    
    Selected indicator: checkmark circle di pojok kanan atas
      bg-primary text-white rounded-full p-0.5
      icon: Check size 10
      Framer Motion: scale 0 → 1 saat selected
    
  Card Bulanan:
    Sama dengan Mingguan tapi:
    Icon: CalendarRange
    Title: "Bulanan"
    Sub: "Input progress setiap bulan"
    "Proyek jangka panjang" text-2xs

══════════════════════════════════════
STEP 3 — UNDANG TIM (OPSIONAL)
══════════════════════════════════════

Padding: px-6 py-5

Info banner:
  bg-blue-50 border border-blue-100 rounded-xl p-3
  Icon: Info size 14 text-blue-500
  Text: "Langkah ini opsional. Kamu bisa undang tim nanti dari pengaturan proyek."
  text-xs text-blue-600

[Field: Cari & Tambah Anggota]
  Label: "Anggota Tim"
  
  Search input:
    placeholder "Cari nama atau email anggota..."
    Fetch dari /api/organization/members saat typing (debounce 300ms)
    Dropdown hasil pencarian di bawah input (Shadcn Popover)
    
  Dropdown item per member:
    Avatar 24px + nama + role badge + email
    Klik → tambah ke selected list di bawah
    
  Selected members list:
    Tiap member: chip/pill
    Avatar 20px + nama + role dropdown + X button
    Role dropdown: PM | Supervisor | Viewer
    Default role: Supervisor
    
  Kalau belum ada member lain di org:
    Empty state kecil: "Belum ada anggota lain di organisasi"
    Link: "Undang anggota baru dari Pengaturan Tim"

══════════════════════════════════════
MODAL FOOTER (sticky bottom)
══════════════════════════════════════

Border top: border-t border-zinc-100
Padding: px-6 py-4
Background: white

Layout: flex items-center justify-between

Kiri:
  Step 1: tidak ada tombol kiri
  Step 2: tombol "← Kembali" ghost
  Step 3: tombol "← Kembali" ghost

Kanan:
  Step 1: tombol "Lanjut →" primary
  Step 2: tombol "Lanjut →" primary
  Step 3:
    Tombol "Lewati & Buat Proyek" outline (tanpa invite tim)
    Tombol "Buat Proyek" primary
  
  Disabled state:
    Tombol "Lanjut" disabled kalau form step saat ini invalid
    Validasi real-time dengan React Hook Form

══════════════════════════════════════
SUBMIT LOADING STATE
══════════════════════════════════════

Saat submit (tombol "Buat Proyek" diklik):
  - isSubmitting = true
  - Tombol: spinner kecil + "Membuat proyek..."
  - Seluruh form disabled
  - Modal tidak bisa ditutup (X button disabled)
  - Tidak bisa klik di luar modal

Sequence saat submit berhasil:
  1. Modal content berubah ke SUCCESS STATE (jangan close dulu)
  2. Tunggu 1.5 detik
  3. Close modal
  4. setActiveProject({ id, name, code })
  5. router.push(`/projects/${id}/wbs`)
  6. Toast: "Proyek berhasil dibuat! Sekarang setup WBS proyek."

══════════════════════════════════════
SUCCESS STATE (dalam modal)
══════════════════════════════════════

Ganti seluruh konten modal dengan:
  Framer Motion: scaleIn + fadeIn

  Center content:
    Animated checkmark:
      Circle bg-emerald-100 w-16 h-16 rounded-full flex center
      Icon: Check size 32 text-emerald-500
      Framer Motion: draw animation pada checkmark (pathLength 0 → 1)
    
    Title: "Proyek Berhasil Dibuat!" 
      font-display text-lg font-semibold mt-4
    
    Sub: "Mengarahkan ke WBS Builder..."
      text-sm text-muted-foreground mt-1
    
    Progress bar tipis di bawah:
      Animate dari 0% → 100% dalam 1.5 detik
      h-1 bg-primary rounded-full

══════════════════════════════════════
ERROR STATE
══════════════════════════════════════

Kalau API return error (409 kode duplikat, 403 limit tercapai, 500):
  Jangan close modal
  Tampilkan error banner di atas footer:
    bg-red-50 border border-red-100 rounded-xl px-4 py-3
    Icon: XCircle size 14 text-red-500
    Pesan error dari API
    text-sm text-red-600
  
  Kalau error code = 'PROJECT_LIMIT_REACHED':
    Pesan: "Batas proyek untuk paket kamu sudah tercapai."
    Tambahkan tombol "Upgrade Paket" di dalam error banner → /settings/billing
  
  Framer Motion: slide-down error banner

══════════════════════════════════════
FRAMER MOTION — STEP TRANSITIONS
══════════════════════════════════════

Saat ganti step (next/back):
  AnimatePresence mode="wait"
  
  Step masuk dari kanan (next):
    initial: { opacity: 0, x: 20 }
    animate: { opacity: 1, x: 0 }
    exit:    { opacity: 0, x: -20 }
    transition: { duration: 0.2, ease: 'easeOut' }
  
  Step masuk dari kiri (back):
    initial: { opacity: 0, x: -20 }
    animate: { opacity: 1, x: 0 }
    exit:    { opacity: 0, x: 20 }
  
  Step indicator pills: layoutId sliding animation

══════════════════════════════════════
FORM FIELD COMPONENT (reusable)
══════════════════════════════════════

Buat komponen FormField reusable:

interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  helper?: string
  children: React.ReactNode
}

function FormField({ label, required, optional, error, helper, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground 
                          bg-zinc-100 px-1.5 py-0.5 rounded">
            Opsional
          </span>
        )}
      </label>
      {children}
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 flex items-center gap-1"
        >
          <AlertCircle size={12} />
          {error}
        </motion.p>
      )}
    </div>
  )
}
```

---

## STEP 5 — Trigger Modal dari Tombol

```
Update semua tempat yang ada tombol "+ Buat Proyek":

Lokasi tombol ini ada di:
  1. /dashboard — PageHeader (kanan atas)
  2. /projects  — Header halaman
  3. /dashboard — Empty state CTA

Buat state management untuk modal di level yang tepat.
Gunakan Zustand atau simple useState di layout.

Cara paling clean — buat custom hook:

// hooks/use-create-project-modal.ts
import { create } from 'zustand'

interface CreateProjectModalStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useCreateProjectModal = create<CreateProjectModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

Tempatkan <CreateProjectModal /> di app/(app)/layout.tsx:
  Render sekali saja di layout, bukan di tiap halaman.
  
  import { CreateProjectModal } from '@/components/projects/create-project-modal'
  import { useCreateProjectModal } from '@/hooks/use-create-project-modal'
  
  export default function AppLayout({ children }) {
    const { isOpen, close } = useCreateProjectModal()
    
    return (
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <CreateProjectModal open={isOpen} onClose={close} />
      </div>
    )
  }

Di setiap tombol "+ Buat Proyek":
  const { open } = useCreateProjectModal()
  <Button onClick={open}>+ Buat Proyek</Button>
```

---

## STEP 6 — React Query Mutation

```
Buat fungsi mutation untuk create project.
Tempatkan di hooks/use-create-project.ts:

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useNavigationStore } from '@/stores/navigation-store'
import { useCreateProjectModal } from './use-create-project-modal'
import type { CreateProjectInput } from '@/lib/validations/project'

export function useCreateProject() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setActiveProject } = useNavigationStore()
  const { close } = useCreateProjectModal()

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw { 
          message: result.error,
          code: result.code,
          status: response.status 
        }
      }

      return result
    },

    onSuccess: (data) => {
      // Invalidate semua query yang terkait
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpi'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-attention'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      
      // Set active project di navigation store
      setActiveProject({
        id: data.project.id,
        name: data.project.name,
        code: data.project.code,
      })
    },

    onError: (error) => {
      // Error ditangani di dalam modal, tidak perlu toast di sini
      console.error('Create project failed:', error)
    },
  })
}
```

---

## CHECKLIST IMPLEMENTASI

Lakukan dalam urutan ini:

- [ ] Step 1: Buat lib/validations/project.ts (Zod schemas)
- [ ] Step 2: Buat POST /api/projects/route.ts
- [ ] Step 3: Buat POST /api/projects/generate-code/route.ts
- [ ] Step 4: Buat components/projects/create-project-modal.tsx
- [ ] Step 5: Setup modal trigger di layout + semua tombol
- [ ] Step 6: Buat hooks/use-create-project.ts (React Query mutation)

Test cases setelah implementasi:
- [ ] Klik "+ Buat Proyek" → modal terbuka ✅
- [ ] Ketik nama proyek → kode auto-generate ✅
- [ ] Validasi step 1 sebelum lanjut ke step 2 ✅
- [ ] Animasi transisi antar step smooth ✅
- [ ] Nilai kontrak format Rupiah dengan benar ✅
- [ ] Tanggal selesai tidak bisa sebelum tanggal mulai ✅
- [ ] Durasi proyek tampil setelah tanggal diisi ✅
- [ ] Submit → loading state → success state → redirect ke WBS ✅
- [ ] Kode duplikat → error 409 → pesan di modal ✅
- [ ] Limit proyek tercapai → error 403 → tombol upgrade ✅
- [ ] Modal tidak bisa ditutup saat loading ✅
- [ ] Setelah redirect, sidebar sudah dalam project mode ✅

---

*Create Project Form Prompt v1.0*
