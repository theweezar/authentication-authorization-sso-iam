import express from "express";
import path from "node:path";
import passport from "passport";
import { configurePassport } from "./configure-passport.js";
import { ensureDatabaseSchema } from "./infrastructure/prisma/ensure-database-schema.js";
import { PrismaOrganizationRepository } from "./infrastructure/prisma/prisma-organization.repository.js";
import {
  PrismaPermissionAssignmentRepository,
  PrismaPermissionRepository,
} from "./infrastructure/prisma/prisma-permission.repository.js";
import { prisma } from "./infrastructure/prisma/prisma-client.js";
import { PrismaRoleRepository } from "./infrastructure/prisma/prisma-role.repository.js";
import { PrismaUserRepository } from "./infrastructure/prisma/prisma-user.repository.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { AuthMiddleware } from "./modules/auth/auth.middleware.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { ScryptPasswordHasher } from "./modules/auth/password-hasher.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { JwtTokenService } from "./modules/auth/token-service.js";
import { OrganizationController } from "./modules/organizations/organization.controller.js";
import { generateSecurePassword } from "./modules/organizations/password-generator.js";
import { createOrganizationRouter } from "./modules/organizations/organization.routes.js";
import { OrganizationService } from "./modules/organizations/organization.service.js";
import { PermissionController } from "./modules/permissions/permission.controller.js";
import { createPermissionRouter } from "./modules/permissions/permission.routes.js";
import { PermissionService } from "./modules/permissions/permission.service.js";
import { RoleController } from "./modules/roles/role.controller.js";
import { createRoleRouter } from "./modules/roles/role.routes.js";
import { RoleService } from "./modules/roles/role.service.js";
import { UserController } from "./modules/users/user.controller.js";
import { createUserRouter } from "./modules/users/user.routes.js";
import { UserService } from "./modules/users/user.service.js";
import { env } from "./shared/env.js";

export const createApp = () => {
  ensureDatabaseSchema();
  const prismaClient = prisma;
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new JwtTokenService(env.jwtSecret, env.jwtExpiresIn);
  const organizationRepository = new PrismaOrganizationRepository(prismaClient);
  const roleRepository = new PrismaRoleRepository(prismaClient);
  const permissionRepository = new PrismaPermissionRepository(prismaClient);
  const permissionAssignmentRepository = new PrismaPermissionAssignmentRepository(prismaClient);
  const userRepository = new PrismaUserRepository(prismaClient);
  const organizationService = new OrganizationService(
    prismaClient,
    organizationRepository,
    userRepository,
    roleRepository,
    permissionRepository,
    permissionAssignmentRepository,
    passwordHasher,
    generateSecurePassword,
  );
  const userService = new UserService(prismaClient, userRepository, roleRepository, passwordHasher);
  const authService = new AuthService(userRepository, passwordHasher, tokenService);
  const roleService = new RoleService(roleRepository, userRepository);
  const permissionService = new PermissionService(
    prismaClient,
    permissionRepository,
    permissionAssignmentRepository,
    roleRepository,
  );
  const authMiddleware = new AuthMiddleware(tokenService);
  const organizationController = new OrganizationController(organizationService);
  const userController = new UserController(userService);
  const authController = new AuthController(authService);
  const roleController = new RoleController(roleService);
  const permissionController = new PermissionController(permissionService);

  configurePassport(authService);

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(passport.initialize());
  app.use("/static", express.static(path.resolve(process.cwd(), "public")));

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/organizations", createOrganizationRouter(organizationController));
  app.use("/api/users", createUserRouter(userController, authMiddleware));
  app.use("/api/auth", createAuthRouter(authController));
  app.use("/api/roles", createRoleRouter(roleController, authMiddleware));
  app.use("/api/permissions", createPermissionRouter(permissionController, authMiddleware));
  app.use(errorHandler);

  return { app, prismaClient };
};
