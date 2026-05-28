import { z } from "zod";

export const createProjectSchema = z
  .object({
    // Step 1 — Info Dasar
    name: z
      .string()
      .min(3, "Nama proyek minimal 3 karakter")
      .max(100, "Nama proyek maksimal 100 karakter"),

    code: z
      .string()
      .min(2, "Kode proyek minimal 2 karakter")
      .max(20, "Kode proyek maksimal 20 karakter")
      .regex(/^[A-Z0-9\-]+$/, "Kode hanya boleh huruf kapital, angka, dan strip")
      .transform((val) => val.toUpperCase()),

    clientName: z
      .string()
      .min(2, "Nama klien minimal 2 karakter")
      .max(100),

    location: z
      .string()
      .min(3, "Lokasi minimal 3 karakter")
      .max(200),

    description: z.string().max(500).optional(),

    // Step 2 — Kontrak
    contractValue: z.coerce
      .number()
      .positive("Nilai kontrak harus lebih dari 0")
      .min(1000000, "Nilai kontrak minimal Rp 1.000.000"),

    startDate: z
      .string()
      .min(1, "Tanggal mulai harus diisi")
      .refine((val) => !isNaN(Date.parse(val)), "Format tanggal tidak valid"),

    endDate: z
      .string()
      .min(1, "Tanggal selesai harus diisi")
      .refine((val) => !isNaN(Date.parse(val)), "Format tanggal tidak valid"),

    periodType: z.enum(["weekly", "monthly"], {
      required_error: "Pilih tipe periode",
    }),

    // Step 3 — Tim (opsional saat create)
    memberIds: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: "Tanggal selesai harus setelah tanggal mulai",
      path: ["endDate"],
    }
  );

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Per-step schemas
export const step1Schema = createProjectSchema.innerType().pick({
  name: true,
  code: true,
  clientName: true,
  location: true,
  description: true,
});

export const step2Schema = createProjectSchema.innerType().pick({
  contractValue: true,
  startDate: true,
  endDate: true,
  periodType: true,
});

export const step3Schema = createProjectSchema.innerType().pick({
  memberIds: true,
});
