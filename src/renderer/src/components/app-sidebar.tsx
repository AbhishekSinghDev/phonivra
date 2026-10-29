import { HugeiconsIcon } from '@hugeicons/react'
import {
  AudioLinesIcon,
  ArrowUpRightIcon,
  AudioBookIcon,
  BoxesIcon,
  CpuIcon,
  Layers01Icon,
  SettingsIcon,
  UsersIcon
} from '@hugeicons/core-free-icons'
import { NavLink, useLocation } from 'react-router'
import logoDark from '../../../../public/logos/phonivra-dark.png'
import logoLight from '../../../../public/logos/phonivra-light.png'
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
  SidebarTrigger
} from '@/components/ui/sidebar'
import { useStudioStore } from '@/stores/studio-store'
import { notify } from '@/lib/notify'

const navigation = [
  {
    label: 'Workspace',
    links: [
      { to: '/narrate', title: 'Text to speech', icon: AudioLinesIcon },
      { to: '/batch', title: 'Batch studio', icon: Layers01Icon },
      { to: '/library', title: 'Audio library', icon: AudioBookIcon }
    ]
  },
  {
    label: 'Resources',
    links: [
      { to: '/voices', title: 'Voice collection', icon: UsersIcon },
      { to: '/models', title: 'Speech models', icon: BoxesIcon }
    ]
  }
]

export function AppSidebar(): React.JSX.Element {
  const { pathname } = useLocation()
  const device = useStudioStore((state) => state.snapshot?.device.label ?? 'Connecting')
  const phase = useStudioStore((state) => state.snapshot?.job.phase ?? 'idle')
  const outputs = useStudioStore((state) => state.snapshot?.outputs.length ?? 0)

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="studio-sidebar top-12 bottom-0 h-auto border-0"
      aria-label="App navigation"
    >
      <SidebarHeader className="gap-5 px-4 pt-4 pb-6 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pb-4">
        <div className="flex min-h-10 items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <div className="studio-logo relative flex size-8 shrink-0 items-center justify-center">
            <img src={logoLight} alt="" className="size-full dark:hidden" />
            <img src={logoDark} alt="" className="hidden size-full dark:block" />
            <SidebarTrigger
              className="studio-logo-trigger absolute inset-0 hidden size-8 text-foreground group-data-[collapsible=icon]:inline-flex"
              aria-label="Open sidebar"
            />
          </div>
          <span className="min-w-0 flex-1 font-onest text-2xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Phonivra<span className="text-brand">.</span>
          </span>
          <SidebarTrigger
            className="shrink-0 group-data-[collapsible=icon]:hidden"
            aria-label="Toggle sidebar"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-5 overflow-x-hidden px-3 py-1 group-data-[collapsible=icon]:px-2">
        {navigation.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            {group.label !== 'Workspace' && (
              <SidebarGroupLabel className="px-3 text-xs">{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.links.map(({ to, title, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      className="studio-nav h-11 rounded-xl px-3"
                      asChild
                      isActive={pathname === to}
                      tooltip={title}
                    >
                      <NavLink to={to} onClick={() => notify(`${title} clicked`)}>
                        <HugeiconsIcon icon={Icon} aria-hidden="true" />
                        <span>{title}</span>
                        {to === '/library' && outputs > 0 && (
                          <span className="ml-auto text-xs tabular-nums group-data-[collapsible=icon]:hidden">
                            {outputs}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-4 p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="studio-nav h-10 rounded-xl px-3"
              asChild
              isActive={pathname === '/settings'}
              tooltip="Settings"
            >
              <NavLink to="/settings" onClick={() => notify('Settings clicked')}>
                <HugeiconsIcon icon={SettingsIcon} aria-hidden="true" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto rounded-xl border border-card-edge bg-card-fill px-3 py-3 group-data-[collapsible=icon]:p-2"
              asChild
              tooltip={`${device}: ${phase}`}
            >
              <NavLink to="/narrate" onClick={() => notify('Job status clicked')}>
                <HugeiconsIcon icon={CpuIcon} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-medium">On-device studio</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {device} · {phase === 'idle' ? 'Ready' : phase}
                  </span>
                </span>
                <HugeiconsIcon
                  icon={ArrowUpRightIcon}
                  className="size-3 text-muted-foreground group-data-[collapsible=icon]:hidden"
                  aria-hidden="true"
                />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
