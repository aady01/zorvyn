import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/app-error";
import { JwtPayload } from "../types/auth";

const SALT_ROUNDS = 12;

export class AuthService {
  async register(data: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({
        data: { name: data.companyName },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: "ADMIN",
          companyId: company.id,
        },
      });

      return { company, user };
    });

    const tokens = await this.generateTokens({
      userId: result.user.id,
      companyId: result.company.id,
      role: result.user.role,
      teamId: result.user.teamId,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
      },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const tokens = await this.generateTokens({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      teamId: user.teamId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { company: true } } },
    });

    if (!storedToken) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw AppError.unauthorized("Refresh token expired");
    }

    // Token rotation: delete old, issue new pair
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const tokens = await this.generateTokens({
      userId: storedToken.user.id,
      companyId: storedToken.user.companyId,
      role: storedToken.user.role,
      teamId: storedToken.user.teamId,
    });

    return {
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role,
      },
      ...tokens,
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign({ ...payload }, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshTokenValue = jwt.sign(
      { userId: payload.userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY as any },
    );

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: payload.userId,
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }
}

export const authService = new AuthService();
