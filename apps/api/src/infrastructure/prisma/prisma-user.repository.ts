import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { resolvePrismaClient } from "./prisma-transaction.js";
import type { UserRepository } from "../../modules/users/user.repository.js";
import type { UserRecord } from "../../modules/users/user.types.js";

type UserWithRoleAndPermissions = {
  id: string;
  organizationId: string;
  roleId: string;
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  role: {
    name: string;
    permissionAssignments: Array<{
      permission: {
        name: string;
      };
    }>;
  };
};

const userInclude = {
  role: {
    include: {
      permissionAssignments: {
        include: {
          permission: true,
        },
      },
    },
  },
} as const;

const toUserRecord = (user: UserWithRoleAndPermissions): UserRecord => ({
  id: user.id,
  organizationId: user.organizationId,
  roleId: user.roleId,
  roleName: user.role.name,
  permissions: user.role.permissionAssignments.map((assignment) => assignment.permission.name),
  email: user.email,
  phone: user.phone,
  firstName: user.firstName,
  lastName: user.lastName,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  createdById: user.createdById,
});

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(input: {
    organizationId: string;
    roleId: string;
    email: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    createdById: string | null;
  }, tx?: Prisma.TransactionClient): Promise<UserRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const user = (await prismaClient.user.create({
      data: {
        organizationId: input.organizationId,
        roleId: input.roleId,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        passwordHash: input.passwordHash,
        createdById: input.createdById,
      },
      include: userInclude,
    })) as UserWithRoleAndPermissions;

    return toUserRecord(user);
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const user = (await prismaClient.user.findUnique({
      where: { email },
      include: userInclude,
    })) as UserWithRoleAndPermissions | null;

    return user ? toUserRecord(user) : null;
  }

  async findByPhone(phone: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const user = (await prismaClient.user.findUnique({
      where: { phone },
      include: userInclude,
    })) as UserWithRoleAndPermissions | null;

    return user ? toUserRecord(user) : null;
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const user = (await prismaClient.user.findUnique({
      where: { id },
      include: userInclude,
    })) as UserWithRoleAndPermissions | null;

    return user ? toUserRecord(user) : null;
  }

  async update(
    id: string,
    input: {
      roleId?: string;
      email?: string;
      phone?: string;
      firstName?: string | null;
      lastName?: string | null;
      passwordHash?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<UserRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const user = (await prismaClient.user.update({
      data: {
        roleId: input.roleId,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: input.passwordHash,
      },
      where: { id },
      include: userInclude,
    })) as UserWithRoleAndPermissions;

    return toUserRecord(user);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    await prismaClient.user.delete({
      where: { id },
    });
  }

  async bulkDelete(ids: string[], tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    await prismaClient.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async bulkUpdateRoles(
    input: Array<{ id: string; roleId: string }>,
    tx?: Prisma.TransactionClient,
  ): Promise<UserRecord[]> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const users = await Promise.all(
      input.map(({ id, roleId }) =>
        prismaClient.user.update({
          where: { id },
          data: { roleId },
          include: userInclude,
        }),
      ),
    );

    return users.map((user: unknown) => toUserRecord(user as UserWithRoleAndPermissions));
  }

  async countByRoleId(roleId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    return prismaClient.user.count({
      where: { roleId },
    });
  }
}
