import { Tabs, TabsContent, TabsList, TabsTrigger } from '@phonivra/ui/components/tabs'
import { FeatureVisual } from '@/components/feature-visual'

const workspaces = [
  {
    id: 'narration',
    label: 'Narration',
    title: 'Make room for the right words.',
    description:
      'A focused editor for your script, with voice and pacing controls close at hand. Write or paste your text, give it a title, and shape the way you want it to sound.',
    details: [
      'Live word and character counts',
      'Pause markers and script tools',
      'Planned pronunciation and text cleanup'
    ],
    note: 'The editor is ready. Real text preparation and speech generation are still in development.'
  },
  {
    id: 'voices',
    label: 'Voices',
    title: 'Find the voice for the story.',
    description:
      'Bring the voice, language and pace together in one place. Voice collection also includes a flow for creating a preset from a reference recording, without training or a transcript.',
    details: [
      'Voice search and collection filters',
      'Language and speed controls',
      'Use recordings you have permission to clone'
    ],
    note: 'Recording, uploads, previews and cloning are simulated. Custom presets currently last only for the session.'
  },
  {
    id: 'batch',
    label: 'Batch',
    title: 'Give every chapter its place.',
    description:
      'The Batch studio interface brings multiple scripts into one plan. Split pasted text at Markdown headings, review the items, and use one voice and set of settings throughout.',
    details: [
      'Script files or pasted chaptered text',
      'Review the plan before generation',
      'Planned ZIP export of completed items'
    ],
    note: 'File import, batch generation and ZIP export are simulated. The example shows the intended workflow.'
  },
  {
    id: 'library',
    label: 'Library',
    title: 'A take is more than an audio file.',
    description:
      'The Audio library interface brings takes and their generation details together. The planned engine will pair audio with subtitles, a transcript and metadata, so the context stays with the work.',
    details: [
      'Searchable take list and detail view',
      'Model, voice, seed and settings per take',
      'Planned audio and companion-file exports'
    ],
    note: 'Playback and exports are simulated. Library data is currently held in memory and does not survive a restart.'
  },
  {
    id: 'models',
    label: 'Models',
    title: 'The model behind the voice.',
    description:
      'Four Chatterbox models are listed in the studio, alongside Auto routing. The planned engine will choose Turbo for English and Multilingual V3 for other supported languages.',
    details: [
      'Model capabilities and language notes',
      'Download, pause and resume interface',
      'Planned offline use of installed models'
    ],
    note: 'Model loading, downloads and device detection are simulated. The local engine is not integrated yet.'
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
          Five workspaces.
          <br />
          <span className="highlight">One studio.</span>
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          A considered place for every part of the voice workflow. Explore the interface taking
          shape, from a first line to a finished take.
        </p>
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
                <p className="mt-2 border-t border-card-edge pt-5 text-xs leading-relaxed text-muted-foreground">
                  {workspace.note}
                </p>
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
