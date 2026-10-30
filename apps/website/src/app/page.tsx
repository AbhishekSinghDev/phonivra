import { SiteShell } from '@/components/site-shell'
import { HeroSection } from '@/components/hero-section'
import { HowItWorksSection } from '@/components/how-it-works-section'
import { FeaturesSection } from '@/components/features-section'
import { BentoSection } from '@/components/bento-section'
import { IntegrationsSection } from '@/components/integrations-section'
import { ModelsSection } from '@/components/models-section'
import { FaqSection } from '@/components/faq-section'
import { DownloadSection } from '@/components/download-section'

export default function Home(): React.JSX.Element {
  return (
    <SiteShell>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BentoSection />
      <IntegrationsSection />
      <ModelsSection />
      <FaqSection />
      <DownloadSection />
    </SiteShell>
  )
}
