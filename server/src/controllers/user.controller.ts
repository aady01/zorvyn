import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../utils/api-response';

export const listUsers = async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const result = await userService.listUsers(req.user!, { page, limit });
  res.json(ApiResponse.success(result.data, result.meta));
};

export const getUserById = async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};

export const createUser = async (req: Request, res: Response) => {
  const result = await userService.createUser(req.user!, req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const updateUser = async (req: Request, res: Response) => {
  const result = await userService.updateUser(req.user!, req.params.id as string, req.body);
  res.json(ApiResponse.success(result));
};

export const deleteUser = async (req: Request, res: Response) => {
  const result = await userService.deleteUser(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};
