'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PracticeSession } from '@/lib/types'

interface PracticeListProps {
  refreshTrigger?: number
  onUpdate?: () => void
}

export default function PracticeList({ refreshTrigger, onUpdate }: PracticeListProps) {
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSession, setEditingSession] = useState<PracticeSession | null>(null)
  const [editForm, setEditForm] = useState({
    practice_date: '',
    duration_minutes: 0,
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [refreshTrigger])

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('practice_date', { ascending: false })
      .limit(20)

    if (!error && data) {
      setSessions(data)
    }
    setLoading(false)
  }

  const openEdit = (session: PracticeSession) => {
    setEditingSession(session)
    setEditForm({
      practice_date: session.practice_date,
      duration_minutes: session.duration_minutes,
      notes: session.notes || '',
    })
  }

  const closeEdit = () => {
    setEditingSession(null)
  }

  const handleSave = async () => {
    if (!editingSession) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('practice_sessions')
      .update({
        practice_date: editForm.practice_date,
        duration_minutes: editForm.duration_minutes,
        notes: editForm.notes || null,
      })
      .eq('id', editingSession.id)

    setSaving(false)

    if (!error) {
      closeEdit()
      fetchSessions()
      onUpdate?.()
    }
  }

  const handleDelete = async () => {
    if (!editingSession) return
    if (!confirm('Delete this practice session?')) return

    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('id', editingSession.id)

    setSaving(false)

    if (!error) {
      closeEdit()
      fetchSessions()
      onUpdate?.()
    }
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
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <p className="text-accent">No practice sessions yet. Log your first one!</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary">
          <h2 className="text-xl font-semibold text-heading">Recent Practice</h2>
        </div>
        <ul className="divide-y divide-secondary">
          {sessions.map(session => (
            <li
              key={session.id}
              className="px-6 py-4 hover:bg-background cursor-pointer"
              onClick={() => openEdit(session)}
            >
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

      {/* Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-heading">Edit Practice Session</h3>

            <div>
              <label className="block text-sm font-medium text-accent mb-1">Date</label>
              <input
                type="date"
                value={editForm.practice_date}
                onChange={e => setEditForm(prev => ({ ...prev, practice_date: e.target.value }))}
                className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={editForm.duration_minutes}
                onChange={e => setEditForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-accent mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={closeEdit}
                className="py-2 px-4 bg-secondary text-accent rounded-md hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
