import Link from 'next/link'
import Image from 'next/image'
import { siteLinks } from '@/components/site-links'
import { Button } from '@phonivra/ui/components/button'

const foundations = [
  {
    name: 'Chatterbox and IndicF5',
    role: 'The voice engine',
    description: 'Chatterbox and AI4Bharat IndicF5 generate speech on your computer.'
  },
  {
    name: 'Hugging Face',
    role: 'The model source',
    description:
      'The app downloads speech models from Hugging Face and keeps a local copy for offline use.'
  },
  {
    name: 'FFmpeg',
    role: 'The audio toolkit',
    description: 'FFmpeg records microphone audio and converts files to your chosen export format.'
  }
] as const

export function IntegrationsSection(): React.JSX.Element {
  return (
    <section
      id="foundations"
      aria-labelledby="foundations-title"
      className="mx-auto max-w-6xl px-6 py-16 sm:px-12 sm:py-24"
    >
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <h2
          id="foundations-title"
          className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl"
        >
          What <span className="highlight">powers Phonivra</span>
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Phonivra was inspired by{' '}
          <Link href={siteLinks.chatterbox} className="underline underline-offset-4">
            Chatterbox by Resemble AI
          </Link>
          . Thanks to the contributors who shared the code and models that made the studio possible.
        </p>
      </header>

      <div className="mt-10 flex flex-col items-center sm:mt-12" aria-hidden="true">
        <Image
          src="/images/phonivra-dark.png"
          width={72}
          height={72}
          alt=""
          className="hidden size-18 rounded-xl dark:block"
        />
        <Image
          src="/images/phonivra-light.png"
          width={72}
          height={72}
          alt=""
          className="size-18 rounded-xl dark:hidden"
        />
        <svg
          viewBox="0 0 900 96"
          preserveAspectRatio="none"
          fill="none"
          stroke="currentColor"
          className="mt-4 hidden h-24 w-full text-card-edge sm:block"
        >
          <path d="M450 0v26m0 0v70m0-70H178q-28 0-28 28v42m300-70h272q28 0 28 28v42" />
        </svg>
      </div>

      <dl className="mt-8 grid gap-8 sm:mt-0 sm:grid-cols-3 sm:gap-6 lg:gap-12">
        {foundations.map((foundation) => (
          <div
            key={foundation.name}
            className="flex min-w-0 flex-col gap-4 border-t border-card-edge pt-6 sm:text-center"
          >
            <dt className="font-montserrat text-xl font-medium tracking-tight lg:text-2xl">
              {foundation.name}
            </dt>
            <dd className="flex flex-col gap-3">
              <p className="text-sm text-highlight">{foundation.role}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {foundation.description}
              </p>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="#models">Compare speech models</Link>
        </Button>
      </div>
    </section>
  )
}
