import { Router } from "express";
import type { AuthController } from "./auth.controller.js";

export const createAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post("/login", authController.login);

  return router;
};
