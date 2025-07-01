'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-input focus-visible:ring-ring",
            className
          )}
          ref={ref}
          aria-invalid={error}
          aria-describedby={helperText ? `${props.id}-helper-text` : undefined}
          {...props}
        />
        {helperText && (
          <p
            id={`${props.id}-helper-text`}
            className={cn(
              "mt-1 text-sm",
              error ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }