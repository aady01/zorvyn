import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/api-response';

export const register = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(ApiResponse.success(result));
};

export const refresh = async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  res.json(ApiResponse.success(result));
};
