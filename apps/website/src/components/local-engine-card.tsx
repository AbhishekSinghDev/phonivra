import { Badge } from '@phonivra/ui/components/badge'
import { Card, CardBody, CardText, CardTitle } from '@phonivra/ui/components/card'

export function LocalEngineCard(): React.JSX.Element {
  return (
    <Card>
      <figure
        aria-label="Planned on-device processing using a CPU or NVIDIA CUDA"
        className="flex flex-1 flex-col items-center justify-center gap-5 px-6 pt-8 pb-6"
      >
        <svg
          viewBox="0 0 96 96"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="size-24 text-highlight"
          aria-hidden="true"
        >
          <rect x="22" y="22" width="52" height="52" rx="10" />
          <rect x="31" y="31" width="34" height="34" rx="5" />
          <path d="M34 22V10m14 12V10m14 12V10M34 86V74m14 12V74m14 12V74M22 34H10m12 14H10m12 14H10m76-28H74m12 14H74m12 14H74" />
          <path d="M40 47v2m8-10v18m8-13v8" strokeLinecap="round" />
        </svg>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline">CPU</Badge>
          <Badge variant="outline">NVIDIA CUDA</Badge>
        </div>
      </figure>
      <div className="mx-2 mb-3 sm:mx-4">
        <CardBody>
          <CardTitle>At home on your machine.</CardTitle>
          <CardText>
            Designed for local generation, with offline use after models are downloaded.
          </CardText>
        </CardBody>
      </div>
    </Card>
  )
}
