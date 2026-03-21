import type { Request } from "express";
import { Strategy as PassportStrategy } from "passport-strategy";
import { AppError } from "../../shared/app-error.js";
import type { AuthService } from "./auth.service.js";

export class LocalStrategy extends PassportStrategy {
  name = "local";

  constructor(private readonly authService: AuthService) {
    super();
  }

  authenticate(request: Request): void {
    const email = request.body?.email;
    const password = request.body?.password;

    if (typeof email !== "string" || typeof password !== "string") {
      this.fail({ message: "Email and password are required." }, 400);
      return;
    }

    this.authService
      .validateCredentials(email, password)
      .then((user) => {
        this.success(user);
      })
      .catch((error: unknown) => {
        if (error instanceof AppError) {
          this.fail({ message: error.message }, error.statusCode);
          return;
        }

        this.error(error as Error);
      });
  }
}
