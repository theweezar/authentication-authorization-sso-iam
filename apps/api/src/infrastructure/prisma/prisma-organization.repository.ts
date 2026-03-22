import type { Organization, Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { resolvePrismaClient } from "./prisma-transaction.js";
import type { OrganizationRepository } from "../../modules/organizations/organization.repository.js";
import type {
  CreateOrganizationInput,
  OrganizationRecord,
} from "../../modules/organizations/organization.types.js";

const toOrganizationRecord = (organization: Organization): OrganizationRecord => ({
  id: organization.id,
  name: organization.name,
  email: organization.email,
  phone: organization.phone,
  address: organization.address,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
});

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(
    input: CreateOrganizationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const organization = await prismaClient.organization.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address ?? null,
      },
    });

    return toOrganizationRecord(organization);
  }

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const organization = await prismaClient.organization.findUnique({ where: { email } });
    return organization ? toOrganizationRecord(organization) : null;
  }

  async findByPhone(
    phone: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord | null> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    const organization = await prismaClient.organization.findUnique({ where: { phone } });
    return organization ? toOrganizationRecord(organization) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prismaClient = resolvePrismaClient(this.prismaClient, tx);
    await prismaClient.organization.delete({ where: { id } });
  }
}
