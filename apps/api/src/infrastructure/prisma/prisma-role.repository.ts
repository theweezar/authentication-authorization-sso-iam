import type { Prisma, PrismaClient, Role } from "../../generated/prisma/client.js";
import { resolvePrismaClient } from "./prisma-transaction.js";
import type { RoleRepository } from "../../modules/roles/role.repository.js";
import type { CreateRoleInput, RoleRecord } from "../../modules/roles/role.types.js";

const toRoleRecord = (role: Role): RoleRecord => ({
  id: role.id,
  name: role.name,
  description: role.description,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
  createdById: role.createdById,
});

export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(
    input: CreateRoleInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<RoleRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const role = await prismaClient.role.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        createdById: input.createdById,
      },
    });

    return toRoleRecord(role);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const role = await prismaClient.role.findUnique({ where: { id } });
    return role ? toRoleRecord(role) : null;
  }

  async findByName(name: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const role = await prismaClient.role.findUnique({ where: { name } });
    return role ? toRoleRecord(role) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    await prismaClient.role.delete({ where: { id } });
  }
}
