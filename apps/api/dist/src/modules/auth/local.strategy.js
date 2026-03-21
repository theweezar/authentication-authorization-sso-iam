import { Strategy as PassportStrategy } from "passport-strategy";
import { AppError } from "../../shared/app-error.js";
export class LocalStrategy extends PassportStrategy {
    authService;
    name = "local";
    constructor(authService) {
        super();
        this.authService = authService;
    }
    authenticate(request) {
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
            .catch((error) => {
            if (error instanceof AppError) {
                this.fail({ message: error.message }, error.statusCode);
                return;
            }
            this.error(error);
        });
    }
}
