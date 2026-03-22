import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../../shared/env.js";
import {
  SYSTEM_PERMISSION_NAMES,
  SYSTEM_ROLE_NAMES,
} from "../../shared/constants/system-identity.js";

const resolveDatabasePath = (databaseUrl: string): string => {
  if (databaseUrl === ":memory:") {
    return databaseUrl;
  }

  const normalizedPath = databaseUrl.replace(/^file:/, "");

  if (path.isAbsolute(normalizedPath)) {
    return normalizedPath;
  }

  return path.resolve(process.cwd(), normalizedPath);
};

export const ensureDatabaseSchema = (): void => {
  const database = new Database(resolveDatabasePath(env.databaseUrl));
  const userTableExists = database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`)
    .get() as { name: string } | undefined;

  if (userTableExists) {
    const userColumns = database
      .prepare(`PRAGMA table_info("User")`)
      .all() as Array<{ name: string }>;
    const hasLegacySchema = !userColumns.some((column) => column.name === "organizationId");

    if (hasLegacySchema) {
      // The previous API version persisted an incompatible User table.
      database.exec(`
        DROP TABLE IF EXISTS "PermissionAssignment";
        DROP TABLE IF EXISTS "Permission";
        DROP TABLE IF EXISTS "User";
        DROP TABLE IF EXISTS "Role";
        DROP TABLE IF EXISTS "Organization";
      `);
    }
  }

  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS "Organization" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "address" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Organization_email_key" ON "Organization"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "Organization_phone_key" ON "Organization"("phone");

    CREATE TABLE IF NOT EXISTS "Role" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "organizationId" TEXT NOT NULL,
      "roleId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "firstName" TEXT,
      "lastName" TEXT,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

    CREATE TABLE IF NOT EXISTS "Permission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Permission_name_key" ON "Permission"("name");

    CREATE TABLE IF NOT EXISTS "PermissionAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "roleId" TEXT NOT NULL,
      "permissionId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "PermissionAssignment_roleId_permissionId_key"
      ON "PermissionAssignment"("roleId", "permissionId");

    INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt", "createdById")
    SELECT 'system-role-super-admin', '${SYSTEM_ROLE_NAMES.superAdmin}', 'System SuperAdmin role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM "Role" WHERE "name" = '${SYSTEM_ROLE_NAMES.superAdmin}'
    );

    INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt", "createdById")
    SELECT 'system-role-admin', '${SYSTEM_ROLE_NAMES.admin}', 'System Admin role', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM "Role" WHERE "name" = '${SYSTEM_ROLE_NAMES.admin}'
    );

    INSERT INTO "Permission" ("id", "name", "description", "createdAt", "updatedAt", "createdById")
    SELECT 'system-permission-system', '${SYSTEM_PERMISSION_NAMES.system}', 'System-level access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM "Permission" WHERE "name" = '${SYSTEM_PERMISSION_NAMES.system}'
    );

    INSERT INTO "Permission" ("id", "name", "description", "createdAt", "updatedAt", "createdById")
    SELECT 'system-permission-all', '${SYSTEM_PERMISSION_NAMES.all}', 'Administrative access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM "Permission" WHERE "name" = '${SYSTEM_PERMISSION_NAMES.all}'
    );

    INSERT INTO "PermissionAssignment" ("id", "roleId", "permissionId", "createdAt", "updatedAt", "createdById")
    SELECT 'system-assignment-super-admin-system', role."id", permission."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    FROM "Role" role
    JOIN "Permission" permission
      ON role."name" = '${SYSTEM_ROLE_NAMES.superAdmin}'
     AND permission."name" = '${SYSTEM_PERMISSION_NAMES.system}'
    WHERE NOT EXISTS (
      SELECT 1
      FROM "PermissionAssignment" assignment
      WHERE assignment."roleId" = role."id"
        AND assignment."permissionId" = permission."id"
    );

    INSERT INTO "PermissionAssignment" ("id", "roleId", "permissionId", "createdAt", "updatedAt", "createdById")
    SELECT 'system-assignment-admin-all', role."id", permission."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    FROM "Role" role
    JOIN "Permission" permission
      ON role."name" = '${SYSTEM_ROLE_NAMES.admin}'
     AND permission."name" = '${SYSTEM_PERMISSION_NAMES.all}'
    WHERE NOT EXISTS (
      SELECT 1
      FROM "PermissionAssignment" assignment
      WHERE assignment."roleId" = role."id"
        AND assignment."permissionId" = permission."id"
    );
  `);

  database.close();
};
