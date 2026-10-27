import { Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CatalogSelect } from '@/components/studio/catalog-select'
import { activePhases } from '@/components/studio/job-status'
import { reviewActions } from '@/lib/actions'
import { curatedFixtures, fixtures } from '../../../../shared/data/fixtures'
import { useStudioStore } from '@/stores/studio-store'

export function ScenarioControls(): React.JSX.Element | null {
  const snapshot = useStudioStore((s) => s.snapshot)
  if (!snapshot) return null
  const selected = fixtures.find((f) => f.id === snapshot.scenario)
  return (
    <section aria-label="Review scenario" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Review state</h2>
        <Badge variant="outline">Dev only</Badge>
      </div>
      <CatalogSelect
        label="Scenario"
        value={snapshot.scenario}
        options={[
          ...curatedFixtures,
          ...(selected && !curatedFixtures.some((item) => item.id === selected.id)
            ? [selected]
            : [])
        ].map((f) => ({
          value: f.id,
          label: f.label,
          description: f.section
        }))}
        onChange={reviewActions.scenario}
      />
      <p className="text-sm leading-relaxed text-muted-foreground">{selected?.description}</p>
      {selected?.backendWork && (
        <Badge variant="secondary" className="self-start">
          New · needs backend work
        </Badge>
      )}
      {selected?.legacy && (
        <p className="text-xs text-muted-foreground">
          Legacy edge case for review. Defects are not the intended default behavior.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!activePhases.has(snapshot.job.phase)}
          onClick={() => reviewActions.pause(!snapshot.job.paused)}
        >
          {snapshot.job.paused ? (
            <Play data-icon="inline-start" aria-hidden="true" />
          ) : (
            <Pause data-icon="inline-start" aria-hidden="true" />
          )}
          {snapshot.job.paused ? 'Run' : 'Pause'}
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Advance simulation one step"
          disabled={!activePhases.has(snapshot.job.phase)}
          onClick={reviewActions.advance}
        >
          <StepForward aria-hidden="true" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Reset review state"
          onClick={reviewActions.reset}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Scenarios start paused. Files, audio, recording and downloads are simulated.
      </p>
    </section>
  )
}
