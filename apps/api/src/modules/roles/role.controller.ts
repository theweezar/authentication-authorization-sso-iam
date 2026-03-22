import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { AppError } from "../../shared/app-error.js";
import { requireActor } from "../../shared/request-auth.js";
import type { RoleService } from "./role.service.js";

const getRoleId = (request: Request): string => {
  const roleId = request.params.roleId;

  if (typeof roleId !== "string" || !roleId) {
    throw new AppError("Role id is required.", 400);
  }

  return roleId;
};

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  createRole = asyncHandler(async (request: Request, response: Response) => {
    const role = await this.roleService.createRole(
      {
        name: request.body.name,
        description: request.body.description,
      },
      requireActor(request),
    );

    response.status(201).json({ role });
  });

  deleteRole = asyncHandler(async (request: Request, response: Response) => {
    await this.roleService.deleteRole(getRoleId(request), requireActor(request));
    response.status(204).send();
  });
}
