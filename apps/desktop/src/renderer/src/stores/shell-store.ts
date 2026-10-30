import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShellStore {
  collapsed: boolean
  toggleSidebar: () => void
}

export const useShellStore = create<ShellStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed }))
    }),
    { name: 'phonivra-shell', partialize: (state) => ({ collapsed: state.collapsed }) }
  )
)
