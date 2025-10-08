export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  created_at: string
}

export interface Room {
  id: number
  name: string
  secret: string
  created_by: number
  created_at: string
  member_count?: number
  members?: User[]
}

export interface BillItem {
  id?: number
  bill_id?: number
  description: string
  quantity: number
  unit_price: number
  amount: number
  shared_by: number[]
  created_at?: string
}

export interface Bill {
  id: number
  room_id: number
  uploaded_by: number
  image_url: string
  total_amount: number
  created_at: string
  items: BillItem[]
}

export interface ParsedBillItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface ParsedBill {
  items: ParsedBillItem[]
  total_amount: number
  merchant_name?: string
  date?: string
}

export interface DebtTransaction {
  from_user_id: number
  from_user_name: string
  to_user_id: number
  to_user_name: string
  amount: number
}

export interface UserBalance {
  user_id: number
  user_name: string
  total_paid: number
  total_owed: number
  net_balance: number
}

export interface RoomSummary {
  room_id: number
  room_name: string
  total_expenses: number
  transactions: DebtTransaction[]
  balances: UserBalance[]
}
