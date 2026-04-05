import { AuthUser } from '../types/auth';

/**
 * Builds a Prisma `where` clause for FinancialRecord queries based on user role.
 * ADMIN  → all records in company
 * MANAGER → records in their team
 * EMPLOYEE → only their own records
 */
export function scopeQuery(user: AuthUser): Record<string, unknown> {
  const base: Record<string, unknown> = { companyId: user.companyId };
  switch (user.role) {
    case 'ADMIN':
      return base;
    case 'MANAGER':
      return { ...base, teamId: user.teamId };
    case 'EMPLOYEE':
      return { ...base, userId: user.userId };
    default:
      return { ...base, userId: user.userId };
  }
}

/** Scope for User queries. ADMIN→company, MANAGER→team, EMPLOYEE→self */
export function scopeUserQuery(user: AuthUser): Record<string, unknown> {
  const base: Record<string, unknown> = { companyId: user.companyId };
  switch (user.role) {
    case 'ADMIN':
      return base;
    case 'MANAGER':
      return { ...base, teamId: user.teamId };
    case 'EMPLOYEE':
      return { ...base, id: user.userId };
    default:
      return { ...base, id: user.userId };
  }
}

/** Scope for Team queries. ADMIN→all company teams, others→own team */
export function scopeTeamQuery(user: AuthUser): Record<string, unknown> {
  const base: Record<string, unknown> = { companyId: user.companyId };
  switch (user.role) {
    case 'ADMIN':
      return base;
    case 'MANAGER':
    case 'EMPLOYEE':
      return user.teamId ? { ...base, id: user.teamId } : base;
    default:
      return base;
  }
}

/** Scope for Budget queries. ADMIN→company, MANAGER→own team */
export function scopeBudgetQuery(user: AuthUser): Record<string, unknown> {
  const base: Record<string, unknown> = { companyId: user.companyId };
  switch (user.role) {
    case 'ADMIN':
      return base;
    case 'MANAGER':
      return { ...base, teamId: user.teamId };
    default:
      return base;
  }
}
