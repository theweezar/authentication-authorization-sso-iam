import { AppError } from "../../shared/app-error.js";
import type { ActorContext } from "../../shared/actor.types.js";
import { SYSTEM_MANAGED_PERMISSION_NAMES } from "../../shared/constants/system-identity.js";
import type { PrismaTransactionManager } from "../../infrastructure/prisma/prisma-transaction.js";
import {
  normalizePermissionName,
  requireValue,
  validatePermissionName,
} from "../../shared/identity-input.js";
import type { RoleRepository } from "../roles/role.repository.js";
import type {
  CreatePermissionInput,
  PermissionAssignmentRecord,
  PermissionRecord,
} from "./permission.types.js";
import type {
  PermissionAssignmentRepository,
  PermissionRepository,
} from "./permission.repository.js";

const ensurePermissionManager = (actor: ActorContext): void => {
  if (!["SuperAdmin", "Admin"].includes(actor.role)) {
    throw new AppError("You are not allowed to manage permissions.", 403);
  }
};

export class PermissionService {
  constructor(
    private readonly transactionManager: PrismaTransactionManager,
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionAssignmentRepository: PermissionAssignmentRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async createPermission(
    input: CreatePermissionInput,
    actor: ActorContext,
  ): Promise<PermissionRecord> {
    ensurePermissionManager(actor);

    const name = normalizePermissionName(input.name);
    const description = input.description.trim();

    requireValue(name, "Permission name is required.");
    requireValue(description, "Permission description is required.");
    validatePermissionName(name);

    if (await this.permissionRepository.findByName(name)) {
      throw new AppError("Permission name is already in use.", 409);
    }

    return this.permissionRepository.create({
      name,
      description,
      createdById: actor.userId,
    });
  }

  async deletePermission(permissionId: string, actor: ActorContext): Promise<void> {
    ensurePermissionManager(actor);

    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new AppError("Permission not found.", 404);
    }

    if (SYSTEM_MANAGED_PERMISSION_NAMES.has(permission.name)) {
      throw new AppError("System permissions cannot be removed.", 403);
    }

    await this.permissionRepository.delete(permissionId);
  }

  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
    actor: ActorContext,
  ): Promise<PermissionAssignmentRecord> {
    ensurePermissionManager(actor);

    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new AppError("Role not found.", 404);
    }

    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new AppError("Permission not found.", 404);
    }

    if (await this.permissionAssignmentRepository.findByRoleAndPermission(roleId, permissionId)) {
      throw new AppError("Permission is already assigned to this role.", 409);
    }

    return this.permissionAssignmentRepository.create({
      roleId,
      permissionId,
      createdById: actor.userId,
    });
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    actor: ActorContext,
  ): Promise<PermissionAssignmentRecord[]> {
    ensurePermissionManager(actor);

    if (permissionIds.length === 0) {
      throw new AppError("At least one permission must be provided.", 400);
    }

    return this.transactionManager.$transaction(async (tx) => {
      const role = await this.roleRepository.findById(roleId, tx);

      if (!role) {
        throw new AppError("Role not found.", 404);
      }

      for (const permissionId of permissionIds) {
        const permission = await this.permissionRepository.findById(permissionId, tx);

        if (!permission) {
          throw new AppError("Permission not found.", 404);
        }

        if (
          await this.permissionAssignmentRepository.findByRoleAndPermission(roleId, permissionId, tx)
        ) {
          throw new AppError("Permission is already assigned to this role.", 409);
        }
      }

      return this.permissionAssignmentRepository.bulkCreate(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          createdById: actor.userId,
        })),
        tx,
      );
    });
  }
}
