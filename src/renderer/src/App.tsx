import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import background from '@/assets/background.svg'
import { Backdrop } from '@/components/backdrop'
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

export default function App(): React.JSX.Element {
  const { resolvedTheme } = useTheme()
  const collapsed = useShellStore((state) => state.collapsed)
  const toggleSidebar = useShellStore((state) => state.toggleSidebar)
  useEffect(connectStudio, [])
  return (
    <HashRouter>
      <TooltipProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
          <SidebarProvider
            className="studio-shell min-h-0 flex-1 flex-col overflow-hidden"
            open={!collapsed}
            onOpenChange={(open) => {
              if (open === collapsed) {
                notify('Toggle sidebar clicked')
                toggleSidebar()
              }
            }}
          >
            <TitleBar />
            <div className="flex min-h-0 flex-1">
              <AppSidebar />
              <div className="relative isolate min-w-0 flex-1 overflow-hidden border-l border-card-edge bg-background">
                <div
                  className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                  aria-hidden="true"
                >
                  <Backdrop src={background} />
                </div>
                <main
                  id="main-content"
                  className="content-area h-full overflow-auto p-6 sm:p-12"
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
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </div>
        <Toaster theme={resolvedTheme} position="top-center" offset={64} closeButton />
      </TooltipProvider>
    </HashRouter>
  )
}
