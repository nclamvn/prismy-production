'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 resize-y",
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
Textarea.displayName = "Textarea"

export { Textarea }