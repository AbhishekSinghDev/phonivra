import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { TitleBar } from '@/components/title-bar'
import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/hooks/use-theme'
import { useShellStore } from '@/stores/shell-store'
import { notify } from '@/lib/notify'
import { connectStudio } from '@/lib/actions'

const TextToSpeechPage = lazy(() =>
  import('@/features/text-to-speech/page').then((module) => ({ default: module.TextToSpeechPage }))
)
const VoicesModelsPage = lazy(() =>
  import('@/features/voices-models/page').then((module) => ({ default: module.VoicesModelsPage }))
)
const HistoryPage = lazy(() =>
  import('@/features/history/page').then((module) => ({ default: module.HistoryPage }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings/page').then((module) => ({ default: module.SettingsPage }))
)
const BatchPage = lazy(() => import('@/features/batch/page'))
const ModelsPage = lazy(() => import('@/features/models/page'))
const InterfaceReferencePage = import.meta.env.DEV
  ? lazy(() => import('@/features/interface-reference/page'))
  : null
export default function App(): React.JSX.Element {
  const { resolvedTheme } = useTheme()
  const collapsed = useShellStore((state) => state.collapsed)
  const toggleSidebar = useShellStore((state) => state.toggleSidebar)
  useEffect(connectStudio, [])
  return (
    <HashRouter>
      <TooltipProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          <TitleBar />
          <SidebarProvider
            className="min-h-0 flex-1 overflow-hidden"
            open={!collapsed}
            onOpenChange={(open) => {
              if (open === collapsed) {
                notify('Toggle sidebar clicked')
                toggleSidebar()
              }
            }}
          >
            <AppSidebar />
            <main
              id="main-content"
              className="content-area min-w-0 flex-1 overflow-auto p-6 lg:p-8"
              tabIndex={-1}
            >
              <Suspense
                fallback={
                  <div className="flex flex-col gap-4" aria-label="Loading screen">
                    <Skeleton className="h-8 w-60" />
                    <Skeleton className="h-80 w-full" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/narrate" replace />} />
                  <Route path="/narrate" element={<TextToSpeechPage />} />
                  <Route path="/batch" element={<BatchPage />} />
                  <Route path="/voices" element={<VoicesModelsPage />} />
                  <Route path="/models" element={<ModelsPage />} />
                  <Route path="/library" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/history" element={<Navigate to="/library" replace />} />
                  <Route path="/voices-models" element={<Navigate to="/voices" replace />} />
                  {InterfaceReferencePage && (
                    <Route path="/reference" element={<InterfaceReferencePage />} />
                  )}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
          </SidebarProvider>
        </div>
        <Toaster theme={resolvedTheme} position="bottom-right" />
      </TooltipProvider>
    </HashRouter>
  )
}
