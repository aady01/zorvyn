import { Request, Response } from 'express';
import { budgetService } from '../services/budget.service';
import { ApiResponse } from '../utils/api-response';

export const listBudgets = async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    period: req.query.period as string | undefined,
  };
  const result = await budgetService.listBudgets(req.user!, query);
  res.json(ApiResponse.success(result.data, result.meta));
};

export const createBudget = async (req: Request, res: Response) => {
  const result = await budgetService.createBudget(req.user!, req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const updateBudget = async (req: Request, res: Response) => {
  const result = await budgetService.updateBudget(req.user!, req.params.id as string, req.body);
  res.json(ApiResponse.success(result));
};
