import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/api-response';

const getRange = (req: Request) => ({
  startDate: req.query.startDate as string | undefined,
  endDate: req.query.endDate as string | undefined,
});

export const getSummary = async (req: Request, res: Response) => {
  const result = await analyticsService.getSummary(req.user!, getRange(req));
  res.json(ApiResponse.success(result));
};

export const getByTeam = async (req: Request, res: Response) => {
  const result = await analyticsService.getByTeam(req.user!, getRange(req));
  res.json(ApiResponse.success(result));
};

export const getByCategory = async (req: Request, res: Response) => {
  const result = await analyticsService.getByCategory(req.user!, getRange(req));
  res.json(ApiResponse.success(result));
};

export const getBudgetVsActual = async (req: Request, res: Response) => {
  const result = await analyticsService.getBudgetVsActual(req.user!, getRange(req));
  res.json(ApiResponse.success(result));
};

export const getTrends = async (req: Request, res: Response) => {
  const result = await analyticsService.getTrends(req.user!, getRange(req));
  res.json(ApiResponse.success(result));
};
