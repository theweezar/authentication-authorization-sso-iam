import type {
  Permission,
  PermissionAssignment,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client.js";
import { resolvePrismaClient } from "./prisma-transaction.js";
import type {
  PermissionAssignmentRepository,
  PermissionRepository,
} from "../../modules/permissions/permission.repository.js";
import type {
  CreatePermissionInput,
  PermissionAssignmentRecord,
  PermissionRecord,
} from "../../modules/permissions/permission.types.js";

const toPermissionRecord = (permission: Permission): PermissionRecord => ({
  id: permission.id,
  name: permission.name,
  description: permission.description,
  createdAt: permission.createdAt,
  updatedAt: permission.updatedAt,
  createdById: permission.createdById,
});

const toPermissionAssignmentRecord = (
  permissionAssignment: PermissionAssignment,
): PermissionAssignmentRecord => ({
  id: permissionAssignment.id,
  roleId: permissionAssignment.roleId,
  permissionId: permissionAssignment.permissionId,
  createdAt: permissionAssignment.createdAt,
  updatedAt: permissionAssignment.updatedAt,
  createdById: permissionAssignment.createdById,
});

export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(
    input: CreatePermissionInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const permission = await prismaClient.permission.create({
      data: {
        name: input.name,
        description: input.description,
        createdById: input.createdById,
      },
    });

    return toPermissionRecord(permission);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const permission = await prismaClient.permission.findUnique({ where: { id } });
    return permission ? toPermissionRecord(permission) : null;
  }

  async findByName(name: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const permission = await prismaClient.permission.findUnique({ where: { name } });
    return permission ? toPermissionRecord(permission) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    await prismaClient.permission.delete({ where: { id } });
  }
}

export class PrismaPermissionAssignmentRepository implements PermissionAssignmentRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(input: {
    roleId: string;
    permissionId: string;
    createdById: string | null;
  }, tx?: Prisma.TransactionClient): Promise<PermissionAssignmentRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const permissionAssignment = await prismaClient.permissionAssignment.create({
      data: input,
    });

    return toPermissionAssignmentRecord(permissionAssignment);
  }

  async bulkCreate(
    input: Array<{
      roleId: string;
      permissionId: string;
      createdById: string | null;
    }>,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord[]> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const assignments = await Promise.all(
      input.map((assignment) =>
        prismaClient.permissionAssignment.create({
          data: assignment,
        }),
      ),
    );

    return assignments.map(toPermissionAssignmentRecord);
  }

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const permissionAssignment = await prismaClient.permissionAssignment.findFirst({
      where: {
        roleId,
        permissionId,
      },
    });

    return permissionAssignment ? toPermissionAssignmentRecord(permissionAssignment) : null;
  }
}
