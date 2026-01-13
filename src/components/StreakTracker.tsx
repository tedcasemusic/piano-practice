'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StreakData {
  currentStreak: number
  bestStreak: number
  practicedToday: boolean
}

interface StreakTrackerProps {
  refreshTrigger?: number
}

export default function StreakTracker({ refreshTrigger }: StreakTrackerProps) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    practicedToday: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreakData()
  }, [refreshTrigger])

  const fetchStreakData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Get all practice sessions ordered by date
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('practice_date')
      .eq('user_id', user.id)
      .order('practice_date', { ascending: false })

    if (!sessions || sessions.length === 0) {
      setLoading(false)
      return
    }

    // Get unique dates (in case of multiple sessions per day)
    const uniqueDates = [...new Set(sessions.map(s => s.practice_date))].sort().reverse()

    // Calculate current streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let currentStreak = 0
    const practicedToday = uniqueDates[0] === todayStr

    // Start counting from today or yesterday
    let checkDate = practicedToday ? today : yesterday

    // Only start counting if they practiced today or yesterday
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      for (const dateStr of uniqueDates) {
        const checkDateStr = checkDate.toISOString().split('T')[0]
        if (dateStr === checkDateStr) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else if (dateStr < checkDateStr) {
          break
        }
      }
    }

    // Calculate best streak (find longest consecutive sequence)
    let bestStreak = 0
    let tempStreak = 1
    const sortedDates = [...uniqueDates].sort()

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1])
      const currDate = new Date(sortedDates[i])
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 1
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak, currentStreak)

    setStreak({
      currentStreak,
      bestStreak,
      practicedToday,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/2 mb-2"></div>
        <div className="h-10 bg-secondary rounded w-1/3"></div>
      </div>
    )
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆'
    if (streak >= 14) return '🔥'
    if (streak >= 7) return '⭐'
    if (streak >= 3) return '✨'
    return '🎹'
  }

  const getStreakMessage = (streak: number, practicedToday: boolean) => {
    if (streak === 0) {
      return practicedToday ? "Great start!" : "Start your streak today!"
    }
    if (streak >= 30) return "Incredible dedication!"
    if (streak >= 14) return "You're on fire!"
    if (streak >= 7) return "One week strong!"
    if (streak >= 3) return "Building momentum!"
    return "Keep it going!"
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-accent mb-1">Current Streak</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary">
              {streak.currentStreak}
            </span>
            <span className="text-2xl">{getStreakEmoji(streak.currentStreak)}</span>
            <span className="text-sm text-accent">
              {streak.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-xs text-accent mt-1">
            {getStreakMessage(streak.currentStreak, streak.practicedToday)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-accent mb-1">Best Streak</p>
          <div className="flex items-center justify-end gap-1">
            <span className="text-xl font-semibold text-heading">
              {streak.bestStreak}
            </span>
            <span className="text-sm text-accent">
              {streak.bestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          {streak.currentStreak > 0 && streak.currentStreak >= streak.bestStreak && (
            <p className="text-xs text-primary font-medium mt-1">
              Personal best!
            </p>
          )}
        </div>
      </div>

      {streak.practicedToday && (
        <div className="mt-3 pt-3 border-t border-secondary">
          <p className="text-xs text-center text-accent">
            You practiced today! Come back tomorrow to continue your streak.
          </p>
        </div>
      )}
    </div>
  )
}
