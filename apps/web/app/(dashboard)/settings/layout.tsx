"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, Users, CreditCard } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Organisasi", href: "/settings/organization", icon: Building },
    { name: "Anggota Tim", href: "/settings/team", icon: Users },
    { name: "Tagihan & Paket", href: "/settings/billing", icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pengaturan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola profil perusahaan, anggota tim, dan paket berlangganan.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? "bg-primary text-white font-medium shadow-sm" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
