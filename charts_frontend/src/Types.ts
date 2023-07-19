export interface QuestionResponse {
  questions: Question[]
  next_url: string
}

export interface Question {
  id: string
  title: string
  url: string
  votes: number
  answers: number
  views: number
  datetime: string
  user: User
  tags: [string]
}

export interface User {
  id: string
  user: string
  user_url: string
  user_reputation: number
}

export interface ChartProps {
  questions: Question[],
  width: number,
  height: number
}