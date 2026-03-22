import { SYSTEM_PERMISSION_NAMES, SYSTEM_ROLE_NAMES } from "../../shared/constants/system-identity.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { PrismaTransactionManager } from "../../infrastructure/prisma/prisma-transaction.js";
import type { OrganizationRepository } from "../../modules/organizations/organization.repository.js";
import type { CreateOrganizationInput, OrganizationRecord } from "../../modules/organizations/organization.types.js";
import type {
  PermissionAssignmentRepository,
  PermissionRepository,
} from "../../modules/permissions/permission.repository.js";
import type {
  CreatePermissionInput,
  PermissionAssignmentRecord,
  PermissionRecord,
} from "../../modules/permissions/permission.types.js";
import type { RoleRepository } from "../../modules/roles/role.repository.js";
import type { CreateRoleInput, RoleRecord } from "../../modules/roles/role.types.js";
import type { UserRepository } from "../../modules/users/user.repository.js";
import type { UserRecord } from "../../modules/users/user.types.js";
import { AppError } from "../../shared/app-error.js";

type IdentityStore = {
  organizations: Map<string, OrganizationRecord>;
  roles: Map<string, RoleRecord>;
  permissions: Map<string, PermissionRecord>;
  permissionAssignments: Map<string, PermissionAssignmentRecord>;
  users: Map<string, UserRecord>;
  nextId: number;
};

type InMemoryTransactionClient = Prisma.TransactionClient & {
  __store: IdentityStore;
};

const createIdentityStore = (): IdentityStore => {
  const store: IdentityStore = {
    organizations: new Map<string, OrganizationRecord>(),
    roles: new Map<string, RoleRecord>(),
    permissions: new Map<string, PermissionRecord>(),
    permissionAssignments: new Map<string, PermissionAssignmentRecord>(),
    users: new Map<string, UserRecord>(),
    nextId: 1,
  };

  const now = new Date();

  const superAdminRole: RoleRecord = {
    id: "role-super-admin",
    name: SYSTEM_ROLE_NAMES.superAdmin,
    description: "System SuperAdmin role",
    createdAt: now,
    updatedAt: now,
    createdById: null,
  };
  const adminRole: RoleRecord = {
    id: "role-admin",
    name: SYSTEM_ROLE_NAMES.admin,
    description: "System Admin role",
    createdAt: now,
    updatedAt: now,
    createdById: null,
  };
  const systemPermission: PermissionRecord = {
    id: "permission-system",
    name: SYSTEM_PERMISSION_NAMES.system,
    description: "System-level access",
    createdAt: now,
    updatedAt: now,
    createdById: null,
  };
  const allPermission: PermissionRecord = {
    id: "permission-all",
    name: SYSTEM_PERMISSION_NAMES.all,
    description: "Administrative access",
    createdAt: now,
    updatedAt: now,
    createdById: null,
  };

  store.roles.set(superAdminRole.id, superAdminRole);
  store.roles.set(adminRole.id, adminRole);
  store.permissions.set(systemPermission.id, systemPermission);
  store.permissions.set(allPermission.id, allPermission);
  store.permissionAssignments.set("assignment-super-admin", {
    id: "assignment-super-admin",
    roleId: superAdminRole.id,
    permissionId: systemPermission.id,
    createdAt: now,
    updatedAt: now,
    createdById: null,
  });
  store.permissionAssignments.set("assignment-admin", {
    id: "assignment-admin",
    roleId: adminRole.id,
    permissionId: allPermission.id,
    createdAt: now,
    updatedAt: now,
    createdById: null,
  });

  return store;
};

const nextId = (store: IdentityStore, prefix: string): string => `${prefix}-${store.nextId++}`;

const clone = <T>(value: T): T => structuredClone(value);

const cloneStore = (store: IdentityStore): IdentityStore => ({
  organizations: clone(store.organizations),
  roles: clone(store.roles),
  permissions: clone(store.permissions),
  permissionAssignments: clone(store.permissionAssignments),
  users: clone(store.users),
  nextId: store.nextId,
});

const commitStore = (target: IdentityStore, source: IdentityStore): void => {
  target.organizations = source.organizations;
  target.roles = source.roles;
  target.permissions = source.permissions;
  target.permissionAssignments = source.permissionAssignments;
  target.users = source.users;
  target.nextId = source.nextId;
};

const resolveStore = (store: IdentityStore, tx?: Prisma.TransactionClient): IdentityStore =>
  ((tx as InMemoryTransactionClient | undefined)?.__store ?? store);

const buildUserRecord = (
  store: IdentityStore,
  user: Omit<UserRecord, "roleName" | "permissions">,
): UserRecord => {
  const role = store.roles.get(user.roleId);

  if (!role) {
    throw new AppError("Role not found.", 404);
  }

  const permissions = [...store.permissionAssignments.values()]
    .filter((assignment) => assignment.roleId === role.id)
    .map((assignment) => store.permissions.get(assignment.permissionId)?.name)
    .filter((permissionName): permissionName is string => Boolean(permissionName));

  return {
    ...user,
    roleName: role.name,
    permissions,
  };
};

export class InMemoryOrganizationRepository implements OrganizationRepository {
  constructor(private readonly store: IdentityStore) {}

  async create(
    input: CreateOrganizationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord> {
    const store = resolveStore(this.store, tx);
    const organization: OrganizationRecord = {
      id: nextId(store, "organization"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.organizations.set(organization.id, organization);
    return clone(organization);
  }

  async findByEmail(
    email: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord | null> {
    const store = resolveStore(this.store, tx);
    const organization = [...store.organizations.values()].find((entry) => entry.email === email);
    return organization ? clone(organization) : null;
  }

  async findByPhone(
    phone: string,
    tx?: Prisma.TransactionClient,
  ): Promise<OrganizationRecord | null> {
    const store = resolveStore(this.store, tx);
    const organization = [...store.organizations.values()].find((entry) => entry.phone === phone);
    return organization ? clone(organization) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    resolveStore(this.store, tx).organizations.delete(id);
  }
}

export class InMemoryRoleRepository implements RoleRepository {
  constructor(private readonly store: IdentityStore) {}

  async create(
    input: CreateRoleInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<RoleRecord> {
    const store = resolveStore(this.store, tx);
    const role: RoleRecord = {
      id: nextId(store, "role"),
      name: input.name,
      description: input.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: input.createdById,
    };

    store.roles.set(role.id, role);
    return clone(role);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null> {
    const role = resolveStore(this.store, tx).roles.get(id);
    return role ? clone(role) : null;
  }

  async findByName(name: string, tx?: Prisma.TransactionClient): Promise<RoleRecord | null> {
    const store = resolveStore(this.store, tx);
    const role = [...store.roles.values()].find((entry) => entry.name === name);
    return role ? clone(role) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    resolveStore(this.store, tx).roles.delete(id);
  }
}

export class InMemoryPermissionRepository implements PermissionRepository {
  constructor(private readonly store: IdentityStore) {}

  async create(
    input: CreatePermissionInput & { createdById: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionRecord> {
    const store = resolveStore(this.store, tx);
    const permission: PermissionRecord = {
      id: nextId(store, "permission"),
      name: input.name,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: input.createdById,
    };

    store.permissions.set(permission.id, permission);
    return clone(permission);
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null> {
    const permission = resolveStore(this.store, tx).permissions.get(id);
    return permission ? clone(permission) : null;
  }

  async findByName(name: string, tx?: Prisma.TransactionClient): Promise<PermissionRecord | null> {
    const store = resolveStore(this.store, tx);
    const permission = [...store.permissions.values()].find((entry) => entry.name === name);
    return permission ? clone(permission) : null;
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const store = resolveStore(this.store, tx);
    store.permissions.delete(id);

    for (const [assignmentId, assignment] of store.permissionAssignments.entries()) {
      if (assignment.permissionId === id) {
        store.permissionAssignments.delete(assignmentId);
      }
    }
  }
}

export class InMemoryPermissionAssignmentRepository implements PermissionAssignmentRepository {
  constructor(private readonly store: IdentityStore) {}

  async create(input: {
    roleId: string;
    permissionId: string;
    createdById: string | null;
  }, tx?: Prisma.TransactionClient): Promise<PermissionAssignmentRecord> {
    const store = resolveStore(this.store, tx);
    const assignment: PermissionAssignmentRecord = {
      id: nextId(store, "permission-assignment"),
      roleId: input.roleId,
      permissionId: input.permissionId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: input.createdById,
    };

    store.permissionAssignments.set(assignment.id, assignment);
    return clone(assignment);
  }

  async bulkCreate(
    input: Array<{
      roleId: string;
      permissionId: string;
      createdById: string | null;
    }>,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord[]> {
    return Promise.all(input.map((assignment) => this.create(assignment, tx)));
  }

  async findByRoleAndPermission(
    roleId: string,
    permissionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PermissionAssignmentRecord | null> {
    const store = resolveStore(this.store, tx);
    const assignment = [...store.permissionAssignments.values()].find(
      (entry) => entry.roleId === roleId && entry.permissionId === permissionId,
    );
    return assignment ? clone(assignment) : null;
  }
}

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly store: IdentityStore) {}

  async create(input: {
    organizationId: string;
    roleId: string;
    email: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    createdById: string | null;
  }, tx?: Prisma.TransactionClient): Promise<UserRecord> {
    const store = resolveStore(this.store, tx);
    const user = buildUserRecord(store, {
      id: nextId(store, "user"),
      organizationId: input.organizationId,
      roleId: input.roleId,
      email: input.email,
      phone: input.phone,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: input.createdById,
    });

    store.users.set(user.id, user);
    return clone(user);
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const store = resolveStore(this.store, tx);
    const user = [...store.users.values()].find((entry) => entry.email === email);
    return user ? clone(buildUserRecord(store, user)) : null;
  }

  async findByPhone(phone: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const store = resolveStore(this.store, tx);
    const user = [...store.users.values()].find((entry) => entry.phone === phone);
    return user ? clone(buildUserRecord(store, user)) : null;
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<UserRecord | null> {
    const store = resolveStore(this.store, tx);
    const user = store.users.get(id);
    return user ? clone(buildUserRecord(store, user)) : null;
  }

  async update(
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
  ): Promise<UserRecord> {
    const store = resolveStore(this.store, tx);
    const currentUser = store.users.get(id);

    if (!currentUser) {
      throw new AppError("User not found.", 404);
    }

    const updatedUser = buildUserRecord(store, {
      ...currentUser,
      roleId: input.roleId ?? currentUser.roleId,
      email: input.email ?? currentUser.email,
      phone: input.phone ?? currentUser.phone,
      firstName: input.firstName === undefined ? currentUser.firstName : input.firstName,
      lastName: input.lastName === undefined ? currentUser.lastName : input.lastName,
      passwordHash: input.passwordHash ?? currentUser.passwordHash,
      updatedAt: new Date(),
    });

    store.users.set(id, updatedUser);
    return clone(updatedUser);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    resolveStore(this.store, tx).users.delete(id);
  }

  async bulkDelete(ids: string[], tx?: Prisma.TransactionClient): Promise<void> {
    const store = resolveStore(this.store, tx);
    ids.forEach((id) => store.users.delete(id));
  }

  async bulkUpdateRoles(
    input: Array<{ id: string; roleId: string }>,
    tx?: Prisma.TransactionClient,
  ): Promise<UserRecord[]> {
    const users: UserRecord[] = [];

    for (const update of input) {
      users.push(
        await this.update(
          update.id,
          {
            roleId: update.roleId,
          },
          tx,
        ),
      );
    }

    return users;
  }

  async countByRoleId(roleId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const store = resolveStore(this.store, tx);
    return [...store.users.values()].filter((user) => user.roleId === roleId).length;
  }
}

export const createInMemoryIdentityContext = () => {
  const store = createIdentityStore();
  const transactionManager: PrismaTransactionManager = {
    async $transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
      const snapshot = cloneStore(store);
      const tx = { __store: snapshot } as InMemoryTransactionClient;

      try {
        const result = await callback(tx);
        commitStore(store, snapshot);
        return result;
      } catch (error) {
        throw error;
      }
    },
  };

  return {
    transactionManager,
    organizationRepository: new InMemoryOrganizationRepository(store),
    roleRepository: new InMemoryRoleRepository(store),
    permissionRepository: new InMemoryPermissionRepository(store),
    permissionAssignmentRepository: new InMemoryPermissionAssignmentRepository(store),
    userRepository: new InMemoryUserRepository(store),
  };
};
