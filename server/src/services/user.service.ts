import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { scopeUserQuery } from "../utils/scope-query";
import { getOffsetPagination, buildPaginatedMeta } from "../utils/pagination";

const SALT_ROUNDS = 12;
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  teamId: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, name: true } },
};

export class UserService {
  async listUsers(user: AuthUser, query: { page?: number; limit?: number }) {
    const where = scopeUserQuery(user);
    const { skip, take, page, limit } = getOffsetPagination({
      page: query.page || 1,
      limit: query.limit || 20,
    });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getUserById(user: AuthUser, id: string) {
    const where = { ...scopeUserQuery(user), id };
    const found = await prisma.user.findFirst({ where, select: userSelect });
    if (!found) throw AppError.notFound("User not found");
    return found;
  }

  async createUser(
    user: AuthUser,
    data: {
      email: string;
      password: string;
      name: string;
      role: "EMPLOYEE" | "MANAGER" | "ADMIN";
      teamId?: string;
    },
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw AppError.conflict("Email already registered");

    if (data.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: data.teamId, companyId: user.companyId },
      });
      if (!team) throw AppError.badRequest("Team not found in your company");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const created = await prisma.user.create({
      data: { ...data, password: hashedPassword, companyId: user.companyId },
      select: userSelect,
    });
    return created;
  }

  async updateUser(
    user: AuthUser,
    id: string,
    data: {
      name?: string;
      role?: "EMPLOYEE" | "MANAGER" | "ADMIN";
      teamId?: string | null;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw AppError.notFound("User not found");

    if (data.teamId) {
      const team = await prisma.team.findFirst({
        where: { id: data.teamId, companyId: user.companyId },
      });
      if (!team) throw AppError.badRequest("Team not found in your company");
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    return updated;
  }

  async deleteUser(user: AuthUser, id: string) {
    const existing = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw AppError.notFound("User not found");
    if (existing.id === user.userId)
      throw AppError.badRequest("Cannot delete yourself");

    const deleted = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });
    return deleted;
  }
}

export const userService = new UserService();
