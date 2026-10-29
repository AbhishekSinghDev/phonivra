import { useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WindowedListStyle extends React.CSSProperties {
  '--list-height'?: string
  '--row-top'?: string
  '--row-height'?: string
}

// Fixed-height windowing keeps long catalogs, output lists and part details inexpensive.
// Heights are calculated layout values, not an additional styling system.
export function WindowedList<T>({
  items,
  itemKey,
  renderItem,
  rowHeight = 64,
  label
}: {
  items: readonly T[]
  itemKey: (item: T) => string
  renderItem: (item: T, index: number) => React.ReactNode
  rowHeight?: number
  label: string
}): React.JSX.Element {
  const [scrollTop, setScrollTop] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const visibleCount = Math.ceil(320 / rowHeight) + 4
  const start = Math.max(
    0,
    Math.min(Math.floor(scrollTop / rowHeight) - 2, Math.max(0, items.length - visibleCount))
  )
  const listStyle: WindowedListStyle = { '--list-height': `${items.length * rowHeight}px` }
  return (
    <ScrollArea
      ref={root}
      className="h-80 w-full"
      role="region"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(event) => {
        const viewport = root.current?.querySelector<HTMLElement>(
          '[data-radix-scroll-area-viewport]'
        )
        if (!viewport) return
        const delta =
          event.key === 'ArrowDown'
            ? rowHeight
            : event.key === 'ArrowUp'
              ? -rowHeight
              : event.key === 'PageDown'
                ? 320
                : event.key === 'PageUp'
                  ? -320
                  : 0
        if (delta || event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          root.current?.focus()
          viewport.scrollTop =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? viewport.scrollHeight
                : viewport.scrollTop + delta
        }
      }}
      onScrollCapture={(event) => setScrollTop((event.target as HTMLElement).scrollTop)}
    >
      <div role="list" aria-label={label} className="windowed-list" style={listStyle}>
        {items.slice(start, start + visibleCount).map((item, offset) => {
          const rowStyle: WindowedListStyle = {
            '--row-top': `${(start + offset) * rowHeight}px`,
            '--row-height': `${rowHeight}px`
          }
          return (
            <div
              key={itemKey(item)}
              role="listitem"
              aria-posinset={start + offset + 1}
              aria-setsize={items.length}
              className="windowed-list-row"
              style={rowStyle}
            >
              {renderItem(item, start + offset)}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
