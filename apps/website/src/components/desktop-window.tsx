import Image from 'next/image'

export function DesktopWindow(): React.JSX.Element {
  return (
    <div
      data-desktop-window=""
      className="overflow-hidden rounded-xl border border-foreground/15 bg-background shadow-2xl shadow-window-shadow"
    >
      <div
        data-desktop-titlebar=""
        aria-hidden="true"
        className="relative flex items-center justify-center border-b border-card-edge bg-muted/40"
      >
        <div data-desktop-traffic="" className="absolute flex items-center">
          <span className="rounded-full bg-window-close" />
          <span className="rounded-full bg-window-minimize" />
          <span className="rounded-full bg-window-maximize" />
        </div>
        <span className="font-medium text-muted-foreground">Phonivra Studio</span>
      </div>
      <div className="overflow-hidden">
        <Image
          src="/images/studio-dark.png"
          width={1920}
          height={1080}
          unoptimized
          alt="Phonivra narration workspace in dark mode, with the script editor, voice settings and audio library preview."
          loading="eager"
          data-studio-capture=""
          className="hidden h-auto w-full dark:block"
        />
        <Image
          src="/images/studio-light.png"
          width={1920}
          height={1080}
          unoptimized
          alt="Phonivra narration workspace in light mode, with the script editor, voice settings and audio library preview."
          loading="eager"
          data-studio-capture=""
          className="h-auto w-full dark:hidden"
        />
      </div>
    </div>
  )
}
