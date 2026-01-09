'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PracticeFormData } from '@/lib/types'

const FOCUS_AREAS = [
  'Scales',
  'Technique',
  'Sight-reading',
  'Theory',
  'Repertoire',
  'Ear training',
]

interface PracticeFormProps {
  onSuccess?: () => void
}

export default function PracticeForm({ onSuccess }: PracticeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<PracticeFormData>({
    practice_date: new Date().toISOString().split('T')[0],
    duration_minutes: 30,
    pieces: [],
    notes: '',
    rating: 3,
    focus_areas: [],
  })
  const [pieceInput, setPieceInput] = useState('')

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
        pieces: formData.pieces.length > 0 ? formData.pieces : null,
        notes: formData.notes || null,
        rating: formData.rating,
        focus_areas: formData.focus_areas.length > 0 ? formData.focus_areas : null,
      })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      // Reset form
      setFormData({
        practice_date: new Date().toISOString().split('T')[0],
        duration_minutes: 30,
        pieces: [],
        notes: '',
        rating: 3,
        focus_areas: [],
      })
      setPieceInput('')
      onSuccess?.()
    }
  }

  const addPiece = () => {
    if (pieceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        pieces: [...prev.pieces, pieceInput.trim()]
      }))
      setPieceInput('')
    }
  }

  const removePiece = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pieces: prev.pieces.filter((_, i) => i !== index)
    }))
  }

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-heading">Log Practice Session</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-accent mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.practice_date}
            onChange={e => setFormData(prev => ({ ...prev, practice_date: e.target.value }))}
            className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
          Pieces Practiced
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pieceInput}
            onChange={e => setPieceInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addPiece())}
            placeholder="Add a piece..."
            className="flex-1 px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addPiece}
            className="px-4 py-2 bg-secondary text-accent rounded-md hover:bg-secondary/80"
          >
            Add
          </button>
        </div>
        {formData.pieces.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.pieces.map((piece, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-heading rounded-full text-sm"
              >
                {piece}
                <button
                  type="button"
                  onClick={() => removePiece(index)}
                  className="hover:text-dark"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-accent mb-2">
          Focus Areas
        </label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleFocusArea(area)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                formData.focus_areas.includes(area)
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-accent hover:bg-secondary/80'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-accent mb-1">
          How did it go? (1-5)
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, rating }))}
              className={`w-10 h-10 rounded-full text-lg transition-colors ${
                formData.rating === rating
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-accent hover:bg-secondary/80'
              }`}
            >
              {rating}
            </button>
          ))}
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
  )
}
