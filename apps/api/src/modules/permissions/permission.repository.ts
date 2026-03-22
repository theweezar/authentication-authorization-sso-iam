import type { Prisma } from "../../generated/prisma/client.js";
import type {
  CreatePermissionInput,
  PermissionAssignmentRecord,
  PermissionRecord,
} from "./permission.types.js";

export interface PermissionRepository {
  create(
    input: CreatePermissionInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionRecord>;
  findById(id: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null>;
  findByName(name: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}

export interface PermissionAssignmentRepository {
  create(
    input: {
      roleId: string;
      permissionId: string;
      createdById: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord>;
  bulkCreate(
    input: Array<{
      roleId: string;
      permissionId: string;
      createdById: string | null;
    }>,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord[]>;
  findByRoleAndPermission(
    roleId: string,
    permissionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord | null>;
}
