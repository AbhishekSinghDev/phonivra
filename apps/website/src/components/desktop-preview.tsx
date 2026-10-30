import Image from 'next/image'
import { Badge } from '@phonivra/ui/components/badge'
import { DesktopMenuBar } from '@/components/desktop-menu-bar'
import { DesktopWindow } from '@/components/desktop-window'
import { DesktopDock } from '@/components/desktop-dock'

export function DesktopPreview(): React.JSX.Element {
  return (
    <figure className="mt-12 motion-safe:animate-chai-pop sm:mt-16">
      <div
        data-desktop-scene=""
        className="relative isolate overflow-hidden rounded-2xl border border-card-edge"
      >
        <Image
          src="/images/desktop-wallpaper.png"
          fill
          sizes="(max-width: 1152px) 100vw, 1056px"
          alt=""
          loading="eager"
          className="-z-10 object-cover"
        />
        <DesktopMenuBar />
        <DesktopWindow />
        <DesktopDock />
      </div>
      <figcaption className="mt-4 flex flex-col items-start justify-between gap-3 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center">
        <span>
          Your supplied desktop screenshots in a macOS-style mockup. Generation and audio controls
          are simulated in this build.
        </span>
        <Badge variant="outline">Interface preview</Badge>
      </figcaption>
    </figure>
  )
}
