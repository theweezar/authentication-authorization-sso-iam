import { AppError } from "../../shared/app-error.js";
const getBearerToken = (authorizationHeader) => {
    if (!authorizationHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authorizationHeader.slice("Bearer ".length).trim();
};
export class AuthMiddleware {
    tokenService;
    constructor(tokenService) {
        this.tokenService = tokenService;
    }
    requireJwt = (request, _response, next) => {
        const token = getBearerToken(request.headers.authorization);
        if (!token) {
            next(new AppError("Authorization token is required.", 401));
            return;
        }
        try {
            request.auth = this.tokenService.verifyToken(token);
            next();
        }
        catch {
            next(new AppError("Invalid or expired token.", 401));
        }
    };
    requireSelf = (request, _response, next) => {
        if (!request.auth || request.auth.userId !== request.params.userId) {
            next(new AppError("You are not allowed to modify this user.", 403));
            return;
        }
        next();
    };
    requireRole = (...roles) => (request, _response, next) => {
        if (!request.auth || !roles.includes(request.auth.role)) {
            next(new AppError("You are not allowed to access this resource.", 403));
            return;
        }
        next();
    };
    requireSelfOrRole = (...roles) => (request, response, next) => {
        if (request.auth && request.auth.userId === request.params.userId) {
            next();
            return;
        }
        this.requireRole(...roles)(request, response, next);
    };
}
