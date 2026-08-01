import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      className={cn("relative flex w-full touch-none items-center py-2 select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex w-full items-center">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
          <SliderPrimitive.Thumb className="block size-4 rounded-full border-2 border-primary bg-background shadow transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
