import { Router } from "express";
export const createUserRouter = (userController, authMiddleware) => {
    const router = Router();
    router.post("/", authMiddleware.requireJwt, authMiddleware.requireRole("SuperAdmin", "Admin"), userController.createUser);
    router.patch("/:userId", authMiddleware.requireJwt, authMiddleware.requireSelfOrRole("SuperAdmin", "Admin"), userController.updateUser);
    router.delete("/:userId", authMiddleware.requireJwt, authMiddleware.requireRole("SuperAdmin", "Admin"), userController.deleteUser);
    return router;
};
