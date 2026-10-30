import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@phonivra/ui/lib/utils'

export function SiteLogo({ size = 32 }: { size?: 32 | 40 }): React.JSX.Element {
  const imageClass = size === 40 ? 'size-10 rounded-lg' : 'size-8 rounded-md'

  return (
    <Link
      href="#top"
      aria-label="Phonivra home"
      className={cn(
        'flex items-center font-onest text-2xl font-semibold tracking-tight',
        size === 40 ? 'gap-3' : 'gap-2'
      )}
    >
      <Image
        src="/images/phonivra-dark.png"
        width={size}
        height={size}
        alt=""
        className={cn('hidden dark:block', imageClass)}
      />
      <Image
        src="/images/phonivra-light.png"
        width={size}
        height={size}
        alt=""
        className={cn('dark:hidden', imageClass)}
      />
      <span>
        Phonivra<span className="text-brand">.</span>
      </span>
    </Link>
  )
}
