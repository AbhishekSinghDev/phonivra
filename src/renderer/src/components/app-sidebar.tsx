import {
  AudioLines,
  BookAudio,
  Boxes,
  Cpu,
  Layers3,
  Settings,
  SlidersHorizontal,
  Users
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { useStudioStore } from '@/stores/studio-store'
import { notify } from '@/lib/notify'

const links = [
  { to: '/narrate', title: 'Narrate', icon: AudioLines },
  { to: '/batch', title: 'Batch', icon: Layers3 },
  { to: '/voices', title: 'Voices', icon: Users },
  { to: '/models', title: 'Models', icon: Boxes },
  { to: '/library', title: 'Library', icon: BookAudio },
  { to: '/settings', title: 'Settings', icon: Settings }
]
export function AppSidebar(): React.JSX.Element {
  const { pathname } = useLocation()
  const device = useStudioStore((state) => state.snapshot?.device.label ?? 'Detecting device')
  const phase = useStudioStore((state) => state.snapshot?.job.phase ?? 'idle')
  return (
    <Sidebar collapsible="icon" className="top-12 bottom-0 h-auto" aria-label="App navigation">
      <SidebarHeader>
        <div className="flex h-12 items-center justify-between gap-2 px-2">
          <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
            Workspace
          </span>
          <SidebarTrigger aria-label="Toggle sidebar" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map(({ to, title, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={pathname === to} tooltip={title}>
                    <NavLink to={to} onClick={() => notify(`${title} clicked`)}>
                      <Icon aria-hidden="true" />
                      <span>{title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {import.meta.env.DEV && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Development</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/reference'}
                      tooltip="Interface reference"
                    >
                      <NavLink
                        to="/reference"
                        onClick={() => notify('Interface reference clicked')}
                      >
                        <SlidersHorizontal aria-hidden="true" />
                        <span>Interface reference</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={`${device} · ${phase}`}>
              <NavLink to="/narrate" onClick={() => notify('Job status clicked')}>
                <Cpu aria-hidden="true" />
                <span>
                  {device} · {phase === 'idle' ? 'Ready' : phase}
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="px-2 pb-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Local audio studio
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
