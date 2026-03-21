import { Router } from "express";
export const createUserRouter = (userController, authMiddleware) => {
    const router = Router();
    router.post("/", userController.createUser);
    router.patch("/:userId", authMiddleware.requireJwt, authMiddleware.requireSelf, userController.updateUser);
    router.delete("/:userId", authMiddleware.requireJwt, authMiddleware.requireSelf, userController.deleteUser);
    return router;
};
