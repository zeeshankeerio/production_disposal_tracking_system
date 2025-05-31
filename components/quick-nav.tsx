"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { FileText, LayoutDashboard, Package, BarChart, PackagePlus, PackageMinus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuickNav() {
  const pathname = usePathname()
  
  const navItems = [
    {
      href: "/entries",
      label: "Entries",
      icon: FileText,
    },
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
      href: "/production",
      label: "Production",
      icon: PackagePlus,
    },
    {
      href: "/disposal",
      label: "Disposal",
      icon: PackageMinus,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ]
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
      {navItems.map((item) => {
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
  )
}