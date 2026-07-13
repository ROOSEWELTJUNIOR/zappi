import * as React from "react"
import { Link, useLocation } from "wouter"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

export function Breadcrumb({ className }: { className?: string }) {
  const [location] = useLocation()
  const paths = location.split('/').filter(Boolean)
  
  if (paths.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <ol className="flex items-center gap-1.5">
        <li>
          <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1
          const href = `/${paths.slice(0, index + 1).join('/')}`
          
          const label = path.charAt(0).toUpperCase() + path.slice(1)
          
          return (
            <li key={path} className="flex items-center gap-1.5">
              <ChevronRight className="h-4 w-4" />
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
