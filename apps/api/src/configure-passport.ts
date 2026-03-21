import passport from "passport";
import type { AuthService } from "./modules/auth/auth.service.js";
import { LocalStrategy } from "./modules/auth/local.strategy.js";

export const configurePassport = (authService: AuthService): void => {
  passport.use(new LocalStrategy(authService));
};
