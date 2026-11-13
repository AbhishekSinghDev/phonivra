import { Tabs, TabsContent, TabsList, TabsTrigger } from '@phonivra/ui/components/tabs'
import { FeatureVisual } from '@/components/feature-visual'

const workspaces = [
  {
    id: 'narration',
    label: 'Narration',
    title: 'Prepare your script',
    description: 'Set the pace, add pauses, and adjust how names and tricky words are read aloud.',
    details: [
      'Live word and character counts',
      'Import text files, Markdown, or subtitles',
      'Automatic language detection'
    ]
  },
  {
    id: 'voices',
    label: 'Voices',
    title: 'Save a voice you can use again',
    description:
      'Create a voice preset from a recording. Listen to a short sample before you narrate the whole script.',
    details: [
      'Record from your microphone or import audio',
      'Search and filter your voice collection',
      'Save presets locally for future sessions'
    ]
  },
  {
    id: 'batch',
    label: 'Batch',
    title: 'Generate several scripts at once',
    description:
      'Import several scripts or split one script into chapters using Markdown headings. Review the list before you generate.',
    details: [
      'Shared voice and generation settings',
      'Progress and errors for each item',
      'Export finished audio and optional files as a ZIP'
    ]
  },
  {
    id: 'library',
    label: 'Library',
    title: 'Find your finished audio',
    description:
      'The audio library keeps your finished takes so you can listen again or export them the next time you open the app.',
    details: [
      'Search your saved takes',
      'See the voice, model, and settings used for each take',
      'Export audio, subtitles, transcripts, and metadata'
    ]
  },
  {
    id: 'models',
    label: 'Models',
    title: 'Pick a speech model',
    description:
      'See which languages and speech controls each Chatterbox model supports. Download the models you want to use.',
    details: [
      'Automatic model selection by language',
      'Pause and resume model downloads',
      'Offline generation with downloaded models'
    ]
  }
] as const

export function FeaturesSection(): React.JSX.Element {
  return (
    <section
      id="studio"
      aria-labelledby="studio-title"
      className="mx-auto max-w-6xl scroll-mt-28 px-6 py-16 sm:px-12 sm:py-24"
    >
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <h2
          id="studio-title"
          className="text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl"
        >
          Inside the <span className="highlight">studio</span>
        </h2>
      </header>
      <Tabs defaultValue="narration" className="mt-10">
        <div className="flex overflow-x-auto px-1 py-2">
          <TabsList
            variant="line"
            aria-label="Explore Phonivra workspaces"
            className="mx-auto shrink-0"
          >
            {workspaces.map((workspace) => (
              <TabsTrigger key={workspace.id} value={workspace.id}>
                {workspace.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {workspaces.map((workspace) => (
          <TabsContent key={workspace.id} value={workspace.id}>
            <div className="mt-6 grid items-center gap-8 border-t border-card-edge pt-10 motion-safe:animate-chai-fade lg:grid-cols-5 lg:gap-12">
              <div className="flex flex-col gap-5 lg:col-span-2">
                <h3 className="font-montserrat text-2xl leading-snug font-medium tracking-tight text-balance">
                  {workspace.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {workspace.description}
                </p>
                <ul className="mt-1 flex flex-col gap-3 text-sm">
                  {workspace.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="mt-0.5 size-4 shrink-0 text-highlight"
                        aria-hidden="true"
                      >
                        <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0 lg:col-span-3">
                <FeatureVisual area={workspace.id} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
