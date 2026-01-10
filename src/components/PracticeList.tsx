'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PracticeSession } from '@/lib/types'

interface PracticeListProps {
  refreshTrigger?: number
}

export default function PracticeList({ refreshTrigger }: PracticeListProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [refreshTrigger])

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .order('practice_date', { ascending: false })
      .limit(20)

    if (!error && data) {
      setSessions(data)
    }
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-gray-500">No practice sessions yet. Log your first one!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary">
        <h2 className="text-xl font-semibold text-heading">Recent Practice</h2>
      </div>
      <ul className="divide-y divide-secondary">
        {sessions.map(session => (
          <li key={session.id} className="px-6 py-4 hover:bg-background">
            <div className="flex items-center gap-3">
              <span className="font-medium text-heading">
                {formatDate(session.practice_date)}
              </span>
              <span className="text-primary font-semibold">
                {formatDuration(session.duration_minutes)}
              </span>
            </div>
            {session.notes && (
              <p className="mt-2 text-sm text-accent">{session.notes}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
