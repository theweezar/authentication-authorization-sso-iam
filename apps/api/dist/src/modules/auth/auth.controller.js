import passport from "passport";
import { AppError } from "../../shared/app-error.js";
export class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login = (request, response, next) => {
        passport.authenticate("local", { session: false }, async (error, user, info) => {
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
            }
            catch (authError) {
                next(authError);
            }
        })(request, response, next);
    };
}
