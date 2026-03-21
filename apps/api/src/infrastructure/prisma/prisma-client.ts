import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../shared/env.js";

export const createPrismaClient = (): PrismaClient => {
  const adapter = new PrismaBetterSqlite3({
    url: env.databaseUrl,
  });

  return new PrismaClient({ adapter });
};
