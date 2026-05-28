"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = "Dashboard" }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      {/* Left: Title */}
      <div>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Right: Search + Actions + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
            searchFocused
              ? "border-primary bg-secondary w-56"
              : "border-border bg-secondary/50 w-40"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Cari proyek..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </header>
  );
}
