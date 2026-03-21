import { Router } from "express";
export const createAuthRouter = (authController) => {
    const router = Router();
    router.post("/login", authController.login);
    return router;
};
