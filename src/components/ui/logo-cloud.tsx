import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const logoCloudVariants = cva(
  "flex items-center justify-center gap-8 grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100",
  {
    variants: {
      size: {
        sm: "h-8",
        default: "h-12",
        lg: "h-16",
      },
      layout: {
        grid: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8",
        flex: "flex flex-wrap justify-center gap-8",
        scroll: "flex animate-scroll gap-12",
      },
    },
    defaultVariants: {
      size: "default",
      layout: "flex",
    },
  }
)

export interface LogoCloudProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof logoCloudVariants> {
  logos: Array<{
    name: string
    src: string
    alt?: string
  }>
}

const LogoCloud = React.forwardRef<HTMLDivElement, LogoCloudProps>(
  ({ className, size, layout, logos, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        <div className={cn(logoCloudVariants({ size, layout }))}>
          {logos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center group cursor-pointer"
            >
              <img
                src={logo.src}
                alt={logo.alt || `${logo.name} logo`}
                className={cn(
                  "transition-all duration-300 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100",
                  size === "sm" && "h-8",
                  size === "default" && "h-12",
                  size === "lg" && "h-16"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
)
LogoCloud.displayName = "LogoCloud"

// Demo logos for development - replace with real client logos
export const demoLogos = [
  { name: "Microsoft", src: "/logos/microsoft.svg" },
  { name: "Google", src: "/logos/google.svg" },
  { name: "Amazon", src: "/logos/amazon.svg" },
  { name: "Apple", src: "/logos/apple.svg" },
  { name: "Meta", src: "/logos/meta.svg" },
  { name: "Netflix", src: "/logos/netflix.svg" },
]

export { LogoCloud, logoCloudVariants }