import { FeatureScreenshot } from '@/components/feature-screenshot'
import { BatchVisual } from '@/components/batch-visual'
import { LibraryVisual } from '@/components/library-visual'
import { ModelRoutingVisual } from '@/components/model-routing-visual'

interface FeatureVisualProps {
  area: 'narration' | 'voices' | 'batch' | 'library' | 'models'
}

export function FeatureVisual({ area }: FeatureVisualProps): React.JSX.Element {
  switch (area) {
    case 'narration':
    case 'voices':
      return <FeatureScreenshot area={area} />
    case 'batch':
      return <BatchVisual />
    case 'library':
      return <LibraryVisual />
    case 'models':
      return <ModelRoutingVisual />
  }
}
