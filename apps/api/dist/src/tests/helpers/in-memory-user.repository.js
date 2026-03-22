import { SYSTEM_PERMISSION_NAMES, SYSTEM_ROLE_NAMES } from "../../shared/constants/system-identity.js";
import { AppError } from "../../shared/app-error.js";
const createIdentityStore = () => {
    const store = {
        organizations: new Map(),
        roles: new Map(),
        permissions: new Map(),
        permissionAssignments: new Map(),
        users: new Map(),
        nextId: 1,
    };
    const now = new Date();
    const superAdminRole = {
        id: "role-super-admin",
        name: SYSTEM_ROLE_NAMES.superAdmin,
        description: "System SuperAdmin role",
        createdAt: now,
        updatedAt: now,
        createdById: null,
    };
    const adminRole = {
        id: "role-admin",
        name: SYSTEM_ROLE_NAMES.admin,
        description: "System Admin role",
        createdAt: now,
        updatedAt: now,
        createdById: null,
    };
    const systemPermission = {
        id: "permission-system",
        name: SYSTEM_PERMISSION_NAMES.system,
        description: "System-level access",
        createdAt: now,
        updatedAt: now,
        createdById: null,
    };
    const allPermission = {
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
const nextId = (store, prefix) => `${prefix}-${store.nextId++}`;
const clone = (value) => structuredClone(value);
const cloneStore = (store) => ({
    organizations: clone(store.organizations),
    roles: clone(store.roles),
    permissions: clone(store.permissions),
    permissionAssignments: clone(store.permissionAssignments),
    users: clone(store.users),
    nextId: store.nextId,
});
const commitStore = (target, source) => {
    target.organizations = source.organizations;
    target.roles = source.roles;
    target.permissions = source.permissions;
    target.permissionAssignments = source.permissionAssignments;
    target.users = source.users;
    target.nextId = source.nextId;
};
const resolveStore = (store, tx) => (tx?.__store ?? store);
const buildUserRecord = (store, user) => {
    const role = store.roles.get(user.roleId);
    if (!role) {
        throw new AppError("Role not found.", 404);
    }
    const permissions = [...store.permissionAssignments.values()]
        .filter((assignment) => assignment.roleId === role.id)
        .map((assignment) => store.permissions.get(assignment.permissionId)?.name)
        .filter((permissionName) => Boolean(permissionName));
    return {
        ...user,
        roleName: role.name,
        permissions,
    };
};
export class InMemoryOrganizationRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input, tx) {
        const store = resolveStore(this.store, tx);
        const organization = {
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
    async findByEmail(email, tx) {
        const store = resolveStore(this.store, tx);
        const organization = [...store.organizations.values()].find((entry) => entry.email === email);
        return organization ? clone(organization) : null;
    }
    async findByPhone(phone, tx) {
        const store = resolveStore(this.store, tx);
        const organization = [...store.organizations.values()].find((entry) => entry.phone === phone);
        return organization ? clone(organization) : null;
    }
    async delete(id, tx) {
        resolveStore(this.store, tx).organizations.delete(id);
    }
}
export class InMemoryRoleRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input, tx) {
        const store = resolveStore(this.store, tx);
        const role = {
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
    async findById(id, tx) {
        const role = resolveStore(this.store, tx).roles.get(id);
        return role ? clone(role) : null;
    }
    async findByName(name, tx) {
        const store = resolveStore(this.store, tx);
        const role = [...store.roles.values()].find((entry) => entry.name === name);
        return role ? clone(role) : null;
    }
    async delete(id, tx) {
        resolveStore(this.store, tx).roles.delete(id);
    }
}
export class InMemoryPermissionRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input, tx) {
        const store = resolveStore(this.store, tx);
        const permission = {
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
    async findById(id, tx) {
        const permission = resolveStore(this.store, tx).permissions.get(id);
        return permission ? clone(permission) : null;
    }
    async findByName(name, tx) {
        const store = resolveStore(this.store, tx);
        const permission = [...store.permissions.values()].find((entry) => entry.name === name);
        return permission ? clone(permission) : null;
    }
    async delete(id, tx) {
        const store = resolveStore(this.store, tx);
        store.permissions.delete(id);
        for (const [assignmentId, assignment] of store.permissionAssignments.entries()) {
            if (assignment.permissionId === id) {
                store.permissionAssignments.delete(assignmentId);
            }
        }
    }
}
export class InMemoryPermissionAssignmentRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input, tx) {
        const store = resolveStore(this.store, tx);
        const assignment = {
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
    async bulkCreate(input, tx) {
        return Promise.all(input.map((assignment) => this.create(assignment, tx)));
    }
    async findByRoleAndPermission(roleId, permissionId, tx) {
        const store = resolveStore(this.store, tx);
        const assignment = [...store.permissionAssignments.values()].find((entry) => entry.roleId === roleId && entry.permissionId === permissionId);
        return assignment ? clone(assignment) : null;
    }
}
export class InMemoryUserRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input, tx) {
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
    async findByEmail(email, tx) {
        const store = resolveStore(this.store, tx);
        const user = [...store.users.values()].find((entry) => entry.email === email);
        return user ? clone(buildUserRecord(store, user)) : null;
    }
    async findByPhone(phone, tx) {
        const store = resolveStore(this.store, tx);
        const user = [...store.users.values()].find((entry) => entry.phone === phone);
        return user ? clone(buildUserRecord(store, user)) : null;
    }
    async findById(id, tx) {
        const store = resolveStore(this.store, tx);
        const user = store.users.get(id);
        return user ? clone(buildUserRecord(store, user)) : null;
    }
    async update(id, input, tx) {
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
    async delete(id, tx) {
        resolveStore(this.store, tx).users.delete(id);
    }
    async bulkDelete(ids, tx) {
        const store = resolveStore(this.store, tx);
        ids.forEach((id) => store.users.delete(id));
    }
    async bulkUpdateRoles(input, tx) {
        const users = [];
        for (const update of input) {
            users.push(await this.update(update.id, {
                roleId: update.roleId,
            }, tx));
        }
        return users;
    }
    async countByRoleId(roleId, tx) {
        const store = resolveStore(this.store, tx);
        return [...store.users.values()].filter((user) => user.roleId === roleId).length;
    }
}
export const createInMemoryIdentityContext = () => {
    const store = createIdentityStore();
    const transactionManager = {
        async $transaction(callback) {
            const snapshot = cloneStore(store);
            const tx = { __store: snapshot };
            try {
                const result = await callback(tx);
                commitStore(store, snapshot);
                return result;
            }
            catch (error) {
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
