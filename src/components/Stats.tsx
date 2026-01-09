'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StatsData {
  thisWeek: number
  thisMonth: number
  totalSessions: number
  averageRating: number | null
}

interface StatsProps {
  refreshTrigger?: number
}

export default function Stats({ refreshTrigger }: StatsProps) {
  const [stats, setStats] = useState<StatsData>({
    thisWeek: 0,
    thisMonth: 0,
    totalSessions: 0,
    averageRating: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const fetchStats = async () => {
    const supabase = createClient()

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all sessions for calculations
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('duration_minutes, practice_date, rating')

    if (sessions) {
      const thisWeekMinutes = sessions
        .filter(s => new Date(s.practice_date) >= startOfWeek)
        .reduce((sum, s) => sum + s.duration_minutes, 0)

      const thisMonthMinutes = sessions
        .filter(s => new Date(s.practice_date) >= startOfMonth)
        .reduce((sum, s) => sum + s.duration_minutes, 0)

      const ratings = sessions.filter(s => s.rating).map(s => s.rating)
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null

      setStats({
        thisWeek: thisWeekMinutes,
        thisMonth: thisMonthMinutes,
        totalSessions: sessions.length,
        averageRating: avgRating,
      })
    }
    setLoading(false)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-accent">This Week</p>
        <p className="text-2xl font-bold text-primary">{formatTime(stats.thisWeek)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-accent">This Month</p>
        <p className="text-2xl font-bold text-primary">{formatTime(stats.thisMonth)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-accent">Total Sessions</p>
        <p className="text-2xl font-bold text-primary">{stats.totalSessions}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-accent">Avg. Rating</p>
        <p className="text-2xl font-bold text-primary">
          {stats.averageRating ? stats.averageRating.toFixed(1) : '-'}
        </p>
      </div>
    </div>
  )
}
