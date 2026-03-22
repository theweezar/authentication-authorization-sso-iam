import type { Prisma } from "../../generated/prisma/client.js";
import type { UpdateUserInput, UserRecord } from "./user.types.js";

export interface UserRepository {
  create(
    input: {
      organizationId: string;
      roleId: string;
      email: string;
      phone: string;
      firstName?: string;
      lastName?: string;
      passwordHash: string;
      createdById: string | null;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<UserRecord>;
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null>;
  findByPhone(phone: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null>;
  findById(id: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null>;
  update(
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
  ): Promise<UserRecord>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
  bulkDelete(ids: string[], tx?: Prisma.TransactionClient): Promise<void>;
  bulkUpdateRoles(
    input: Array<{ id: string; roleId: string }>,
    tx?: Prisma.TransactionClient,
  ): Promise<UserRecord[]>;
  countByRoleId(roleId: string, tx?: Prisma.TransactionClient): Promise<number>;
}

export type UpdateUserPersistenceInput = UpdateUserInput & {
  passwordHash?: string;
};
