export interface User {
  id: string
  email: string
  total_money: string
}

export interface UserSummary {
  total_money: number
  total_earned: number
  total_debt: number
  goals_completed: number
  goals_active: number
}
