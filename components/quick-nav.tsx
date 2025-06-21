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
      color: "primary",
    },
    {
      href: "/disposal",
      label: "Disposal",
      icon: PackageMinus,
      isPrimary: true,
      color: "destructive",
    },
  ]
  
  return (
    <div className="bg-card/50 border border-border/30 rounded-lg p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0">
        {/* Left Navigation - General Pages */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {leftNavItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Button 
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "transition-all duration-200 flex-shrink-0",
                  isActive 
                    ? "pointer-events-none shadow-sm" 
                    : "hover:bg-accent/80 hover:shadow-sm"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </div>

        {/* Visual Separator */}
        <div className="h-8 w-px bg-border/50 hidden sm:block flex-shrink-0" />

        {/* Right Navigation - Main Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {rightNavItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Button 
                key={item.href}
                variant={isActive ? "default" : "outline"}
                size="default"
                asChild
                className={cn(
                  "transition-all duration-200 relative group font-medium flex-shrink-0",
                  isActive 
                    ? "pointer-events-none shadow-md" 
                    : "hover:shadow-md hover:scale-105 border-border/60",
                  item.color === "destructive" && !isActive && "hover:border-destructive/30 hover:text-destructive",
                  item.color === "primary" && !isActive && "hover:border-primary/30 hover:text-primary"
                )}
              >
                <Link href={item.href}>
                  <item.icon className={cn(
                    "mr-2 h-5 w-5 transition-transform duration-200",
                    item.isPrimary && "group-hover:scale-110"
                  )} />
                  {item.label}
                  {item.isPrimary && isActive && (
                    <span className={cn(
                      "absolute -top-1 -right-1 h-2 w-2 rounded-full animate-pulse",
                      item.color === "destructive" ? "bg-destructive" : "bg-primary"
                    )} />
                  )}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}