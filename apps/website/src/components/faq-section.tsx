import Link from 'next/link'
import { siteLinks } from '@/components/site-links'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@phonivra/ui/components/accordion'

const questions = [
  {
    question: 'How do I install Phonivra?',
    answer:
      'Check GitHub Releases for an installer for your system. The installation guide also covers running from source and downloading your first model.',
    learnMore: { label: 'Read the installation guide', href: '/docs/install' }
  },
  {
    question: 'Will it work offline?',
    answer: 'Yes. Download a speech model while connected, then use it offline.'
  },
  {
    question: 'How do custom voices work?',
    answer:
      'Record or import a clip to use immediately or save it as a voice preset. IndicF5 requires a saved preset with the exact words spoken. Get the speaker’s permission before cloning their voice.'
  },
  {
    question: 'Which formats can I export?',
    answer:
      'Choose WAV, MP3, FLAC, OGG, or M4A before generating. Export the finished audio on its own or with SRT and VTT subtitles, a TXT transcript, and JSON metadata. Subtitle timings are approximate.'
  },
  {
    question: 'Where is my work saved?',
    answer:
      'Your drafts, voice presets, and finished audio are saved on your computer. You can save a project file and reopen it later. If you move it to another computer, add any custom voice it uses there too.'
  },
  {
    question: 'Is commercial use allowed?',
    answer:
      'Phonivra’s code uses the MIT license. The publishers list the Chatterbox and IndicF5 model repositories under MIT. Before publishing or selling narration, check that you have permission to use the script, recordings, and any cloned voice. Follow your platform’s disclosure rules.',
    learnMore: {
      label: 'Read the generated audio guide',
      href: siteLinks.generatedAudio
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
          Common <span className="highlight">questions</span>
        </h2>
      </header>
      <div className="min-w-0 border-t border-card-edge lg:col-span-3">
        <Accordion
          type="single"
          collapsible
          defaultValue="How do I install Phonivra?"
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
