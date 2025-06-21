"use client"

import { useState, useEffect } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { DEFAULT_TIMEZONE } from '@/lib/config'

interface DigitalClockProps {
  className?: string
}

export function DigitalClock({ 
  className = ""
}: DigitalClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimezoneDisplay = () => {
    if (DEFAULT_TIMEZONE === 'America/New_York') {
      return 'EST/EDT'
    }
    const timezoneString = String(DEFAULT_TIMEZONE)
    const parts = timezoneString.split('/')
    return parts[parts.length - 1] || timezoneString
  }

  return (
    <div className={`bg-gray-900 text-white font-mono rounded-lg shadow-lg p-4 max-w-sm w-full ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-400" />
          <span className="text-2xl font-bold tracking-wider">
            {formatTime(currentTime)}
          </span>
        </div>
        <div className="text-sm font-medium bg-gray-700 text-gray-300 px-2 py-1 rounded">
          {getTimezoneDisplay()}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
        <Calendar className="h-4 w-4" />
        <span>{formatDate(currentTime)}</span>
      </div>
    </div>
  )
}

// Compact version for smaller spaces
export function CompactDigitalClock({ className = "" }: { className?: string }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className={`flex items-center gap-1 text-xs font-mono ${className}`}>
      <Clock className="h-3 w-3 text-primary" />
      <span className="text-foreground">
        {formatTime(currentTime)}
      </span>
      <span className="text-muted-foreground">
        {formatDate(currentTime)}
      </span>
    </div>
  )
} 