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
  userVote?: 'up' | 'down' | null
  showComments: boolean
  comments: CommentItem[]
}

export interface CommentItem {
  id: number
  feedback_id: number
  user_id: string
  nickname: string
  content: string
  created_at: string
  updated_at: string
}

export interface FeedbackForm {
  title: string
  content: string
  category: string
}

export interface FeedbackCategory {
  id: string
  label: string
  icon: string
}

export interface FeedbackTab {
  id: string
  label: string
}
