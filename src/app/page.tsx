'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthForm from '@/components/AuthForm'
import PracticeForm from '@/components/PracticeForm'
import PracticeList from '@/components/PracticeList'
import Stats from '@/components/Stats'
import FriendsActivity from '@/components/FriendsActivity'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  const handlePracticeLogged = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-heading mb-2">Piano Practice Tracker</h1>
          <p className="text-accent">Track your progress and reach your musical goals</p>
        </div>
        <AuthForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-heading">Piano Practice Tracker</h1>
            <p className="text-accent">Welcome back!</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm text-accent hover:text-heading"
          >
            Sign Out
          </button>
        </header>

        <div className="space-y-8">
          <Stats refreshTrigger={refreshTrigger} />

          <div className="grid md:grid-cols-2 gap-8">
            <PracticeForm onSuccess={handlePracticeLogged} />
            <PracticeList refreshTrigger={refreshTrigger} />
          </div>

          <FriendsActivity refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </main>
  )
}
