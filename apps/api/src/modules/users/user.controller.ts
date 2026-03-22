import type { Request, Response } from "express";
import { asyncHandler } from "../../shared/async-handler.js";
import { AppError } from "../../shared/app-error.js";
import { requireActor } from "../../shared/request-auth.js";
import type { UserService } from "./user.service.js";

const getUserId = (request: Request): string => {
  const userId = request.params.userId;

  if (typeof userId !== "string" || !userId) {
    throw new AppError("User id is required.", 400);
  }

  return userId;
};

export class UserController {
  constructor(private readonly userService: UserService) {}

  createUser = asyncHandler(async (request: Request, response: Response) => {
    const user = await this.userService.createUser({
      organizationId: request.body.organizationId,
      roleId: request.body.roleId,
      email: request.body.email,
      phone: request.body.phone,
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      password: request.body.password,
    }, requireActor(request));

    response.status(201).json({ user });
  });

  updateUser = asyncHandler(async (request: Request, response: Response) => {
    const user = await this.userService.updateUser(getUserId(request), {
      email: request.body.email,
      phone: request.body.phone,
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      password: request.body.password,
      roleId: request.body.roleId,
    }, requireActor(request));

    response.status(200).json({ user });
  });

  deleteUser = asyncHandler(async (request: Request, response: Response) => {
    await this.userService.deleteUser(getUserId(request), requireActor(request));
    response.status(204).send();
  });
}
