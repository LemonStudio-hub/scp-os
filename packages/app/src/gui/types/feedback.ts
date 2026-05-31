export type FeedbackVote = 'up' | 'down'

export interface Comment {
  id: number
  feedback_id: number
  user_id: string
  nickname: string
  content: string
  created_at: string
  updated_at: string
}

export interface FeedbackItem {
  id: number
  user_id: string
  nickname: string
  title: string
  content: string
  category: string
  status: string
  created_at: string
  updated_at: string
  upvotes: number
  downvotes: number
  commentsCount: number
  userVote?: FeedbackVote | null
  showComments: boolean
  comments: Comment[]
}

export interface FeedbackForm {
  title: string
  content: string
  category: string
}
