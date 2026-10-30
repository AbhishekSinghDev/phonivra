import Link from 'next/link'
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
      'No. The desktop interface is built, but the local speech engine is not integrated. Generation, playback, imports, exports, model downloads and device detection are currently simulated. No real audio is created and no files are written.'
  },
  {
    question: 'Will it work offline?',
    answer:
      'That is the intended design: download models first, then generate on your computer using your CPU or a compatible NVIDIA GPU. Model downloads need an internet connection. This local engine workflow is not working yet; minimum hardware requirements have not been announced.'
  },
  {
    question: 'What is planned for custom voices?',
    answer:
      'The interface includes a flow for uploading or recording a reference and saving a voice preset, without training or a transcript. The models recommend a clean recording of 6 seconds or longer. Uploading and microphone capture are simulated today, and custom presets only last for the current session. Use recordings you have permission to clone.'
  },
  {
    question: 'Which export formats are planned?',
    answer:
      'The interface offers WAV, MP3, FLAC, OGG and M4A, plus SRT and VTT subtitles, a TXT transcript and JSON metadata. Native model output is mono 24 kHz. Other formats, resampling and speed changes will require FFmpeg. Subtitles are intended to use approximate sentence timing, not word-level alignment. All export actions are currently simulated.'
  },
  {
    question: 'What about privacy and saved work?',
    answer:
      'Phonivra is designed without accounts, cloud storage, telemetry or uploads of scripts and audio. In the current build, scripts, voices, jobs and outputs live in memory and are lost when the app restarts. Only the theme and sidebar state persist. Project saving and long-term library storage are not implemented yet.'
  },
  {
    question: 'Is commercial use allowed?',
    answer:
      'The app license has not been decided. Each model has its own license, which may restrict commercial use; check the applicable model license before using its output commercially. Generated audio is intended to carry the Resemble Perth watermark. Real watermark verification is not implemented yet.'
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
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
