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
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-heading">
                    {formatDate(session.practice_date)}
                  </span>
                  <span className="text-primary font-semibold">
                    {formatDuration(session.duration_minutes)}
                  </span>
                  {session.rating && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-heading">
                      {session.rating}/5
                    </span>
                  )}
                </div>

                {session.pieces && session.pieces.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {session.pieces.map((piece, i) => (
                      <span key={i} className="text-sm text-accent">
                        {piece}{i < session.pieces!.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {session.focus_areas && session.focus_areas.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {session.focus_areas.map((area, i) => (
                      <span
                        key={i}
                        className="inline-flex px-2 py-0.5 rounded-full text-xs bg-secondary text-accent"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}

                {session.notes && (
                  <p className="mt-2 text-sm text-accent">{session.notes}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
