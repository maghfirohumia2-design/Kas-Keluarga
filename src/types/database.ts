export type UserRole = "super_admin" | "member";

export type TransactionType = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  description?: string | null;
  initial_balance: number;
  budget_limit: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string | null;
  receipt_url?: string | null;
  user_name?: string | null;
  is_transfer?: boolean | null;
  linked_tx_id?: string | null;
  created_at: string;
  accounts?: {
    name: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  bg_class: string;
  text_class: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  points: number;
  avatar_url?: string | null;
  created_at?: string;
}

export interface FamilyGoal {
  id: string;
  title: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  created_at?: string;
}

export interface Reward {
  id: string;
  title: string;
  icon: string;
  points_cost: number;
  created_at?: string;
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: ClaimStatus;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
  rewards?: {
    title: string;
    icon?: string;
    points_cost?: number;
  } | null;
}

export interface AdminUser {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;
  points: number;
  createdAt?: string;
}
