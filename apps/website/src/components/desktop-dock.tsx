import Image from 'next/image'

const dockApps = [
  { name: 'Finder', image: '/images/dock-finder.svg' },
  { name: 'Safari', image: '/images/dock-safari.svg' },
  { name: 'Notes', image: '/images/dock-notes.svg' },
  { name: 'Phonivra', image: '/images/phonivra-dark.png' },
  { name: 'Music', image: '/images/dock-music.svg' },
  { name: 'Settings', image: '/images/dock-settings.svg' },
  { name: 'Trash', image: '/images/dock-trash.svg' }
]

export function DesktopDock(): React.JSX.Element {
  return (
    <div
      data-desktop-dock=""
      aria-hidden="true"
      className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-2xl border border-foreground/20 bg-background/40 backdrop-blur-xl"
    >
      {dockApps.map((app) => (
        <div key={app.name} data-dock-app={app.name} className="relative shrink-0">
          <Image src={app.image} width={64} height={64} alt="" className="size-full" />
          {app.name === 'Phonivra' && (
            <span
              data-dock-active=""
              className="absolute left-1/2 -translate-x-1/2 rounded-full bg-foreground"
            />
          )}
        </div>
      ))}
    </div>
  )
}
