import { HugeiconsIcon } from '@hugeicons/react'
import { ContrastIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { notify } from '@/lib/notify'

export function TitleBar(): React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <header
      className="title-bar flex h-12 shrink-0 items-center border-b border-card-edge bg-transparent px-4"
      data-platform={window.api.platform}
    >
      <SidebarTrigger className="mr-2 md:hidden" aria-label="Open navigation" />
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-xs font-medium text-muted-foreground">Phonivra Studio</span>
      </div>
      <div className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle light and dark theme"
              onClick={() => {
                notify('Theme selection clicked')
                void setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }}
            >
              <HugeiconsIcon icon={ContrastIcon} aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle light and dark theme</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
