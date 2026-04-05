import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";
import { getOffsetPagination, buildPaginatedMeta } from "../utils/pagination";

export class ProjectService {
  async listProjects(user: AuthUser, query: { page?: number; limit?: number }) {
    const where = { companyId: user.companyId };
    const { skip, take, page, limit } = getOffsetPagination({
      page: query.page || 1,
      limit: query.limit || 20,
    });

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { records: true } } },
      }),
      prisma.project.count({ where }),
    ]);

    return { data: projects, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getProjectById(user: AuthUser, id: string) {
    const project = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
      include: { _count: { select: { records: true } } },
    });
    if (!project) throw AppError.notFound("Project not found");
    return project;
  }

  async createProject(user: AuthUser, data: { name: string }) {
    return prisma.project.create({
      data: { ...data, companyId: user.companyId },
    });
  }

  async updateProject(user: AuthUser, id: string, data: { name?: string }) {
    const existing = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw AppError.notFound("Project not found");
    return prisma.project.update({ where: { id }, data });
  }

  async deleteProject(user: AuthUser, id: string) {
    const existing = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!existing) throw AppError.notFound("Project not found");
    return prisma.project.delete({ where: { id } });
  }
}

export const projectService = new ProjectService();
