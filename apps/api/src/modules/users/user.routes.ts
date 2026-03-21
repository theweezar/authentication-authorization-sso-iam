import { Router } from "express";
import type { UserController } from "./user.controller.js";
import type { AuthMiddleware } from "../auth/auth.middleware.js";

export const createUserRouter = (
  userController: UserController,
  authMiddleware: AuthMiddleware,
): Router => {
  const router = Router();

  router.post("/", userController.createUser);
  router.patch(
    "/:userId",
    authMiddleware.requireJwt,
    authMiddleware.requireSelf,
    userController.updateUser,
  );
  router.delete(
    "/:userId",
    authMiddleware.requireJwt,
    authMiddleware.requireSelf,
    userController.deleteUser,
  );

  return router;
};
