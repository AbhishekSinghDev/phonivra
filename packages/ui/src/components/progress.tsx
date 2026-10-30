'use client'

import * as React from 'react'
import { cn } from 'cn'
import { Progress as ProgressPrimitive } from 'radix-ui'

interface ProgressStyle extends React.CSSProperties {
  '--progress-offset': string
}

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indicatorStyle: ProgressStyle = { '--progress-offset': `-${100 - (value || 0)}%` }
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn('relative h-2 w-full overflow-hidden rounded-lg bg-primary/20', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="progress-indicator h-full w-full flex-1 bg-primary transition-all"
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
