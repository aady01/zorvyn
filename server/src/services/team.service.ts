import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { scopeTeamQuery } from "../utils/scope-query";
import { getOffsetPagination, buildPaginatedMeta } from "../utils/pagination";

export class TeamService {
  async listTeams(user: AuthUser, query: { page?: number; limit?: number }) {
    const where = scopeTeamQuery(user);
    const { skip, take, page, limit } = getOffsetPagination({
      page: query.page || 1,
      limit: query.limit || 20,
    });

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { users: true, records: true } } },
      }),
      prisma.team.count({ where }),
    ]);

    return { data: teams, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getTeamById(user: AuthUser, id: string) {
    const team = await prisma.team.findFirst({
      where: { ...scopeTeamQuery(user), id },
      include: { _count: { select: { users: true, records: true } } },
    });
    if (!team) throw AppError.notFound("Team not found");
    return team;
  }

  async createTeam(user: AuthUser, data: { name: string }) {
    return prisma.team.create({ data: { ...data, companyId: user.companyId } });
  }

  async updateTeam(user: AuthUser, id: string, data: { name?: string }) {
    const existing = await prisma.team.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw AppError.notFound("Team not found");
    return prisma.team.update({ where: { id }, data });
  }

  async deleteTeam(user: AuthUser, id: string) {
    const existing = await prisma.team.findFirst({
      where: { id, companyId: user.companyId },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) throw AppError.notFound("Team not found");
    if (existing._count.users > 0)
      throw AppError.badRequest(
        "Cannot delete a team that has members. Reassign members first.",
      );
    return prisma.team.delete({ where: { id } });
  }
}

export const teamService = new TeamService();
