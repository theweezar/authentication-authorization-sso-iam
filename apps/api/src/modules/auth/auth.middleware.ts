import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/app-error.js";
import type { TokenService } from "./token-service.js";

const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  requireJwt = (request: Request, _response: Response, next: NextFunction): void => {
    const token = getBearerToken(request.headers.authorization);

    if (!token) {
      next(new AppError("Authorization token is required.", 401));
      return;
    }

    try {
      request.auth = this.tokenService.verifyToken(token);
      next();
    } catch {
      next(new AppError("Invalid or expired token.", 401));
    }
  };

  requireSelf = (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth || request.auth.userId !== request.params.userId) {
      next(new AppError("You are not allowed to modify this user.", 403));
      return;
    }

    next();
  };
}
