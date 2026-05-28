# Rebar — Contractor Management SaaS

## Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Akun Neon (PostgreSQL)
- Akun Clerk
- Akun Uploadthing

### Quick Start

1. **Clone & Install**
```bash
cd apps/web
npm install
```

2. **Environment**
File `.env.local` sudah tersedia di `apps/web/`. Isi dengan API keys Anda.

3. **Database Setup**
```bash
# Push schema ke Neon
npx prisma db push

# Generate Prisma client
npx prisma generate
```

4. **Run Dev Server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Structure

```
rebar/
├── apps/
│   └── web/                    → Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/         → Sign-in, Sign-up (Clerk)
│       │   ├── (dashboard)/    → Dashboard layout + pages
│       │   ├── onboarding/     → First-time setup
│       │   └── api/            → API routes
│       ├── components/
│       │   ├── ui/             → Badge, Card, Progress
│       │   └── sections/       → Nav, Dashboard components
│       ├── lib/
│       │   ├── prisma.ts       → Prisma singleton
│       │   ├── auth.ts         → requireAuth, requireOrg
│       │   ├── utils.ts        → cn, formatRupiah, etc.
│       │   └── mock-data.ts    → Mock projects for preview
│       └── types/              → TypeScript interfaces
├── prisma/
│   └── schema.prisma           → Full DB schema
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| UI | Shadcn/ui + Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Auth | Clerk |
| Storage | Uploadthing |

## Features (MVP Phase 1 & 2)

- ✅ Multi-project dashboard dengan KPI bar
- ✅ Project cards (status, progress, deviation, nilai kontrak)
- ✅ Filter by status + sort
- ✅ Loading skeleton
- ✅ Empty state
- ✅ Framer Motion animations
- ✅ Dark mode design
- ✅ Clerk authentication
- ✅ Onboarding flow (buat organisasi)
- ✅ Prisma schema (full database design)
- ✅ API routes dengan tenant isolation
- 🔲 WBS Builder
- 🔲 S-Curve visualization
- 🔲 Budget & cost tracking
- 🔲 PDF reports
