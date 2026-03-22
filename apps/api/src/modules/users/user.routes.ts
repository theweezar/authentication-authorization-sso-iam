import { Router } from "express";
import type { UserController } from "./user.controller.js";
import type { AuthMiddleware } from "../auth/auth.middleware.js";

export const createUserRouter = (
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router => {
  const router = Router();

  router.post("/", authMiddleware.requireJwt, authMiddleware.requireRole("SuperAdmin", "Admin"), userController.createUser);
  router.patch(
    "/:userId",
    authMiddleware.requireJwt,
    authMiddleware.requireSelfOrRole("SuperAdmin", "Admin"),
    userController.updateUser,
  );
  router.delete(
    "/:userId",
    authMiddleware.requireJwt,
    authMiddleware.requireRole("SuperAdmin", "Admin"),
    userController.deleteUser,
  );

  return router;
};
