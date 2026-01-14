'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PerfectWeekStarProps {
  practiceDays: boolean[]
  refreshTrigger?: number
}

interface WeekData {
  weekStart: Date
  isPerfect: boolean
  daysCompleted: number
}

// Star SVG component for reuse
function Star({
  size,
  filled,
  opacity = 1,
  id
}: {
  size: number
  filled: boolean
  opacity?: number
  id: string
}) {
  const scale = size / 120

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{
        opacity,
        transition: 'all 0.5s ease',
        ...(filled && opacity === 1 ? { animation: 'star-shimmer 3s ease-in-out infinite' } : {})
      }}
    >
      <defs>
        <linearGradient id={`goldOmbre-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gold-dark)" />
          <stop offset="30%" stopColor="var(--gold)" />
          <stop offset="50%" stopColor="var(--gold-light)" />
          <stop offset="70%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--gold-dark)" />
        </linearGradient>
      </defs>
      <path
        d="M60 10 L72 42 L106 42 L79 62 L88 95 L60 76 L32 95 L41 62 L14 42 L48 42 Z"
        fill={filled ? `url(#goldOmbre-${id})` : 'none'}
        stroke={filled ? 'var(--gold-dark)' : 'var(--secondary)'}
        strokeWidth={filled ? '2' : '3'}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PerfectWeekStar({ practiceDays, refreshTrigger }: PerfectWeekStarProps) {
  const [pastWeeks, setPastWeeks] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)

  const isPerfectWeek = practiceDays.length === 7 && practiceDays.every(day => day)
  const daysCompleted = practiceDays.filter(Boolean).length

  const getThursdayWeekStart = (date: Date = new Date()) => {
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    let daysSinceThursday = dayOfWeek - 4
    if (daysSinceThursday < 0) daysSinceThursday += 7
    d.setDate(d.getDate() - daysSinceThursday)
    d.setHours(0, 0, 0, 0)
    return d
  }

  useEffect(() => {
    fetchPastWeeks()
  }, [refreshTrigger])

  const fetchPastWeeks = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Get the start of current week and go back 4 weeks
    const currentWeekStart = getThursdayWeekStart()
    const weeksToShow = 4

    // Calculate the earliest date we need (4 weeks ago)
    const earliestDate = new Date(currentWeekStart)
    earliestDate.setDate(earliestDate.getDate() - (weeksToShow * 7))

    // Fetch all practice sessions from the past weeks
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('practice_date')
      .eq('user_id', user.id)
      .gte('practice_date', earliestDate.toISOString().split('T')[0])
      .lt('practice_date', currentWeekStart.toISOString().split('T')[0])

    // Build a set of all practice dates
    const practiceDates = new Set<string>()
    sessions?.forEach(s => practiceDates.add(s.practice_date))

    // Calculate perfect weeks for each past week
    const weeks: WeekData[] = []
    for (let i = 1; i <= weeksToShow; i++) {
      const weekStart = new Date(currentWeekStart)
      weekStart.setDate(weekStart.getDate() - (i * 7))

      // Count days practiced in this week
      let daysInWeek = 0
      for (let d = 0; d < 7; d++) {
        const checkDate = new Date(weekStart)
        checkDate.setDate(checkDate.getDate() + d)
        const dateStr = checkDate.toISOString().split('T')[0]
        if (practiceDates.has(dateStr)) {
          daysInWeek++
        }
      }

      weeks.push({
        weekStart,
        isPerfect: daysInWeek === 7,
        daysCompleted: daysInWeek
      })
    }

    // Reverse so oldest is first (left), newest is last (right, closest to current)
    setPastWeeks(weeks.reverse())
    setLoading(false)
  }

  // Calculate sizes and opacities for past weeks (fading to the left)
  const getStarStyle = (index: number, total: number) => {
    // Index 0 is oldest (leftmost), fades most
    // Higher index = more recent = less faded
    const fadeLevel = (total - index) / total
    const opacity = 0.3 + (0.7 * (index + 1) / total) // Range from ~0.3 to 1.0
    const size = 50 + (20 * (index + 1) / total) // Range from ~50 to 70px
    return { opacity, size: Math.round(size) }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col items-center">
        {/* Stars row */}
        <div className="flex items-end justify-center gap-2">
          {/* Past weeks - smaller and fading */}
          {!loading && pastWeeks.map((week, index) => {
            const { opacity, size } = getStarStyle(index, pastWeeks.length)
            return (
              <div key={week.weekStart.toISOString()} className="flex flex-col items-center">
                <Star
                  size={size}
                  filled={week.isPerfect}
                  opacity={opacity}
                  id={`past-${index}`}
                />
              </div>
            )
          })}

          {/* Current week - largest and most prominent */}
          <div className="flex flex-col items-center">
            <Star
              size={120}
              filled={isPerfectWeek}
              opacity={1}
              id="current"
            />
          </div>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-heading">
          Perfect Week Star
        </h3>

        <p className={`mt-1 text-sm ${isPerfectWeek ? 'text-gold-dark font-medium' : 'text-accent'}`}>
          {isPerfectWeek
            ? 'You did it! Every day this week!'
            : `${daysCompleted}/7 days practiced this week`
          }
        </p>
      </div>
    </div>
  )
}
