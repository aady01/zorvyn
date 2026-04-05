import { Request, Response } from 'express';
import { financialRecordService } from '../services/financial-record.service';
import { ApiResponse } from '../utils/api-response';

export const listRecords = async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    type: req.query.type as string | undefined,
    category: req.query.category as string | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
  };
  const result = await financialRecordService.listRecords(req.user!, query);
  res.json(ApiResponse.success(result.data, result.meta));
};

export const getRecordById = async (req: Request, res: Response) => {
  const result = await financialRecordService.getRecordById(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};

export const createRecord = async (req: Request, res: Response) => {
  const result = await financialRecordService.createRecord(req.user!, req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const updateRecord = async (req: Request, res: Response) => {
  const result = await financialRecordService.updateRecord(req.user!, req.params.id as string, req.body);
  res.json(ApiResponse.success(result));
};

export const deleteRecord = async (req: Request, res: Response) => {
  const result = await financialRecordService.deleteRecord(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};
