import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-zinc-400",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]",
          "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:opacity-100",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
