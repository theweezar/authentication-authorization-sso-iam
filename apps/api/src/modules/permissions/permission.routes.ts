import { Router } from "express";
import type { AuthMiddleware } from "../auth/auth.middleware.js";
import type { PermissionController } from "./permission.controller.js";

export const createPermissionRouter = (
  permissionController: PermissionController,
  authMiddleware: AuthMiddleware,
): Router => {
  const router = Router();

  router.post("/", authMiddleware.requireJwt, authMiddleware.requireRole("SuperAdmin", "Admin"), permissionController.createPermission);
  router.delete(
    "/:permissionId",
    authMiddleware.requireJwt,
    authMiddleware.requireRole("SuperAdmin", "Admin"),
    permissionController.deletePermission,
  );
  router.post(
    "/assignments",
    authMiddleware.requireJwt,
    authMiddleware.requireRole("SuperAdmin", "Admin"),
    permissionController.assignPermissionToRole,
  );

  return router;
};
