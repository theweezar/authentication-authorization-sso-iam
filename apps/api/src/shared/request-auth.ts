import type { Request } from "express";
import { AppError } from "./app-error.js";
import type { ActorContext } from "./actor.types.js";

export const requireActor = (request: Request): ActorContext => {
  if (!request.auth) {
    throw new AppError("Authorization token is required.", 401);
  }

  return request.auth;
};
