"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoonIcon, SunIcon, BarChart2, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    setMounted(true)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-background",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8 overflow-hidden rounded-full bg-primary flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block">Padokka Analytics</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link
            href="/reports"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Reports
          </Link>
          <Link
            href="/insights"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            AI Insights
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Settings
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Toggle Theme" className="mr-2" onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  href="/reports"
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Reports
                </Link>
                <Link
                  href="/insights"
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  AI Insights
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                >
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

