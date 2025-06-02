"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, PackagePlus, PackageMinus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuickNav() {
  const pathname = usePathname()
  
  const leftNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/products",
      label: "Products",
      icon: Package,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  const rightNavItems = [
    {
      href: "/production",
      label: "Production",
      icon: PackagePlus,
      isPrimary: true,
    },
    {
      href: "/disposal",
      label: "Disposal",
      icon: PackageMinus,
      isPrimary: true,
    },
  ]
  
  return (
    <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 pt-1">
      <div className="flex items-center gap-2">
        {leftNavItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Button 
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "transition-all",
                isActive ? "pointer-events-none" : "hover:bg-accent"
              )}
            >
              <Link href={item.href}>
                <item.icon className="mr-1 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        {rightNavItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Button 
              key={item.href}
              variant={isActive ? "default" : "outline"}
              size="default"
              asChild
              className={cn(
                "transition-all relative group",
                isActive ? "pointer-events-none" : "hover:shadow-md hover:scale-105",
                item.isPrimary && "font-semibold"
              )}
            >
              <Link href={item.href}>
                <item.icon className={cn(
                  "mr-1 h-5 w-5 transition-transform",
                  item.isPrimary && "group-hover:scale-110"
                )} />
                {item.label}
                {item.isPrimary && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                )}
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
}