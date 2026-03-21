import express from "express";
import passport from "passport";
import { PrismaUserRepository } from "./infrastructure/prisma/prisma-user.repository.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthMiddleware } from "./modules/auth/auth.middleware.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { ScryptPasswordHasher } from "./modules/auth/password-hasher.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { JwtTokenService } from "./modules/auth/token-service.js";
import { UserController } from "./modules/users/user.controller.js";
import { createUserRouter } from "./modules/users/user.routes.js";
import { UserService } from "./modules/users/user.service.js";
import { configurePassport } from "./configure-passport.js";
import { ensureDatabaseSchema } from "./infrastructure/prisma/ensure-database-schema.js";
import { createPrismaClient } from "./infrastructure/prisma/prisma-client.js";
import { env } from "./shared/env.js";

export const createApp = () => {
  ensureDatabaseSchema();
  const prismaClient = createPrismaClient();
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new JwtTokenService(env.jwtSecret, env.jwtExpiresIn);
  const userRepository = new PrismaUserRepository(prismaClient);
  const userService = new UserService(userRepository, passwordHasher);
  const authService = new AuthService(userRepository, passwordHasher, tokenService);
  const authMiddleware = new AuthMiddleware(tokenService);
  const userController = new UserController(userService);
  const authController = new AuthController(authService);

  configurePassport(authService);

  const app = express();

  app.use(express.json());
  app.use(passport.initialize());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/users", createUserRouter(userController, authMiddleware));
  app.use("/api/auth", createAuthRouter(authController));
  app.use(errorHandler);

  return { app, prismaClient };
};
