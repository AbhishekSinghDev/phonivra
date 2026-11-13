import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@phonivra/ui/components/table'

const languages = [
  'Arabic',
  'Danish',
  'German',
  'Greek',
  'English',
  'Spanish',
  'Finnish',
  'French',
  'Hebrew',
  'Hindi',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Dutch',
  'Norwegian',
  'Polish',
  'Portuguese',
  'Russian',
  'Swedish',
  'Swahili',
  'Turkish',
  'Chinese'
]

const models = [
  {
    name: 'Chatterbox Turbo',
    size: '350M',
    language: 'English',
    detail: 'Supports tags like [laugh]'
  },
  {
    name: 'Multilingual V3',
    size: '500M',
    language: '23 languages',
    detail: 'Use a voice recording in another language'
  },
  {
    name: 'AI4Bharat IndicF5',
    size: '400M',
    language: '11 Indian languages',
    detail: 'Use a short voice recording and its transcript'
  }
]

export function ModelsSection(): React.JSX.Element {
  return (
    <section
      id="models"
      aria-labelledby="models-title"
      className="mx-auto max-w-6xl px-6 py-16 sm:px-12 sm:py-24"
    >
      <header className="grid items-start gap-5 lg:grid-cols-5 lg:gap-10">
        <h2
          id="models-title"
          className="text-2xl leading-tight font-medium tracking-tight text-balance sm:text-3xl lg:col-span-2"
        >
          Compare <span className="highlight">speech models</span>
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:col-span-3">
          Download the model you need from the app. Compare the languages and controls below.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-8 border-t border-card-edge pt-6 lg:grid-cols-5 lg:gap-10">
        <div className="min-w-0 lg:col-span-3">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="sr-only">
                Speech models available in Phonivra. M denotes millions of parameters.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Model</TableHead>
                  <TableHead scope="col">Parameters</TableHead>
                  <TableHead scope="col">Languages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.name}>
                    <TableHead scope="row">
                      <div className="flex flex-col gap-1 py-2">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {model.detail}
                        </span>
                      </div>
                    </TableHead>
                    <TableCell>
                      <span className="tabular-nums">{model.size}</span>
                    </TableCell>
                    <TableCell>{model.language}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Auto uses Multilingual V3 where available and IndicF5 for additional Indian languages.
            Select Turbo for English reaction tags.
          </p>
        </div>

        <div className="min-w-0 lg:col-span-2">
          <h3 className="font-montserrat text-lg font-medium tracking-tight">
            Multilingual V3 languages
          </h3>
          <ul
            aria-label="Languages supported by Multilingual V3"
            className="mt-3 grid grid-cols-3 gap-x-4 sm:grid-cols-4 lg:grid-cols-3"
          >
            {languages.map((language) => (
              <li key={language} className="border-b border-card-edge py-2 text-xs">
                {language}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 border-t border-card-edge pt-4 text-xs leading-relaxed text-muted-foreground">
        Phonivra can write out numbers in English and counting numbers in Hindi before generating
        speech. It does not add Hebrew vowel marks or Russian stress marks.
      </p>
    </section>
  )
}
