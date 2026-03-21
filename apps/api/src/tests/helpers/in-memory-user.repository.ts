import type { UserRepository } from "../../modules/users/user.repository.js";
import type { UserRecord } from "../../modules/users/user.types.js";
import { AppError } from "../../shared/app-error.js";

type StoredUser = UserRecord;

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, StoredUser>();
  private nextId = 1;

  async create(input: { email: string; passwordHash: string }): Promise<UserRecord> {
    const now = new Date();
    const user: StoredUser = {
      id: `user-${this.nextId++}`,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    return { ...user };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = [...this.users.values()].find((entry) => entry.email === email);
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async update(id: string, input: { email?: string; passwordHash?: string }): Promise<UserRecord> {
    const currentUser = this.users.get(id);

    if (!currentUser) {
      throw new AppError("User not found.", 404);
    }

    const updatedUser: StoredUser = {
      ...currentUser,
      email: input.email ?? currentUser.email,
      passwordHash: input.passwordHash ?? currentUser.passwordHash,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return { ...updatedUser };
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}
