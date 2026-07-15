export interface ChatMessage {
  id?: number
  tempId?: string
  user_id: string
  username: string
  content: string
  created_at: string
  isSelf: boolean
  sending?: boolean
  error?: string
  room_id?: number
  retryCount?: number
  edited?: boolean
}

export interface ChatRoom {
  id: number
  name: string
  description: string
  message_count: number
  created_by: string
  is_public: number
  member_count?: number
  last_message?: string
  last_message_sender?: string
  last_message_time?: string
}
