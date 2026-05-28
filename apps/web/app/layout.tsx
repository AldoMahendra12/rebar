import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rebar — Manajemen Proyek Konstruksi",
  description:
    "Platform SaaS untuk kontraktor konstruksi Indonesia. Kelola proyek, RAB, S-Curve, dan laporan dalam satu platform.",
  keywords: ["konstruksi", "kontraktor", "manajemen proyek", "RAB", "S-Curve"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="id" className={`${inter.variable}`}>
        <body className="bg-background text-foreground antialiased">
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
