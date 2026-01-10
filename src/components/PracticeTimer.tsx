'use client'

import { useState, useEffect, useCallback } from 'react'

interface PracticeTimerProps {
  onComplete: (minutes: number) => void
  onCancel: () => void
}

export default function PracticeTimer({ onComplete, onCancel }: PracticeTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleStop = () => {
    const minutes = Math.max(1, Math.round(seconds / 60))
    onComplete(minutes)
  }

  const togglePause = () => {
    setIsRunning(prev => !prev)
  }

  return (
    <div className="fixed inset-0 bg-dark flex flex-col items-center justify-center z-50">
      {/* Timer display */}
      <div className="text-white text-center mb-16">
        <p className="text-xl text-white/60 mb-4">Practice in progress</p>
        <p className="text-8xl md:text-9xl font-light tracking-tight font-mono">
          {formatTime(seconds)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-6">
        <button
          onClick={togglePause}
          className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        >
          {isRunning ? (
            <span className="flex gap-1">
              <span className="w-2 h-8 bg-white rounded-sm"></span>
              <span className="w-2 h-8 bg-white rounded-sm"></span>
            </span>
          ) : (
            <span className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></span>
          )}
        </button>
        <button
          onClick={handleStop}
          className="px-8 py-4 rounded-full bg-primary hover:bg-primary-hover text-white text-xl font-medium transition-colors"
        >
          Finish
        </button>
      </div>

      {/* Cancel option */}
      <button
        onClick={onCancel}
        className="absolute bottom-8 text-white/40 hover:text-white/60 text-sm"
      >
        Cancel without saving
      </button>
    </div>
  )
}
