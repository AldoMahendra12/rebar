import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/stores/navigation-store";
import { useCreateProjectModal } from "./use-create-project-modal";
import type { CreateProjectInput } from "@/lib/validations/project";

export function useCreateProject() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setActiveProject } = useNavigationStore();
  const { close } = useCreateProjectModal();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          message: result.error,
          code: result.code,
          status: response.status,
        };
      }

      return result;
    },

    onSuccess: (data) => {
      // Invalidate queries terkait
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpi"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-attention"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // Set active project di navigation store
      setActiveProject({
        id: data.project.id,
        name: data.project.name,
        code: data.project.code,
      });
    },

    onError: (error) => {
      console.error("Create project failed:", error);
    },
  });
}
