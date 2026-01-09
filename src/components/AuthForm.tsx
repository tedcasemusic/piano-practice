'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthFormProps {
  onSuccess?: () => void
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center text-heading mb-6">
        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-accent mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-accent mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-accent mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-accent">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-primary hover:underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('signin')}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}
