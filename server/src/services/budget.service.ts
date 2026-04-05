import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { scopeBudgetQuery } from "../utils/scope-query";
import { getOffsetPagination, buildPaginatedMeta } from "../utils/pagination";

export class BudgetService {
  async listBudgets(
    user: AuthUser,
    query: { page?: number; limit?: number; period?: string },
  ) {
    const where: Record<string, unknown> = { ...scopeBudgetQuery(user) };
    if (query.period) where.period = query.period;

    const { skip, take, page, limit } = getOffsetPagination({
      page: query.page || 1,
      limit: query.limit || 20,
    });

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where: where as any,
        skip,
        take,
        orderBy: { period: "desc" },
        include: { team: { select: { id: true, name: true } } },
      }),
      prisma.budget.count({ where: where as any }),
    ]);

    const data = budgets.map((b: any) => ({
      ...b,
      remainingAmount: b.totalBudget - b.usedAmount,
      utilizationPercent:
        b.totalBudget > 0
          ? Math.round((b.usedAmount / b.totalBudget) * 10000) / 100
          : 0,
    }));

    return { data, meta: buildPaginatedMeta(total, page, limit) };
  }

  async createBudget(
    user: AuthUser,
    data: { totalBudget: number; period: string; teamId: string },
  ) {
    const team = await prisma.team.findFirst({
      where: { id: data.teamId, companyId: user.companyId },
    });
    if (!team) throw AppError.badRequest("Team not found in your company");

    if (user.role === "MANAGER" && data.teamId !== user.teamId) {
      throw AppError.forbidden(
        "Managers can only create budgets for their own team",
      );
    }

    const existing = await prisma.budget.findUnique({
      where: { teamId_period: { teamId: data.teamId, period: data.period } },
    });
    if (existing)
      throw AppError.conflict("Budget already exists for this team and period");

    return prisma.budget.create({
      data: {
        totalBudget: data.totalBudget,
        period: data.period,
        teamId: data.teamId,
        companyId: user.companyId,
      },
      include: { team: { select: { id: true, name: true } } },
    });
  }

  async updateBudget(
    user: AuthUser,
    id: string,
    data: { totalBudget?: number },
  ) {
    const existing = await prisma.budget.findFirst({
      where: { ...scopeBudgetQuery(user), id } as any,
    });
    if (!existing) throw AppError.notFound("Budget not found");

    return prisma.budget.update({
      where: { id },
      data,
      include: { team: { select: { id: true, name: true } } },
    });
  }
}

export const budgetService = new BudgetService();
