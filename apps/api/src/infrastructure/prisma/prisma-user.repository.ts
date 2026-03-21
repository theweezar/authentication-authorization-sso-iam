import type { PrismaClient, User } from "../../generated/prisma/client.js";
import type { UserRepository } from "../../modules/users/user.repository.js";
import type { UserRecord } from "../../modules/users/user.types.js";

const toUserRecord = (user: User): UserRecord => ({
  id: user.id,
  email: user.email,
  passwordHash: user.passwordHash,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(input: { email: string; passwordHash: string }): Promise<UserRecord> {
    const user = await this.prismaClient.user.create({
      data: input,
    });

    return toUserRecord(user);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { email },
    });

    return user ? toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { id },
    });

    return user ? toUserRecord(user) : null;
  }

  async update(id: string, input: { email?: string; passwordHash?: string }): Promise<UserRecord> {
    const user = await this.prismaClient.user.update({
      where: { id },
      data: input,
    });

    return toUserRecord(user);
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.user.delete({
      where: { id },
    });
  }
}
