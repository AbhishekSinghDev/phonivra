import { AudioLines, Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { notify } from '@/lib/notify'
import type { Theme } from '../../../shared/api'

const modes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
] as const
export function TitleBar(): React.JSX.Element {
  const { theme, setTheme } = useTheme()
  return (
    <header
      className="title-bar flex h-12 shrink-0 items-center border-b border-border bg-background px-4"
      data-platform={window.api.platform}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AudioLines className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>Phonivra</span>
      </div>
      <div className="ml-auto">
        <ToggleGroup
          type="single"
          size="sm"
          value={theme}
          aria-label="Appearance"
          onValueChange={(value) => {
            if (value) {
              notify('Theme selection clicked')
              void setTheme(value as Theme)
            }
          }}
        >
          {modes.map(({ value, label, icon: Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem value={value} aria-label={`${label} theme`}>
                  <Icon aria-hidden="true" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </div>
    </header>
  )
}
