import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { AppError } from "../../shared/app-error.js";
import { requireActor } from "../../shared/request-auth.js";
import type { PermissionService } from "./permission.service.js";

const getPermissionId = (request: Request): string => {
  const permissionId = request.params.permissionId;

  if (typeof permissionId !== "string" || !permissionId) {
    throw new AppError("Permission id is required.", 400);
  }

  return permissionId;
};

export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  createPermission = asyncHandler(async (request: Request, response: Response) => {
    const permission = await this.permissionService.createPermission(
      {
        name: request.body.name,
        description: request.body.description,
      },
      requireActor(request),
    );

    response.status(201).json({ permission });
  });

  deletePermission = asyncHandler(async (request: Request, response: Response) => {
    await this.permissionService.deletePermission(getPermissionId(request), requireActor(request));
    response.status(204).send();
  });

  assignPermissionToRole = asyncHandler(async (request: Request, response: Response) => {
    const assignment = await this.permissionService.assignPermissionToRole(
      request.body.roleId,
      request.body.permissionId,
      requireActor(request),
    );

    response.status(201).json({ assignment });
  });
}
