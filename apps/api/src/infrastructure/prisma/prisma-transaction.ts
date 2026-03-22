import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";

export interface PrismaTransactionManager {
  $transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}

export type PrismaTransactionalClient = PrismaClient | Prisma.TransactionClient;

export const resolvePrismaClient = (
  prismaClient: PrismaClient,
  tx?: Prisma.TransactionClient,
): PrismaTransactionalClient => tx ?? prismaClient;
