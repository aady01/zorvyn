import { Request, Response } from 'express';
import { teamService } from '../services/team.service';
import { ApiResponse } from '../utils/api-response';

export const listTeams = async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const result = await teamService.listTeams(req.user!, { page, limit });
  res.json(ApiResponse.success(result.data, result.meta));
};

export const getTeamById = async (req: Request, res: Response) => {
  const result = await teamService.getTeamById(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};

export const createTeam = async (req: Request, res: Response) => {
  const result = await teamService.createTeam(req.user!, req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const updateTeam = async (req: Request, res: Response) => {
  const result = await teamService.updateTeam(req.user!, req.params.id as string, req.body);
  res.json(ApiResponse.success(result));
};

export const deleteTeam = async (req: Request, res: Response) => {
  const result = await teamService.deleteTeam(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};
