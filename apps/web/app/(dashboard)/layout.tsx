"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { Sidebar } from "@/components/sections/nav/Sidebar";
import { Topbar } from "@/components/sections/nav/Topbar";
import { useNavigationStore } from "@/stores/navigation-store";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { useCreateProjectModal } from "@/hooks/use-create-project-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const { setActiveProject, clearActiveProject, activeProjectId } =
    useNavigationStore();
  const { isOpen, close } = useCreateProjectModal();

  useEffect(() => {
    const projectId = params?.id as string | undefined;

    if (projectId) {
      if (projectId !== activeProjectId) {
        // User navigated directly to a project URL — sync sidebar
        fetch(`/api/projects/${projectId}/basic-info`)
          .then((res) => res.json())
          .then((project) => {
            if (project?.id) setActiveProject(project);
          })
          .catch(() => {});
      }
    } else if (!pathname.includes("/projects/")) {
      // User navigated away from project area — reset sidebar to global
      clearActiveProject();
    }
  }, [pathname, params?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Adaptive Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <CreateProjectModal
        open={isOpen}
        onClose={close}
      />
    </div>
  );
}
