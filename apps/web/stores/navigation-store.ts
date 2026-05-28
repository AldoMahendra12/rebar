import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NavigationState {
  activeProjectId: string | null
  activeProjectName: string | null
  activeProjectCode: string | null
  sidebarMode: 'global' | 'project'
  setActiveProject: (project: { id: string; name: string; code: string } | null) => void
  clearActiveProject: () => void
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      activeProjectName: null,
      activeProjectCode: null,
      sidebarMode: 'global',
      setActiveProject: (project) => set({
        activeProjectId: project?.id ?? null,
        activeProjectName: project?.name ?? null,
        activeProjectCode: project?.code ?? null,
        sidebarMode: project ? 'project' : 'global',
      }),
      clearActiveProject: () => set({
        activeProjectId: null,
        activeProjectName: null,
        activeProjectCode: null,
        sidebarMode: 'global',
      }),
    }),
    {
      name: 'last-active-project',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }),
    }
  )
)
