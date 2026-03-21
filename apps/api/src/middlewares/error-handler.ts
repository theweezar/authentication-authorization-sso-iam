import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/app-error.js";

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
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
