import { AppError } from "../shared/app-error.js";
export const errorHandler = (error, _request, response, _next) => {
    if (error instanceof AppError) {
        response.status(error.statusCode).json({
            error: error.message,
        });
        return;
    }
    response.status(500).json({
        error: "Internal server error.",
    });
};
