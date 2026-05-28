# Product Requirements Document (PRD)
# Contractor Management SaaS Platform
**Version:** 2.0  
**Last Updated:** 2025  
**Status:** Ready for Development  

---

## 1. Product Overview

### 1.1 Product Vision
A web and mobile SaaS platform that enables construction contractors (small, medium, and large scale) to manage multiple projects in one place — from planning, WBS setup, RAB, progress tracking with detailed S-Curve visualization, cost control, to professional PDF reporting for clients.

### 1.2 Problem Statement
Indonesian construction contractors, especially small-to-medium scale, rely on Excel or manual processes to track project progress. This causes:
- No real-time visibility into project health across multiple projects
- S-Curve and progress reports done manually and inconsistently
- Cost overruns go undetected until too late
- No professional reporting tool for client-facing communication
- Field teams (mandor, supervisor) disconnected from office/PM visibility
- RAB tracking not linked to actual field progress

### 1.3 Target Users

| Persona | Role | Primary Device | Key Pain Point |
|---|---|---|---|
| **Contractor Owner** | Business owner, oversees all projects | Web (desktop) | No multi-project portfolio dashboard |
| **Project Manager (PM)** | Manages day-to-day project execution | Web + Mobile | Manual S-Curve, slow reporting |
| **Site Supervisor / Mandor** | Field execution, daily progress input | Mobile | No easy way to input progress from site |
| **Client / Owner (Viewer)** | Receives project updates | Web | Doesn't get timely, professional reports |

### 1.4 Business Model
SaaS — monthly/annual subscription per organization (contractor company).

---

## 2. SaaS & Multi-Tenancy Architecture

### 2.1 Multi-Tenant Model
- **Shared database** with `organizationId` on every table
- Tenant isolation enforced at **application layer** via `requireOrg()` helper (not RLS, since we use Neon + Prisma)
- Every API route **must** call `requireOrg()` before any database query
- Each contractor company = 1 Organization
- Users belong to an Organization with a specific Role

### 2.2 Subscription Tiers

| Tier | Active Projects | Users | Price/month |
|---|---|---|---|
| **Starter** | Up to 3 | Up to 5 | Rp 299,000 |
| **Pro** | Up to 15 | Up to 20 | Rp 799,000 |
| **Business** | Unlimited | Up to 50 | Rp 1,999,000 |
| **Enterprise** | Unlimited | Unlimited | Custom |

### 2.3 Trial & Subscription
- 14-day free trial, no credit card required
- Graceful degradation when subscription expires: read-only mode (no data loss)
- Feature gates checked via middleware on every request

---

## 3. Tech Stack

### 3.1 Frontend — Web
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI Components:** Shadcn/ui
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Charts / S-Curve:** Recharts
- **State / Data Fetching:** React Query (TanStack Query) + Zustand

### 3.2 Frontend — Mobile
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind for React Native)
- **Charts:** Victory Native
- **State:** React Query + Zustand
- **Offline:** Local state with sync on reconnect
- **Camera / Upload:** Expo Camera + Expo Image Picker

### 3.3 Backend & Infrastructure

| Service | Provider | Purpose |
|---|---|---|
| **Database** | Neon (PostgreSQL) | Primary data store |
| **ORM** | Prisma | Schema management + queries |
| **Auth** | Clerk | Authentication + multi-tenant org management |
| **Storage** | Uploadthing | File & photo uploads (documents, field photos) |
| **Realtime** | — (skip MVP, add Pusher in Phase 2) | Live sync |
| **PDF Generation** | Vercel Edge Function / API Route | Report generation server-side |
| **Deployment Web** | Vercel | Hosting + Edge Functions |
| **Deployment Mobile** | Expo EAS | App Store + Google Play |

### 3.4 Monorepo Structure
```
/apps
  /web              → Next.js 14 App Router
  /mobile           → Expo React Native
/packages
  /shared           → TypeScript types, S-Curve engine, utils
/prisma             → schema.prisma + migrations
/supabase           → (removed — replaced by Neon + Clerk + Uploadthing)
```
**Monorepo tool:** Turborepo

### 3.5 Key Configuration Files

```
lib/prisma.ts       → Prisma singleton client (with Neon serverless pooling)
lib/auth.ts         → requireAuth() + requireOrg() helpers (Clerk)
middleware.ts       → Clerk route protection
```

### 3.6 Environment Variables

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Storage (Uploadthing)
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx

# Mobile (Expo)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────
// ORGANIZATIONS & USERS
// ─────────────────────────────────────

model Organization {
  id                  String    @id @default(cuid())
  name                String
  slug                String    @unique
  size                String    // '<10' | '10-50' | '50-200' | '200+'
  subscriptionTier    String    @default("trial") // 'trial'|'starter'|'pro'|'business'|'enterprise'
  subscriptionStatus  String    @default("trial") // 'trial'|'active'|'expired'
  trialEndsAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  users               User[]
  projects            Project[]
}

model User {
  id              String       @id // Clerk userId
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  fullName        String
  email           String
  role            String       // 'owner'|'admin'|'pm'|'supervisor'|'viewer'
  avatarUrl       String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  progressActuals ProgressActual[]
  costActuals     CostActual[]
  documents       Document[]

  @@index([organizationId])
}

// ─────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────

model Project {
  id              String       @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  name            String
  code            String       // e.g. "PRJ-001"
  clientName      String
  location        String
  contractValue   Decimal
  startDate       DateTime
  endDate         DateTime
  status          String       @default("planning") // 'planning'|'active'|'on_hold'|'completed'
  periodType      String       @default("weekly")   // 'weekly'|'monthly'
  description     String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  wbsItems        WbsItem[]
  budgetItems     BudgetItem[]
  documents       Document[]

  @@index([organizationId])
  @@index([organizationId, status])
}

// ─────────────────────────────────────
// WBS (WORK BREAKDOWN STRUCTURE) = RAB
// ─────────────────────────────────────

model WbsItem {
  id              String    @id @default(cuid())
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organizationId  String
  parentId        String?
  parent          WbsItem?  @relation("WbsChildren", fields: [parentId], references: [id])
  children        WbsItem[] @relation("WbsChildren")
  code            String    // "1", "1.1", "1.1.1"
  name            String
  level           Int       // 1 | 2 | 3
  unit            String?   // m³, m², unit, ls, etc.
  volume          Decimal?
  unitPrice       Decimal?
  totalPrice      Decimal?  // computed: volume * unitPrice
  weight          Decimal?  // % weight of total project (leaf nodes only)
  sortOrder       Int       @default(0)
  isLeaf          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  progressPlans   ProgressPlan[]
  progressActuals ProgressActual[]

  @@index([projectId])
  @@index([organizationId])
  @@index([projectId, parentId])
}

// ─────────────────────────────────────
// PROGRESS PLANNING (S-CURVE RENCANA)
// ─────────────────────────────────────

model ProgressPlan {
  id                  String   @id @default(cuid())
  wbsItemId           String
  wbsItem             WbsItem  @relation(fields: [wbsItemId], references: [id], onDelete: Cascade)
  organizationId      String
  periodDate          DateTime // start of week or month
  periodType          String   // 'weekly' | 'monthly'
  plannedPercentage   Decimal  // % of this item's total volume for this period
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([wbsItemId, periodDate, periodType])
  @@index([wbsItemId])
  @@index([organizationId])
}

// ─────────────────────────────────────
// PROGRESS ACTUALS (INPUT LAPANGAN)
// ─────────────────────────────────────

model ProgressActual {
  id                  String   @id @default(cuid())
  wbsItemId           String
  wbsItem             WbsItem  @relation(fields: [wbsItemId], references: [id], onDelete: Cascade)
  organizationId      String
  periodDate          DateTime
  periodType          String   // 'weekly' | 'monthly'
  actualPercentage    Decimal
  notes               String?
  isLocked            Boolean  @default(false)
  reportedById        String
  reportedBy          User     @relation(fields: [reportedById], references: [id])
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  photos              ProgressPhoto[]

  @@unique([wbsItemId, periodDate, periodType])
  @@index([wbsItemId])
  @@index([organizationId])
}

model ProgressPhoto {
  id                String         @id @default(cuid())
  progressActualId  String
  progressActual    ProgressActual @relation(fields: [progressActualId], references: [id], onDelete: Cascade)
  fileUrl           String         // Uploadthing URL
  fileName          String
  gpsLat            Decimal?       // GPS latitude (mobile)
  gpsLng            Decimal?       // GPS longitude (mobile)
  createdAt         DateTime       @default(now())

  @@index([progressActualId])
}

// ─────────────────────────────────────
// BUDGET & COST (RAB KATEGORI)
// ─────────────────────────────────────

model BudgetItem {
  id              String       @id @default(cuid())
  projectId       String
  project         Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organizationId  String
  category        String       // 'material'|'labor'|'equipment'|'subcon'|'overhead'
  description     String
  budgetedAmount  Decimal
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  costActuals     CostActual[]

  @@index([projectId])
  @@index([organizationId])
}

model CostActual {
  id              String     @id @default(cuid())
  budgetItemId    String
  budgetItem      BudgetItem @relation(fields: [budgetItemId], references: [id], onDelete: Cascade)
  organizationId  String
  amount          Decimal
  description     String
  transactionDate DateTime
  receiptUrl      String?    // Uploadthing URL
  createdById     String
  createdBy       User       @relation(fields: [createdById], references: [id])
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([budgetItemId])
  @@index([organizationId])
}

// ─────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────

model Document {
  id              String   @id @default(cuid())
  projectId       String
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organizationId  String
  name            String
  fileUrl         String   // Uploadthing URL
  fileType        String   // 'drawing'|'contract'|'report'|'photo'|'other'
  uploadedById    String
  uploadedBy      User     @relation(fields: [uploadedById], references: [id])
  createdAt       DateTime @default(now())

  @@index([projectId])
  @@index([organizationId])
}
```

---

## 5. Auth & Tenant Isolation Pattern

### 5.1 Helper Functions (lib/auth.ts)
```typescript
import { auth } from '@clerk/nextjs'
import { prisma } from './prisma'

export async function requireAuth() {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}

export async function requireOrg() {
  const userId = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true }
  })
  if (!user) throw new Error('User not found')
  return { userId, organizationId: user.organizationId, role: user.role }
}
```

### 5.2 Every API Route Pattern
```typescript
// WAJIB pattern ini di setiap API route
export async function GET(req: Request) {
  const { organizationId } = await requireOrg()
  
  const data = await prisma.project.findMany({
    where: { organizationId } // SELALU filter by organizationId
  })
  
  return Response.json(data)
}
```

### 5.3 User Roles & Permissions

| Feature | Owner | Admin | PM | Supervisor | Viewer |
|---|---|---|---|---|---|
| Create / delete project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit WBS / RAB | ✅ | ✅ | ✅ | ❌ | ❌ |
| Input progress | ✅ | ✅ | ✅ | ✅ | ❌ |
| Unlock locked progress | ✅ | ✅ | ✅ | ❌ | ❌ |
| View S-Curve | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage budget | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invite users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Feature Specifications — MVP

### 6.1 Authentication & Onboarding

**Flow:**
1. Register via Clerk (`/sign-up`) → email/password atau Google OAuth
2. Setelah register pertama kali → redirect ke `/onboarding`
3. Onboarding form: nama perusahaan, ukuran perusahaan
4. Submit → INSERT organizations + users di Neon via Prisma
5. Redirect ke `/dashboard`
6. Login berikutnya → skip onboarding, langsung `/dashboard`

**Invite Team:**
- Admin/Owner invite via email
- Invite link berisi token → user register → auto-join organization
- Role di-assign saat invite

---

### 6.2 Multi-Project Dashboard

**Web:**
- KPI bar: total proyek aktif, total nilai kontrak (format Rupiah), proyek behind schedule, portfolio progress %
- Grid cards per proyek: nama, kode, klien, lokasi, status badge, progress bar (planned vs actual), deviation badge, contract value, days remaining
- Deviation badge: `On Track` (hijau) / `Behind` (merah) / `Ahead` (biru)
- Filter by status, sort by deadline / deviation / contract value
- Empty state dengan CTA "Buat Proyek Pertama"
- Loading skeleton saat fetch
- Framer Motion: staggered card animation saat load

**Mobile:**
- Project list dengan status badge
- Summary KPI di atas
- Tap → masuk single project view

---

### 6.3 Project Setup (Wizard)

Step 1: Info Dasar — nama, kode, klien, lokasi, deskripsi
Step 2: Kontrak — nilai kontrak, tanggal mulai, tanggal selesai, period type (weekly/monthly)
Step 3: Tim — invite/assign user dengan role
Step 4: Redirect ke WBS Builder

---

### 6.4 WBS Builder (= RAB)

WBS berfungsi ganda sebagai **RAB (Rencana Anggaran Biaya).**

**Web:**

**Struktur Hierarki:**
```
Level 1: Pekerjaan Utama      (e.g. "1. Pekerjaan Struktur")
Level 2: Sub Pekerjaan        (e.g. "1.1 Pondasi")
Level 3: Item / Leaf Node     (e.g. "1.1.1 Galian Tanah")
```
Maksimal 3 level. Progress hanya diinput di level 3 (leaf nodes).

**Kolom Tabel:**
Code | Nama Pekerjaan | Satuan | Volume | Harga Satuan | Total Harga | Bobot %

**Fitur:**
- Inline editing semua cell (klik langsung edit)
- Tab untuk pindah cell, Enter konfirmasi, Escape cancel
- Add row, delete row (dengan konfirmasi kalau punya children)
- Indent (jadikan child) / Outdent (naik level)
- Drag & drop reorder dalam level yang sama (dnd-kit)
- Auto-generate code berdasarkan posisi hierarki
- Total Harga = Volume × Harga Satuan (auto)
- Bobot % = (totalPrice item / sum semua leaf totalPrice) × 100
- Parent menampilkan sum bobot children
- Validasi: total bobot harus = 100%, warning kalau tidak
- Auto-save debounce 2 detik
- Import Excel (UI placeholder, fungsional di Fase 2)

**RAB Export:**
- Tombol "Export RAB" → generate PDF format RAB standar
- Format: tabel dengan subtotal per level 1, PPN 11%, Grand Total
- Generate via Vercel API Route (server-side)

**Framer Motion:**
- Row baru: height 0 → full + opacity 0 → 1
- Row hapus: height → 0 + opacity → 0
- Indent/outdent: animate horizontal padding
- Drag: shadow + scale
- Save success: checkmark badge fade
- Warning shake animation

**Mobile:** Read-only view dengan tree structure

---

### 6.5 Progress Planning (Rencana S-Curve)

**Web — Layout 2 Bagian:**

**Bagian Atas: Tabel Input**
- Baris = WBS leaf nodes (dengan indent code)
- Kolom = tiap periode (W1, W2... atau Jan, Feb...)
- Toggle Weekly / Monthly
- Input % rencana per cell (0-100)
- Validasi: sum per baris harus = 100%
- Highlight merah kalau < 100%, hijau kalau = 100%
- Footer "Bobot Tertimbang": `Σ [weight(i) × planned%(i,T)]` per periode
- Footer "Kumulatif": running sum bobot tertimbang → ini titik S-Curve
- Kolom freeze: nama item tetap saat scroll horizontal
- Horizontal scrollable

**Bagian Bawah: Preview S-Curve Rencana**
- Recharts line chart, update realtime (debounce 500ms)
- Satu garis: Planned (dashed, biru)
- Titik dari baris Kumulatif
- Label: "Preview Rencana S-Curve"

**Framer Motion:**
- Staggered row animation
- Cell edit: subtle pulse highlight
- S-Curve path drawing animation saat data berubah
- Toast notification saat save

---

### 6.6 Progress Input Aktual (Lapangan)

**Web & Mobile**

- Pilih periode yang ingin diisi
- List semua WBS leaf items dengan:
  - Nama item + kode
  - Rencana periode ini %
  - Rencana kumulatif % (to date)
  - Input: aktual % periode ini
  - Running kumulatif aktual
- Batch save semua item sekaligus
- Setelah submit: **locked** (tidak bisa edit kecuali PM/Admin unlock)
- Upload foto per item (opsional)

**Mobile Extra:**
- UI simpel: list item + input angka
- Kamera untuk foto lapangan
- GPS auto-tag pada foto
- Offline: simpan local, sync saat online
- Tombol Save & Submit

**Progress Locking:**
- Supervisor submit → status: locked
- PM/Admin bisa unlock satu periode untuk edit
- Audit trail: siapa yang submit, kapan

---

### 6.7 S-Curve Engine & Visualization

**Ini fitur inti — harus paling akurat.**

#### Kalkulasi Engine (packages/shared/scurve.ts)

```typescript
// Untuk setiap periode T:
plannedCumulative(T) = Σ [weight(i) × cumulativePlanned%(i, T)]
actualCumulative(T)  = Σ [weight(i) × cumulativeActual%(i, T)]
deviation(T)         = actualCumulative(T) - plannedCumulative(T)

// Estimated completion date
// Linear projection dari tren aktual terakhir
```

#### View Levels (4 Level):
1. **Project Level** — keseluruhan proyek
2. **WBS Level 1** — per pekerjaan utama
3. **WBS Level 2** — per sub-pekerjaan
4. **Item Level** — per leaf node

#### Chart Layout (Web):

**Upper Chart — S-Curve:**
- X-axis: periode (week/month labels)
- Y-axis: 0% – 100% kumulatif
- Line 1: Planned (dashed, biru)
- Line 2: Actual (solid, hijau kalau on track / merah kalau behind)
- Vertical line: "Today" marker
- Recharts LineChart + ReferenceLine

**Lower Chart — Deviasi Per Periode:**
- Bar chart: planned % vs actual % per periode (non-kumulatif)
- Warna bar: hijau (actual ≥ planned) / merah (actual < planned)

**Summary Metrics Panel:**
- Planned % to date
- Actual % to date
- Deviasi % (+ ahead / - behind)
- Estimated completion date
- Status: On Track / Behind / Ahead

**Interactive Features (Web):**
- Hover tooltip dengan nilai eksak
- Toggle planned/actual on/off
- Switch level (Project → Level 1 → Level 2 → Item)
- Switch Weekly / Monthly view
- Zoom time axis
- Export S-Curve sebagai PNG

**Mobile:**
- View-only
- Project level + WBS Level 1
- Summary metrics
- Victory Native chart

---

### 6.8 Budget & Cost Control

**Web:**

**Setup:**
- Input budget per kategori: Material, Tenaga Kerja, Alat, Subkontraktor, Overhead
- Budget linked ke project

**Input Aktual:**
- Pilih budget item
- Input: jumlah, tanggal, deskripsi, foto nota/kwitansi (Uploadthing)

**Dashboard per Proyek:**
- Bar chart: Budget vs Actual per kategori
- Total budget utilization %
- Remaining budget
- Burn rate per periode
- Alert: kuning >70%, merah >90% budget terpakai

---

### 6.9 RAB Export

Generate PDF format RAB standar dari data WBS:

```
No | Uraian Pekerjaan     | Sat | Vol  | Harga Sat | Jumlah
───────────────────────────────────────────────────────────
1.  Pekerjaan Tanah
1.1 Galian Tanah          m³   500    85,000      42,500,000
1.2 Urugan Kembali        m³   200    45,000       9,000,000
    Subtotal Pek. Tanah                            51,500,000
...
    TOTAL                                         XXX,XXX,XXX
    PPN 11%                                        XX,XXX,XXX
    GRAND TOTAL                                   XXX,XXX,XXX
```

Generated via Vercel API Route (server-side PDF generation).

---

### 6.10 Reports & Documents

**PDF Reports (Web):**

Auto-generated PDF includes:
- Project summary (nama, klien, progress %, status, deviation)
- S-Curve chart (planned vs actual)
- WBS progress table (semua item dengan planned vs actual %)
- Budget summary table
- Period-by-period progress table
- Foto dokumentasi lapangan (5 terbaru)

Report types:
- **Laporan Mingguan**
- **Laporan Bulanan**
- **Executive Summary** (1 halaman, untuk klien)

**Document Management:**
- Upload per proyek: gambar kerja, kontrak, BAP, foto, lainnya
- List dengan download link
- Stored di Uploadthing: `orgId/projectId/category/filename`

---

### 6.11 Notifications & Alerts

- Deviasi proyek > threshold (default 5%) → in-app + email
- Budget utilization > 80% → in-app + email
- Progress input belum disubmit saat periode berjalan → reminder
- User diinvite / bergabung → notifikasi
- Subscription akan expired (7 hari, 3 hari, 1 hari) → email

---

## 7. Page & Screen Map

### Web Pages

```
/ (landing page + pricing)
/sign-in
/sign-up
/onboarding                         → Buat organisasi (first-time)
/dashboard                          → Multi-project overview
/projects/new                       → Create project wizard
/projects/[id]                      → Project overview
/projects/[id]/wbs                  → WBS Builder + RAB
/projects/[id]/planning             → Progress planning (S-Curve rencana)
/projects/[id]/progress             → Progress input aktual
/projects/[id]/s-curve              → S-Curve visualization (4 levels)
/projects/[id]/budget               → Budget & cost control
/projects/[id]/rab                  → Export RAB PDF
/projects/[id]/documents            → Document management
/projects/[id]/reports              → Generate & download reports
/settings/organization              → Org profile
/settings/team                      → User management + invite
/settings/billing                   → Subscription & payment
```

### Mobile Screens

```
(Auth)            → Login / Register (Clerk)
(Home)            → Project list + KPI summary
(Project)         → Project summary + mini S-Curve
(Progress)        → Period progress input form
(S-Curve)         → View S-Curve (project + level 1)
(Documents)       → View docs, upload foto lapangan
(Notifications)   → Alert list
(Profile)         → User settings
```

---

## 8. S-Curve User Flow (End-to-End)

```
1. Owner/PM setup proyek → isi info + kontrak
2. PM buat WBS → input semua item pekerjaan, harga → bobot % terbentuk
3. PM buat rencana → input % per periode per item → S-Curve rencana terbentuk
4. [Setiap minggu/bulan] Supervisor input progress aktual di mobile lapangan
5. Data sync ke web → S-Curve aktual update otomatis
6. PM lihat S-Curve → cek deviasi per level
7. Kalau behind → drill down ke WBS item yang bermasalah
8. Generate laporan → export PDF → kirim ke klien
```

---

## 9. Development Phases

### Phase 1 — Foundation (Week 1–3)
- [ ] Monorepo setup: Turborepo + Next.js + Expo
- [ ] Neon database setup + Prisma schema migration
- [ ] Clerk auth: login, register, middleware
- [ ] Onboarding flow: buat organisasi
- [ ] lib/auth.ts: requireAuth() + requireOrg()
- [ ] User roles system

### Phase 2 — Core Project Features (Week 4–7)
- [ ] Multi-project dashboard (web) + Framer Motion
- [ ] Project creation wizard
- [ ] WBS Builder dengan semua fitur + inline edit + DnD
- [ ] Progress planning spreadsheet + preview S-Curve
- [ ] Progress actual input (web + mobile)
- [ ] Progress locking mechanism

### Phase 3 — S-Curve & Analytics (Week 8–10)
- [ ] S-Curve calculation engine (packages/shared)
- [ ] S-Curve visualization — 4 levels (web, Recharts)
- [ ] S-Curve mobile view (Victory Native)
- [ ] Deviation alerts + notifications

### Phase 4 — Budget, RAB & Reports (Week 11–13)
- [ ] Budget & cost tracking
- [ ] RAB PDF export dari WBS data
- [ ] PDF laporan proyek (Vercel API Route)
- [ ] Document upload & management (Uploadthing)

### Phase 5 — SaaS & Polish (Week 14–16)
- [ ] Subscription tier gating
- [ ] Billing integration (Stripe / Midtrans)
- [ ] Landing page + pricing page
- [ ] Mobile offline mode + GPS photo tagging
- [ ] Performance optimization
- [ ] Production deployment: Vercel + Expo EAS

---

## 10. AI Agent Context Prompt

Paste ini di awal setiap sesi baru dengan AI agent:

```
Kamu adalah senior fullstack engineer yang membantu saya build 
contractor management SaaS untuk kontraktor konstruksi Indonesia.

Tech stack:
- Next.js 14 App Router + TypeScript
- Expo React Native + TypeScript
- Database: Neon PostgreSQL
- ORM: Prisma
- Auth: Clerk (dengan Organizations untuk multi-tenant)
- Storage: Uploadthing
- UI: Shadcn/ui + Tailwind + Framer Motion
- Charts: Recharts (web) + Victory Native (mobile)
- Data fetching: React Query (TanStack Query)
- Monorepo: Turborepo

Aturan wajib:
1. Setiap API route HARUS panggil requireOrg() dari lib/auth.ts
2. Setiap Prisma query HARUS include where: { organizationId }
3. Gunakan Framer Motion untuk semua animasi UI
4. Gunakan React Query untuk semua data fetching (bukan useEffect manual)
5. TypeScript strict — tidak boleh ada 'any'
```

---

## 11. Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Database | Neon PostgreSQL | Supabase free tier penuh; Neon generous free tier + serverless |
| Auth | Clerk | Built-in org management, Next.js + Expo SDK, mudah setup |
| Tenant isolation | organizationId filter + requireOrg() | Lebih straightforward dari RLS, AI agent lebih mudah generate |
| ORM | Prisma | Type-safe, AI agent familiar, schema as code |
| Storage | Uploadthing | Paling mudah diintegrasikan dengan Next.js |
| Realtime | Skip MVP | Tidak critical, tambah Pusher di Fase 2 |
| S-Curve input | Leaf WBS nodes only | Mencegah double-counting, data model lebih bersih |
| Progress locking | Lock setelah submit | Data integrity + audit trail |
| Mobile scope | Field input + view analytics | Sesuai workflow lapangan, hindari feature bloat |
| PDF generation | Vercel API Route | Server-side, consistent rendering |
| Animation | Framer Motion | Performant, well-documented, AI agent familiar |
| RAB | WBS = RAB (Opsi A) | Data sudah ada, tambah export PDF format standar |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **WBS** | Work Breakdown Structure — hierarki semua item pekerjaan proyek |
| **RAB** | Rencana Anggaran Biaya — daftar rincian biaya proyek (= WBS dengan harga) |
| **S-Curve** | Kurva kumulatif progress (% vs waktu): planned vs actual |
| **Bobot (Weight)** | % kontribusi WBS item terhadap total nilai proyek |
| **Leaf Node** | WBS item di level terbawah tanpa children — tempat input progress |
| **Period** | Satuan waktu tracking: mingguan atau bulanan |
| **Deviasi** | Actual % minus planned % pada suatu titik waktu |
| **Organization** | Satu perusahaan kontraktor dalam sistem SaaS |
| **Tenant** | Sama dengan Organization — satu customer terisolasi |
| **requireOrg()** | Helper function wajib di setiap API route untuk tenant isolation |

---

*End of PRD v2.0*
