import passport from "passport";
import { LocalStrategy } from "./modules/auth/local.strategy.js";
export const configurePassport = (authService) => {
    passport.use(new LocalStrategy(authService));
};
