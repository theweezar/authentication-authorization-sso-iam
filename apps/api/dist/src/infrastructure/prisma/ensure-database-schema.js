import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../../shared/env.js";
const resolveDatabasePath = (databaseUrl) => {
    if (databaseUrl === ":memory:") {
        return databaseUrl;
    }
    const normalizedPath = databaseUrl.replace(/^file:/, "");
    if (path.isAbsolute(normalizedPath)) {
        return normalizedPath;
    }
    return path.resolve(process.cwd(), normalizedPath);
};
export const ensureDatabaseSchema = () => {
    const database = new Database(resolveDatabasePath(env.databaseUrl));
    database.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
  `);
    database.close();
};
