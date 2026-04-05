export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface AuthUser {
  userId: string;
  companyId: string;
  role: UserRole;
  teamId: string | null;
}

export interface JwtPayload {
  userId: string;
  companyId: string;
  role: UserRole;
  teamId: string | null;
}

export interface JwtRefreshPayload {
  userId: string;
}
