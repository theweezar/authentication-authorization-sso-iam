import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { AppError } from "../../shared/app-error.js";
import type { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = (request: Request, response: Response, next: NextFunction): void => {
    passport.authenticate(
      "local",
      { session: false },
      async (error: Error | null, user: Express.Request["user"], info?: { message?: string }) => {
        if (error) {
          next(error);
          return;
        }

        if (!user) {
          next(new AppError(info?.message ?? "Invalid email or password.", 401));
          return;
        }

        try {
          const result = await this.authService.authenticate(user.email, request.body.password);
          response.status(200).json(result);
        } catch (authError) {
          next(authError);
        }
      },
    )(request, response, next);
  };
}
