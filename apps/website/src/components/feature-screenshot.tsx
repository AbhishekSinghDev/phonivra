import Image from 'next/image'

export function FeatureScreenshot({ area }: { area: 'narration' | 'voices' }): React.JSX.Element {
  const detail = area === 'narration' ? 'Script editor' : 'Voice settings'
  return (
    <figure
      data-feature-visual=""
      className="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-xl bg-muted p-5 sm:p-8"
    >
      <div
        data-feature-crop={area}
        className="relative shrink-0 overflow-hidden rounded-xl border border-card-edge"
      >
        <Image
          src="/images/studio-dark.png"
          width={1920}
          height={1080}
          unoptimized
          alt={`${detail} detail from the supplied Phonivra screenshot, in dark mode.`}
          className="hidden dark:block"
        />
        <Image
          src="/images/studio-light.png"
          width={1920}
          height={1080}
          unoptimized
          alt={`${detail} detail from the supplied Phonivra screenshot, in light mode.`}
          className="dark:hidden"
        />
      </div>
    </figure>
  )
}
