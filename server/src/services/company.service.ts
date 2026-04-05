import { prisma } from "../config/prisma";
import { AuthUser } from "../types/auth";
import { AppError } from "../utils/app-error";

export class CompanyService {
  async getMyCompany(user: AuthUser) {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        _count: { select: { users: true, teams: true, projects: true } },
      },
    });

    if (!company) throw AppError.notFound("Company not found");
    return company;
  }

  async updateMyCompany(
    user: AuthUser,
    data: { name?: string; industry?: string },
  ) {
    const company = await prisma.company.update({
      where: { id: user.companyId },
      data,
    });
    return company;
  }
}

export const companyService = new CompanyService();
