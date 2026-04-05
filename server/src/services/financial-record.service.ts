import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { scopeQuery } from "../utils/scope-query";
import { getOffsetPagination, buildPaginatedMeta } from "../utils/pagination";

function getPeriodFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export class FinancialRecordService {
  async listRecords(
    user: AuthUser,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: Record<string, unknown> = { ...scopeQuery(user) };

    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const { skip, take, page, limit } = getOffsetPagination({
      page: query.page || 1,
      limit: query.limit || 20,
    });

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where: where as any,
        skip,
        take,
        orderBy: { date: "desc" },
        include: {
          team: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.financialRecord.count({ where: where as any }),
    ]);

    return { data: records, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getRecordById(user: AuthUser, id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { ...scopeQuery(user), id } as any,
      include: {
        team: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
    if (!record) throw AppError.notFound("Financial record not found");
    return record;
  }

  async createRecord(
    user: AuthUser,
    data: {
      amount: number;
      type: "INCOME" | "EXPENSE";
      category: string;
      notes?: string;
      date: string;
      teamId: string;
      projectId?: string;
    },
  ) {
    // Validate team belongs to user's company
    const team = await prisma.team.findFirst({
      where: { id: data.teamId, companyId: user.companyId },
    });
    if (!team) throw AppError.badRequest("Team not found in your company");

    // EMPLOYEE can only create for their own team
    if (user.role === "EMPLOYEE" && data.teamId !== user.teamId) {
      throw AppError.forbidden("You can only create records for your own team");
    }
    // MANAGER can only create for their team
    if (user.role === "MANAGER" && data.teamId !== user.teamId) {
      throw AppError.forbidden("You can only create records for your team");
    }

    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, companyId: user.companyId },
      });
      if (!project)
        throw AppError.badRequest("Project not found in your company");
    }

    const recordDate = new Date(data.date);
    const record = await prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        notes: data.notes,
        date: recordDate,
        userId: user.userId,
        teamId: data.teamId,
        projectId: data.projectId,
        companyId: user.companyId,
      },
      include: {
        team: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Auto-update budget usedAmount for EXPENSE records
    if (data.type === "EXPENSE") {
      await this.updateBudgetUsedAmount(
        data.teamId,
        getPeriodFromDate(recordDate),
        data.amount,
      );
    }

    return record;
  }

  async updateRecord(
    user: AuthUser,
    id: string,
    data: {
      amount?: number;
      type?: "INCOME" | "EXPENSE";
      category?: string;
      notes?: string | null;
      date?: string;
      projectId?: string | null;
    },
  ) {
    const existing = await prisma.financialRecord.findFirst({
      where: { ...scopeQuery(user), id } as any,
    });
    if (!existing) throw AppError.notFound("Financial record not found");

    // If changing amount or type on an expense, reverse old budget effect
    if (existing.type === "EXPENSE") {
      await this.updateBudgetUsedAmount(
        existing.teamId,
        getPeriodFromDate(existing.date),
        -existing.amount,
      );
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    const updated = await prisma.financialRecord.update({
      where: { id },
      data: updateData as any,
      include: {
        team: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Apply new budget effect if expense
    const newType = data.type || existing.type;
    if (newType === "EXPENSE") {
      const newAmount = data.amount || existing.amount;
      const newDate = data.date ? new Date(data.date) : existing.date;
      await this.updateBudgetUsedAmount(
        existing.teamId,
        getPeriodFromDate(newDate),
        newAmount,
      );
    }

    return updated;
  }

  async deleteRecord(user: AuthUser, id: string) {
    const existing = await prisma.financialRecord.findFirst({
      where: { ...scopeQuery(user), id } as any,
    });
    if (!existing) throw AppError.notFound("Financial record not found");

    // Reverse budget effect for EXPENSE
    if (existing.type === "EXPENSE") {
      await this.updateBudgetUsedAmount(
        existing.teamId,
        getPeriodFromDate(existing.date),
        -existing.amount,
      );
    }

    await prisma.financialRecord.delete({ where: { id } });
    return { message: "Financial record deleted successfully" };
  }

  private async updateBudgetUsedAmount(
    teamId: string,
    period: string,
    amountDelta: number,
  ) {
    const budget = await prisma.budget.findUnique({
      where: { teamId_period: { teamId, period } },
    });
    if (budget) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { usedAmount: Math.max(0, budget.usedAmount + amountDelta) },
      });
    }
  }
}

export const financialRecordService = new FinancialRecordService();
