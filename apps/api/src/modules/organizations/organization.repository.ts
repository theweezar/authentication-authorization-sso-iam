import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateOrganizationInput, OrganizationRecord } from "./organization.types.js";

export interface OrganizationRepository {
  create(input: CreateOrganizationInput, tx?: Prisma.TransactionClient): Promise<OrganizationRecord>;
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<OrganizationRecord | null>;
  findByPhone(phone: string, tx?: Prisma.TransactionClient): Promise<OrganizationRecord | null>;
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}
