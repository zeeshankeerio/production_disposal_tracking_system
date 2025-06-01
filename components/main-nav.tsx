"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Database, LayoutDashboard, Package, PackagePlus, PackageMinus } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()

  const navItems = [
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
      href: "/database-setup",
      label: "Database Setup",
      icon: Database,
    },
  ]

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">
          Production Disposal Tracker
        </span>
      </Link>
      <nav className="flex items-center space-x-4 lg:space-x-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  )
} 