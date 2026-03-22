import { Router } from "express";
import type { AuthMiddleware } from "../auth/auth.middleware.js";
import type { RoleController } from "./role.controller.js";

export const createRoleRouter = (
  roleController: RoleController,
  authMiddleware: AuthMiddleware,
): Router => {
  const router = Router();

  router.post("/", authMiddleware.requireJwt, authMiddleware.requireRole("SuperAdmin", "Admin"), roleController.createRole);
  router.delete(
    "/:roleId",
    authMiddleware.requireJwt,
    authMiddleware.requireRole("SuperAdmin", "Admin"),
    roleController.deleteRole,
  );

  return router;
};
