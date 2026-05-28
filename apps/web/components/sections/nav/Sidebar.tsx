"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useNavigationStore } from "@/stores/navigation-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutGrid,
  FolderKanban,
  ListTree,
  TrendingUp,
  Wallet,
  FileStack,
  FileBarChart,
  Users,
  CreditCard,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCreateProjectModal } from "@/hooks/use-create-project-modal";

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const {
    sidebarMode,
    activeProjectId,
    activeProjectName,
    activeProjectCode,
    clearActiveProject,
  } = useNavigationStore();
  const pathname = usePathname();
  const router = useRouter();

  const isProjectMode = sidebarMode === "project" && !!activeProjectId;

  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col h-screen bg-white border-r border-zinc-200 shrink-0 overflow-hidden z-20"
      >
        {/* ── LOGO SECTION ── */}
        <div className="flex items-center justify-between px-5 h-[72px] shrink-0">
          <div className="flex items-center min-w-0 h-full">
            {/* Logo Mark */}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.div
                  animate={{
                    width: isCollapsed ? 32 : 130,
                  }}
                  className="flex items-center justify-start shrink-0 h-full"
                >
                  <img 
                    src="/logo-hitam.png" 
                    alt="Logo Rebar" 
                    className="w-[130%] max-w-none h-full object-contain object-left scale-[1.25] -ml-6 origin-left" 
                  />
                </motion.div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={12}>
                  <p className="text-xs font-medium">Rebar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {/* Toggle Button */}
          <motion.button
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            onClick={toggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
          >
            <PanelLeftClose size={15} />
          </motion.button>
        </div>

        {/* ── NAV CONTENT ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          <AnimatePresence mode="wait" initial={false}>
            {!isProjectMode ? (
              <motion.div
                key="global"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                <GlobalNav
                  isCollapsed={isCollapsed}
                  pathname={pathname}
                />
              </motion.div>
            ) : (
              <motion.div
                key="project"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <ProjectNav
                  isCollapsed={isCollapsed}
                  pathname={pathname}
                  projectId={activeProjectId!}
                  projectName={activeProjectName!}
                  projectCode={activeProjectCode!}
                  onBack={() => {
                    clearActiveProject();
                    router.push("/projects");
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── COLLAPSED TOGGLE (di bawah) ── */}
        {isCollapsed && (
          <div className="px-3 pb-2 shrink-0">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors mx-auto"
                >
                  <PanelLeftOpen size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                <p className="text-xs font-medium">Buka sidebar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* ── USER SECTION ── */}
        <UserSection isCollapsed={isCollapsed} />
      </motion.aside>
    </TooltipProvider>
  );
}

// ─── Nav Item Component ───────────────────────────────

function NavItem({
  icon: Icon,
  label,
  href,
  isActive,
  isCollapsed,
  onClick,
}: {
  icon: any;
  label: string;
  href?: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) onClick();
    else if (href) router.push(href);
  };

  const content = (
    <motion.div
      onClick={handleClick}
      animate={{
        paddingLeft: isCollapsed ? 0 : 12,
        paddingRight: isCollapsed ? 0 : 12,
        justifyContent: isCollapsed ? "center" : "flex-start",
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center py-2 rounded-lg cursor-pointer mx-2",
        "transition-colors duration-150",
        isActive
          ? "bg-primary/8 text-primary"
          : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
      )}
    >
      <Icon size={isCollapsed ? 18 : 16} className="shrink-0" />

      <motion.span
        animate={{
          opacity: isCollapsed ? 0 : 1,
          marginLeft: isCollapsed ? 0 : 10,
          width: isCollapsed ? 0 : "auto",
        }}
        transition={{ duration: 0.15 }}
        className="overflow-hidden whitespace-nowrap text-sm font-medium"
      >
        {label}
      </motion.span>
    </motion.div>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          <p className="text-xs font-medium">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ─── Nav Group Label ──────────────────────────────────

function NavGroupLabel({
  label,
  isCollapsed,
}: {
  label: string;
  isCollapsed: boolean;
}) {
  return (
    <motion.div
      animate={{
        opacity: isCollapsed ? 0 : 1,
        height: isCollapsed ? 0 : "auto",
        marginTop: isCollapsed ? 0 : 24,
        marginBottom: isCollapsed ? 0 : 4,
      }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden px-5"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
    </motion.div>
  );
}

// ─── Global Nav ───────────────────────────────────────

function GlobalNav({
  isCollapsed,
  pathname,
}: {
  isCollapsed: boolean;
  pathname: string;
}) {
  const { open } = useCreateProjectModal();

  return (
    <div className="space-y-0.5">
      <NavGroupLabel label="Overview" isCollapsed={isCollapsed} />
      <NavItem
        icon={LayoutGrid}
        label="Dashboard"
        href="/dashboard"
        isActive={pathname === "/dashboard"}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={FolderKanban}
        label="Semua Proyek"
        href="/projects"
        isActive={pathname === "/projects"}
        isCollapsed={isCollapsed}
      />

      <NavGroupLabel label="Pengaturan" isCollapsed={isCollapsed} />
      <NavItem
        icon={Users}
        label="Tim"
        href="/settings/team"
        isActive={pathname.includes("/settings/team")}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={CreditCard}
        label="Billing"
        href="/settings/billing"
        isActive={pathname.includes("/settings/billing")}
        isCollapsed={isCollapsed}
      />
      <NavItem
        icon={Settings}
        label="Pengaturan"
        href="/settings/organization"
        isActive={pathname === "/settings/organization"}
        isCollapsed={isCollapsed}
      />

      <motion.div
        animate={{
          opacity: isCollapsed ? 0 : 1,
          height: isCollapsed ? 0 : "auto",
          marginTop: isCollapsed ? 0 : 24,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden px-4"
      >
        <button
          onClick={open}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Buat Proyek
        </button>
      </motion.div>
    </div>
  );
}

// ─── Project Nav ──────────────────────────────────────

function ProjectNav({
  isCollapsed,
  pathname,
  projectId,
  projectName,
  projectCode,
  onBack,
}: {
  isCollapsed: boolean;
  pathname: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  onBack: () => void;
}) {
  const base = `/projects/${projectId}`;

  const navItems = [
    { icon: LayoutDashboard, label: "Ringkasan", href: base },
    { icon: ListTree, label: "Rencana Anggaran Biaya", href: `${base}/wbs` },
    { icon: TrendingUp, label: "Progress & Kurva S", href: `${base}/s-curve` },
    { icon: Wallet, label: "Anggaran & Biaya", href: `${base}/budget` },
    { icon: FileStack, label: "Dokumen", href: `${base}/documents` },
    { icon: FileBarChart, label: "Laporan", href: `${base}/reports` },
  ];

  return (
    <div className="space-y-0.5">
      {/* Back Button */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onBack}
            animate={{
              paddingLeft: isCollapsed ? 0 : 12,
              justifyContent: isCollapsed ? "center" : "flex-start",
            }}
            className="flex items-center gap-1.5 w-[calc(100%-16px)] py-2 mx-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-zinc-50 transition-colors text-sm"
          >
            <ChevronLeft size={14} className="shrink-0" />
            <motion.span
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap text-xs font-medium"
            >
              Semua Proyek
            </motion.span>
          </motion.button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" sideOffset={12}>
            <p className="text-xs font-medium">Semua Proyek</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Project Switcher */}
      <ProjectSwitcher
        projectName={projectName}
        projectCode={projectCode}
        isCollapsed={isCollapsed}
      />

      {/* Divider */}
      <div className="border-t border-zinc-100 my-2 mx-3" />

      {/* Nav Items */}
      {navItems.map((item) => (
        <NavItem
          key={item.href}
          icon={item.icon}
          label={item.label}
          href={item.href}
          isActive={pathname === item.href || (item.label !== "Ringkasan" && pathname.startsWith(item.href))}
          isCollapsed={isCollapsed}
        />
      ))}

      {/* Pengaturan Proyek */}
      <div className="border-t border-zinc-100 my-2 mx-3" />
      <NavItem
        icon={Settings}
        label="Pengaturan Proyek"
        href={`${base}/settings`}
        isActive={pathname === `${base}/settings`}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}

// ─── Project Switcher ─────────────────────────────────

function ProjectSwitcher({
  projectName,
  projectCode,
  isCollapsed,
}: {
  projectName: string;
  projectCode: string;
  isCollapsed: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const content = (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "mx-2 rounded-lg cursor-pointer transition-colors hover:bg-zinc-100",
        isCollapsed
          ? "flex items-center justify-center h-10 w-10 mt-2 mx-auto bg-primary/5 hover:bg-primary/10 text-primary"
          : "px-3 py-2.5 bg-zinc-50 mt-2"
      )}
    >
      {isCollapsed ? (
        <span className="text-xs font-mono font-semibold">
          {projectCode?.split("-")[1] ?? "P"}
        </span>
      ) : (
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted-foreground">
              {projectCode}
            </p>
            <p className="text-sm font-medium text-foreground truncate mt-0.5">
              {projectName}
            </p>
          </div>
          <ChevronDown
            size={14}
            className={cn(
              "text-zinc-400 shrink-0 ml-2 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          <p className="text-xs font-medium">{projectName}</p>
          <p className="text-xs text-zinc-400">{projectCode}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="relative">
      {content}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-2 right-2 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] overflow-hidden z-50"
          >
            <div className="p-1">
              <div className="px-3 py-2 bg-primary/8 rounded-lg flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {projectCode}
                </span>
                <span className="text-xs font-medium text-primary truncate">
                  {projectName}
                </span>
              </div>
            </div>
            {/* Implement project list fetching here in the future if needed */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User Section ─────────────────────────────────────

function UserSection({ isCollapsed }: { isCollapsed: boolean }) {
  const { user } = useUser();

  return (
    <div className="border-t border-zinc-100 p-3 shrink-0">
      <div
        className={cn(
          "flex items-center rounded-lg transition-colors",
          isCollapsed ? "justify-center p-1" : "gap-3 p-2 hover:bg-zinc-50"
        )}
      >
        <div className="shrink-0 flex items-center justify-center">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: { avatarBox: "w-8 h-8" },
            }}
          />
        </div>

        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden min-w-0 flex-1"
        >
          {user ? (
            <>
              <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">
                {user.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize whitespace-nowrap">
                {user.organizationMemberships?.[0]?.role ?? "member"}
              </p>
            </>
          ) : (
            <div className="h-9" />
          )}
        </motion.div>

        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : "auto",
          }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden shrink-0"
        >
          <Link
            href="/settings/organization"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors block"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
