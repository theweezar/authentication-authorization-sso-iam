import { resolvePrismaClient } from "./prisma-transaction.js";
const userInclude = {
    role: {
        include: {
            permissionAssignments: {
                include: {
                    permission: true,
                },
            },
        },
    },
};
const toUserRecord = (user) => ({
    id: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissionAssignments.map((assignment) => assignment.permission.name),
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdById: user.createdById,
});
export class PrismaUserRepository {
    prismaClient;
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async create(input, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const user = (await prismaClient.user.create({
            data: {
                organizationId: input.organizationId,
                roleId: input.roleId,
                email: input.email,
                phone: input.phone,
                firstName: input.firstName ?? null,
                lastName: input.lastName ?? null,
                passwordHash: input.passwordHash,
                createdById: input.createdById,
            },
            include: userInclude,
        }));
        return toUserRecord(user);
    }
    async findByEmail(email, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const user = (await prismaClient.user.findUnique({
            where: { email },
            include: userInclude,
        }));
        return user ? toUserRecord(user) : null;
    }
    async findByPhone(phone, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const user = (await prismaClient.user.findUnique({
            where: { phone },
            include: userInclude,
        }));
        return user ? toUserRecord(user) : null;
    }
    async findById(id, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const user = (await prismaClient.user.findUnique({
            where: { id },
            include: userInclude,
        }));
        return user ? toUserRecord(user) : null;
    }
    async update(id, input, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const user = (await prismaClient.user.update({
            data: {
                roleId: input.roleId,
                email: input.email,
                phone: input.phone,
                firstName: input.firstName,
                lastName: input.lastName,
                passwordHash: input.passwordHash,
            },
            where: { id },
            include: userInclude,
        }));
        return toUserRecord(user);
    }
    async delete(id, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        await prismaClient.user.delete({
            where: { id },
        });
    }
    async bulkDelete(ids, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        await prismaClient.user.deleteMany({
            where: {
                id: { in: ids },
            },
        });
    }
    async bulkUpdateRoles(input, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        const users = await Promise.all(input.map(({ id, roleId }) => prismaClient.user.update({
            where: { id },
            data: { roleId },
            include: userInclude,
        })));
        return users.map((user) => toUserRecord(user));
    }
    async countByRoleId(roleId, tx) {
        const prismaClient = resolvePrismaClient(this.prismaClient, tx);
        return prismaClient.user.count({
            where: { roleId },
        });
    }
}
