export const SYSTEM_ROLE_NAMES = {
  superAdmin: "SuperAdmin",
  admin: "Admin",
} as const;

export const SYSTEM_PERMISSION_NAMES = {
  system: "SYSTEM",
  all: "ALL",
} as const;

export const SYSTEM_MANAGED_ROLE_NAMES = new Set<string>([
  SYSTEM_ROLE_NAMES.superAdmin,
  SYSTEM_ROLE_NAMES.admin,
]);

export const SYSTEM_MANAGED_PERMISSION_NAMES = new Set<string>([
  SYSTEM_PERMISSION_NAMES.system,
  SYSTEM_PERMISSION_NAMES.all,
]);
