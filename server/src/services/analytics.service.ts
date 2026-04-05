import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { scopeQuery } from "../utils/scope-query";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

function buildDateFilter(range: DateRange) {
  if (!range.startDate && !range.endDate) return {};
  return {
    date: {
      ...(range.startDate ? { gte: new Date(range.startDate) } : {}),
      ...(range.endDate ? { lte: new Date(range.endDate) } : {}),
    },
  };
}

export class AnalyticsService {
  /** Total income, expense, and net for a period */
  async getSummary(user: AuthUser, range: DateRange) {
    const where = { ...scopeQuery(user), ...buildDateFilter(range) } as any;

    const [income, expense] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...where, type: "INCOME" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      incomeCount: income._count,
      expenseCount: expense._count,
    };
  }

  /** Spending breakdown per team */
  async getByTeam(user: AuthUser, range: DateRange) {
    const where = { ...scopeQuery(user), ...buildDateFilter(range) } as any;

    const results = await prisma.financialRecord.groupBy({
      by: ["teamId", "type"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get team names
    const teamIds = [...new Set(results.map((r: any) => r.teamId as string))];
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true },
    });
    const teamMap = new Map(
      teams.map((t: any) => [t.id as string, t.name as string]),
    );

    // Group by team
    const grouped: Record<
      string,
      {
        teamId: string;
        teamName: string;
        income: number;
        expense: number;
        net: number;
        count: number;
      }
    > = {};

    for (const r of results as any[]) {
      const tid: string = r.teamId;
      if (!grouped[tid]) {
        grouped[tid] = {
          teamId: tid,
          teamName: teamMap.get(tid) || "Unknown",
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        };
      }
      const amount: number = r._sum?.amount || 0;
      if (r.type === "INCOME") grouped[tid].income = amount;
      else grouped[tid].expense = amount;
      grouped[tid].count += r._count;
    }

    return Object.values(grouped).map((g) => ({
      ...g,
      net: g.income - g.expense,
    }));
  }

  /** Spending breakdown per category */
  async getByCategory(user: AuthUser, range: DateRange) {
    const where = { ...scopeQuery(user), ...buildDateFilter(range) } as any;

    const results = await prisma.financialRecord.groupBy({
      by: ["category", "type"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const grouped: Record<
      string,
      {
        category: string;
        income: number;
        expense: number;
        net: number;
        count: number;
      }
    > = {};

    for (const r of results) {
      if (!grouped[r.category]) {
        grouped[r.category] = {
          category: r.category,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        };
      }
      const amount = r._sum.amount || 0;
      if (r.type === "INCOME") grouped[r.category].income = amount;
      else grouped[r.category].expense = amount;
      grouped[r.category].count += r._count;
    }

    return Object.values(grouped).map((g) => ({
      ...g,
      net: g.income - g.expense,
    }));
  }

  /** Budget vs actual spending per team for a period */
  async getBudgetVsActual(
    user: AuthUser,
    range: DateRange & { period?: string },
  ) {
    const baseWhere = { ...scopeQuery(user), ...buildDateFilter(range) } as any;

    // Get budgets (scoped)
    const budgetWhere: Record<string, unknown> = { companyId: user.companyId };
    if (user.role === "MANAGER") budgetWhere.teamId = user.teamId;
    if (range.startDate) {
      const period = range.startDate.slice(0, 7);
      budgetWhere.period = period;
    }

    const budgets = await prisma.budget.findMany({
      where: budgetWhere as any,
      include: { team: { select: { id: true, name: true } } },
    });

    // Get actual spending per team
    const actuals = await prisma.financialRecord.groupBy({
      by: ["teamId"],
      where: { ...baseWhere, type: "EXPENSE" },
      _sum: { amount: true },
    });

    const actualMap = new Map(
      (actuals as any[]).map((a: any) => [
        a.teamId as string,
        (a._sum?.amount || 0) as number,
      ]),
    );

    return (budgets as any[]).map((b: any) => {
      const actual = actualMap.get(b.teamId) || b.usedAmount;
      return {
        teamId: b.teamId,
        teamName: b.team.name,
        period: b.period,
        budgeted: b.totalBudget,
        actual,
        remaining: b.totalBudget - actual,
        utilizationPercent:
          b.totalBudget > 0
            ? Math.round((actual / b.totalBudget) * 10000) / 100
            : 0,
        isOverBudget: actual > b.totalBudget,
      };
    });
  }

  /** Month-over-month income/expense trends */
  async getTrends(user: AuthUser, range: DateRange) {
    const where = { ...scopeQuery(user), ...buildDateFilter(range) } as any;

    const records = await prisma.financialRecord.findMany({
      where,
      select: { amount: true, type: true, date: true },
      orderBy: { date: "asc" },
    });

    // Group by month
    const monthly: Record<
      string,
      { month: string; income: number; expense: number; net: number }
    > = {};

    for (const r of records) {
      const month = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[month])
        monthly[month] = { month, income: 0, expense: 0, net: 0 };
      if (r.type === "INCOME") monthly[month].income += r.amount;
      else monthly[month].expense += r.amount;
    }

    const result = Object.values(monthly)
      .map((m) => ({ ...m, net: m.income - m.expense }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Add month-over-month change
    return result.map((item, i) => ({
      ...item,
      incomeChange:
        i > 0 && result[i - 1].income > 0
          ? Math.round(
              ((item.income - result[i - 1].income) / result[i - 1].income) *
                10000,
            ) / 100
          : null,
      expenseChange:
        i > 0 && result[i - 1].expense > 0
          ? Math.round(
              ((item.expense - result[i - 1].expense) / result[i - 1].expense) *
                10000,
            ) / 100
          : null,
    }));
  }
}

export const analyticsService = new AnalyticsService();
