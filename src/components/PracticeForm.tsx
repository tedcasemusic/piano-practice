'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PracticeTimer from './PracticeTimer'

interface PracticeFormProps {
  onSuccess?: () => void
}

export default function PracticeForm({ onSuccess }: PracticeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTimer, setShowTimer] = useState(false)
  const [formData, setFormData] = useState({
    practice_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to log practice')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        practice_date: formData.practice_date,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || null,
      })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      // Reset form
      setFormData({
        practice_date: new Date().toISOString().split('T')[0],
        duration_minutes: 30,
        notes: '',
      })
      onSuccess?.()
    }
  }

  const handleTimerComplete = (minutes: number) => {
    setShowTimer(false)
    setFormData(prev => ({
      ...prev,
      practice_date: new Date().toISOString().split('T')[0],
      duration_minutes: minutes,
    }))
  }

  const handleTimerCancel = () => {
    setShowTimer(false)
  }

  return (
    <>
      {showTimer && (
        <PracticeTimer
          onComplete={handleTimerComplete}
          onCancel={handleTimerCancel}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-heading">Log Practice Session</h2>
          <button
            type="button"
            onClick={() => setShowTimer(true)}
            className="px-4 py-2 bg-heading text-white rounded-md hover:bg-dark text-sm"
          >
            Start Timer
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-accent mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.practice_date}
              onChange={e => setFormData(prev => ({ ...prev, practice_date: e.target.value }))}
              className="w-full min-w-0 px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-accent mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={e => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-accent mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="What did you work on? Any breakthroughs or challenges?"
            rows={3}
            className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Log Practice'}
        </button>
      </form>
    </>
  )
}
