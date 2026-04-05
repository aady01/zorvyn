import { Request, Response } from 'express';
import { companyService } from '../services/company.service';
import { ApiResponse } from '../utils/api-response';

export const getMyCompany = async (req: Request, res: Response) => {
  const result = await companyService.getMyCompany(req.user!);
  res.json(ApiResponse.success(result));
};

export const updateMyCompany = async (req: Request, res: Response) => {
  const result = await companyService.updateMyCompany(req.user!, req.body);
  res.json(ApiResponse.success(result));
};
