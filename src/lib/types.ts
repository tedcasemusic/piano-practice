export type Role = 'teacher' | 'student'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  teacher_id: string | null
  created_at: string
}

export interface PracticeSession {
  id: string
  user_id: string
  practice_date: string
  duration_minutes: number
  pieces: string[] | null
  notes: string | null
  rating: number | null
  focus_areas: string[] | null
  created_at: string
}

export interface Goal {
  id: string
  student_id: string
  created_by: string
  title: string
  description: string | null
  target_minutes_per_week: number | null
  due_date: string | null
  completed: boolean
  created_at: string
}

export interface PracticeFormData {
  practice_date: string
  duration_minutes: number
  pieces: string[]
  notes: string
  rating: number
  focus_areas: string[]
}
