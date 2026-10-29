import { cn } from '@/lib/utils'

/**
 * The chaicode.com page background: one SVG with a warm glow and faint
 * hexagons, centred at the top, behind everything. Place it once, as the
 * first child of the page wrapper.
 *
 * - Light mode inverts it, and a half-turn of hue keeps the browns warm
 *   (a plain invert turns them blue).
 * - Its last row is a step lighter than the page, so the bottom is masked
 *   out; otherwise a line shows where the image stops.
 * - The chaiui style makes its parent `isolation: isolate`, so the negative
 *   z-index stays above an opaque page wrapper instead of sinking behind it.
 */
export function Backdrop({
  src,
  className
}: {
  src: string
  className?: string
}): React.JSX.Element {
  return (
    <img
      data-chai-backdrop=""
      src={src}
      alt=""
      aria-hidden="true"
      fetchPriority="high"
      decoding="async"
      // Preserve the official artwork's intrinsic width so the glow stays centered at every size.
      className={cn(
        'pointer-events-none absolute top-0 left-1/2 -z-10 w-710.5 max-w-none -translate-x-1/2 select-none',
        'invert hue-rotate-180 dark:invert-0 dark:hue-rotate-0',
        className
      )}
    />
  )
}
