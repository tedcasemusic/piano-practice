'use client'

interface PerfectWeekStarProps {
  practiceDays: boolean[]
}

export default function PerfectWeekStar({ practiceDays }: PerfectWeekStarProps) {
  const isPerfectWeek = practiceDays.length === 7 && practiceDays.every(day => day)
  const daysCompleted = practiceDays.filter(Boolean).length

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex flex-col items-center">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className={`transition-all duration-500 ${
            isPerfectWeek
              ? 'animate-[star-fill_0.6s_ease-out]'
              : ''
          }`}
          style={isPerfectWeek ? { animation: 'star-shimmer 3s ease-in-out infinite' } : {}}
        >
          <defs>
            <linearGradient id="goldOmbre" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-dark)" />
              <stop offset="30%" stopColor="var(--gold)" />
              <stop offset="50%" stopColor="var(--gold-light)" />
              <stop offset="70%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold-dark)" />
            </linearGradient>
            <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>
          <path
            d="M60 10 L72 42 L106 42 L79 62 L88 95 L60 76 L32 95 L41 62 L14 42 L48 42 Z"
            fill={isPerfectWeek ? 'url(#goldOmbre)' : 'none'}
            stroke={isPerfectWeek ? 'var(--gold-dark)' : 'var(--secondary)'}
            strokeWidth={isPerfectWeek ? '2' : '3'}
            strokeLinejoin="round"
          />
        </svg>

        <h3 className="mt-4 text-lg font-semibold text-heading">
          Perfect Week Star
        </h3>

        <p className={`mt-1 text-sm ${isPerfectWeek ? 'text-gold-dark font-medium' : 'text-accent'}`}>
          {isPerfectWeek
            ? 'You did it! Every day this week!'
            : `${daysCompleted}/7 days practiced this week`
          }
        </p>
      </div>
    </div>
  )
}
