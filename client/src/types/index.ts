// Enums
export type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type RecordType = "INCOME" | "EXPENSE";

// Core Models
export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  companyId: string;
  teamId: string | null;
  team?: Team | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  companyId: string;
  _count?: { users: number; records: number };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRecord {
  id: string;
  amount: number;
  type: RecordType;
  category: string;
  notes: string | null;
  date: string;
  userId: string;
  user?: { id: string; name: string };
  teamId: string;
  team?: { id: string; name: string };
  projectId: string | null;
  project?: { id: string; name: string } | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  totalBudget: number;
  usedAmount: number;
  period: string;
  teamId: string;
  team?: { id: string; name: string };
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Wrappers
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    details?: unknown;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teamId?: string | null;
  };
  company: {
    id: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

// Query Params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface RecordQueryParams extends PaginationParams {
  type?: RecordType;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface BudgetQueryParams extends PaginationParams {
  period?: string;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

// Analytics Response Types
export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
}

export interface TeamAnalytics {
  teamId: string;
  teamName: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface CategoryAnalytics {
  category: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface BudgetVsActual {
  teamId: string;
  teamName: string;
  period: string;
  budgeted: number;
  actual: number;
  remaining: number;
  utilizationPercent: number;
  isOverBudget: boolean;
}

export interface TrendData {
  month: string;
  income: number;
  expense: number;
  net: number;
  incomeChange: number | null;
  expenseChange: number | null;
}

// Create / Update DTOs
export interface CreateRecordDTO {
  amount: number;
  type: RecordType;
  category: string;
  notes?: string;
  date: string;
  teamId: string;
  projectId?: string;
}

export interface UpdateRecordDTO {
  amount?: number;
  type?: RecordType;
  category?: string;
  notes?: string | null;
  date?: string;
  projectId?: string | null;
}

export interface CreateBudgetDTO {
  totalBudget: number;
  period: string;
  teamId: string;
}

export interface UpdateBudgetDTO {
  totalBudget?: number;
}

export interface CreateTeamDTO {
  name: string;
}

export interface UpdateTeamDTO {
  name?: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  teamId?: string;
}

export interface UpdateUserDTO {
  name?: string;
  role?: UserRole;
  teamId?: string | null;
  isActive?: boolean;
}
