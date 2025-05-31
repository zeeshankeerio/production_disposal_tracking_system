"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  title: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center space-x-2">
        <li className="flex items-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.title}
                </Link>
              ) : (
                <span className={cn(
                  isLast ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {item.title}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
} 