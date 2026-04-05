import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { ApiResponse } from '../utils/api-response';

export const listProjects = async (req: Request, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const result = await projectService.listProjects(req.user!, { page, limit });
  res.json(ApiResponse.success(result.data, result.meta));
};

export const getProjectById = async (req: Request, res: Response) => {
  const result = await projectService.getProjectById(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};

export const createProject = async (req: Request, res: Response) => {
  const result = await projectService.createProject(req.user!, req.body);
  res.status(201).json(ApiResponse.success(result));
};

export const updateProject = async (req: Request, res: Response) => {
  const result = await projectService.updateProject(req.user!, req.params.id as string, req.body);
  res.json(ApiResponse.success(result));
};

export const deleteProject = async (req: Request, res: Response) => {
  const result = await projectService.deleteProject(req.user!, req.params.id as string);
  res.json(ApiResponse.success(result));
};
