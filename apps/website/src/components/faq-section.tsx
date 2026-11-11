import Link from 'next/link'
import { siteLinks } from '@/components/site-links'
import { Button } from '@phonivra/ui/components/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@phonivra/ui/components/accordion'

const questions = [
  {
    question: 'Can I generate speech with Phonivra today?',
    answer:
      'Yes. You can run Phonivra from source with the local engine to download a model, generate a narration, and export audio. See release status for installer availability.'
  },
  {
    question: 'Will it work offline?',
    answer:
      'Yes. Download the model you want while online. Once it is cached, you can generate speech offline on your computer.'
  },
  {
    question: 'How do custom voices work?',
    answer:
      'Import or record a reference and save it as a voice preset. Use your own voice or get the speaker’s permission to clone and use their voice.'
  },
  {
    question: 'Which formats can I export?',
    answer:
      'Export WAV, MP3, FLAC, OGG, or M4A, along with SRT or VTT subtitles, a transcript, and JSON metadata. Subtitle timings are approximate.'
  },
  {
    question: 'What about privacy and saved work?',
    answer:
      'Scripts, reference recordings, and generated audio stay on your device. Phonivra stores drafts, voice presets, and library outputs locally. You can also save and reopen project files.'
  },
  {
    question: 'Is commercial use allowed?',
    answer:
      'Phonivra’s code is MIT-licensed, and Resemble AI lists the Chatterbox model repositories used by the app as MIT. For commercial narration, make sure you have rights to the script and recordings, permission to use any cloned voice, and any disclosures your platform requires.',
    learnMore: {
      label: 'Read the generated audio guide',
      href: `${siteLinks.repository}/blob/master/GENERATED_AUDIO.md`
    }
  }
]

export function FaqSection(): React.JSX.Element {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-12 sm:py-24 lg:grid-cols-5 lg:gap-20"
    >
      <header className="flex flex-col items-start gap-6 lg:col-span-2">
        <h2
          id="faq-title"
          className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl"
        >
          A few things,
          <br />
          <span className="highlight">Before you begin.</span>
        </h2>
        <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
          What’s ready, what’s planned, and what to know about the studio taking shape.
        </p>
        <Button variant="outline" asChild>
          <Link href="#download">View release status</Link>
        </Button>
      </header>
      <div className="min-w-0 border-t border-card-edge lg:col-span-3">
        <Accordion
          type="single"
          collapsible
          defaultValue="Can I generate speech with Phonivra today?"
          aria-label="Questions about Phonivra"
        >
          {questions.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <div className="py-2">
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="max-w-prose leading-relaxed text-muted-foreground">{item.answer}</p>
                  {item.learnMore && (
                    <Link
                      className="mt-2 inline-block text-sm underline underline-offset-4"
                      href={item.learnMore.href}
                    >
                      {item.learnMore.label}
                    </Link>
                  )}
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
