'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FriendActivity {
  id: string
  name: string
  practiceDays: boolean[] // 7 days, starting Thursday
}

// Days of week starting Thursday
const DAYS = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed']

export default function FriendsActivity({ refreshTrigger }: { refreshTrigger?: number }) {
  const [friends, setFriends] = useState<FriendActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchFriendsActivity()
  }, [refreshTrigger])

  const getThursdayWeekStart = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 4 = Thursday

    // Calculate days since last Thursday
    // If today is Thursday (4), daysSinceThursday = 0
    // If today is Friday (5), daysSinceThursday = 1
    // If today is Wednesday (3), daysSinceThursday = 6
    // If today is Sunday (0), daysSinceThursday = 3
    let daysSinceThursday = dayOfWeek - 4
    if (daysSinceThursday < 0) daysSinceThursday += 7

    const thursday = new Date(now)
    thursday.setDate(now.getDate() - daysSinceThursday)
    thursday.setHours(0, 0, 0, 0)
    return thursday
  }

  const fetchFriendsActivity = async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')

    if (!profiles) {
      setLoading(false)
      return
    }

    // Get week boundaries (Thursday to Wednesday)
    const weekStart = getThursdayWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    // Get all practice sessions for this week
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('user_id, practice_date')
      .gte('practice_date', weekStart.toISOString().split('T')[0])
      .lt('practice_date', weekEnd.toISOString().split('T')[0])

    // Build activity map
    const activityMap: Record<string, Set<number>> = {}

    sessions?.forEach(session => {
      // Parse date as local time (YYYY-MM-DD from DB is interpreted as UTC by default)
      const [year, month, day] = session.practice_date.split('-').map(Number)
      const sessionDate = new Date(year, month - 1, day)
      // Calculate which day of our Thu-Wed week this is
      const dayDiff = Math.floor((sessionDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))

      if (dayDiff >= 0 && dayDiff < 7) {
        if (!activityMap[session.user_id]) {
          activityMap[session.user_id] = new Set()
        }
        activityMap[session.user_id].add(dayDiff)
      }
    })

    // Build friends list
    const friendsList: FriendActivity[] = profiles.map(profile => ({
      id: profile.id,
      name: profile.full_name || profile.email?.split('@')[0] || 'Anonymous',
      practiceDays: Array(7).fill(false).map((_, i) => activityMap[profile.id]?.has(i) || false)
    }))

    // Sort: current user first, then by most practice days
    friendsList.sort((a, b) => {
      if (a.id === user?.id) return -1
      if (b.id === user?.id) return 1
      const aCount = a.practiceDays.filter(Boolean).length
      const bCount = b.practiceDays.filter(Boolean).length
      return bCount - aCount
    })

    setFriends(friendsList)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary">
        <h2 className="text-xl font-semibold text-heading">Your Friends in the Club</h2>
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Header row with days */}
          <div className="grid grid-cols-8 gap-2 mb-3">
            <div></div>
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-accent">
                {day}
              </div>
            ))}
          </div>

          {/* Friend rows */}
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.id} className="grid grid-cols-8 gap-2 items-center">
                <div className="text-sm text-heading truncate max-w-[80px]">
                  {friend.id === currentUserId ? `${friend.name} (you)` : friend.name}
                </div>
                {friend.practiceDays.map((practiced, i) => (
                  <div key={i} className="flex justify-center">
                    {practiced ? (
                      <span className="text-primary text-lg">★</span>
                    ) : (
                      <span className="text-secondary text-lg">☆</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {friends.length === 0 && (
          <p className="text-center text-accent">No club members yet.</p>
        )}
      </div>
    </div>
  )
}
