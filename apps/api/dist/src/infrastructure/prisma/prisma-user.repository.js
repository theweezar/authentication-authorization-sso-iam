const toUserRecord = (user) => ({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
export class PrismaUserRepository {
    prismaClient;
    constructor(prismaClient) {
        this.prismaClient = prismaClient;
    }
    async create(input) {
        const user = await this.prismaClient.user.create({
            data: input,
        });
        return toUserRecord(user);
    }
    async findByEmail(email) {
        const user = await this.prismaClient.user.findUnique({
            where: { email },
        });
        return user ? toUserRecord(user) : null;
    }
    async findById(id) {
        const user = await this.prismaClient.user.findUnique({
            where: { id },
        });
        return user ? toUserRecord(user) : null;
    }
    async update(id, input) {
        const user = await this.prismaClient.user.update({
            where: { id },
            data: input,
        });
        return toUserRecord(user);
    }
    async delete(id) {
        await this.prismaClient.user.delete({
            where: { id },
        });
    }
}
