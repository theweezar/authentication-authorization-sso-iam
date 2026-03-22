import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateRoleInput, RoleRecord } from "./role.types.js";

export interface RoleRepository {
  create(
    input: CreateRoleInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<RoleRecord>;
  findById(id: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null>;
  findByName(name: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}
