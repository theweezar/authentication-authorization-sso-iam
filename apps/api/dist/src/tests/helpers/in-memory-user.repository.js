import { AppError } from "../../shared/app-error.js";
export class InMemoryUserRepository {
    users = new Map();
    nextId = 1;
    async create(input) {
        const now = new Date();
        const user = {
            id: `user-${this.nextId++}`,
            email: input.email,
            passwordHash: input.passwordHash,
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(user.id, user);
        return { ...user };
    }
    async findByEmail(email) {
        const user = [...this.users.values()].find((entry) => entry.email === email);
        return user ? { ...user } : null;
    }
    async findById(id) {
        const user = this.users.get(id);
        return user ? { ...user } : null;
    }
    async update(id, input) {
        const currentUser = this.users.get(id);
        if (!currentUser) {
            throw new AppError("User not found.", 404);
        }
        const updatedUser = {
            ...currentUser,
            email: input.email ?? currentUser.email,
            passwordHash: input.passwordHash ?? currentUser.passwordHash,
            updatedAt: new Date(),
        };
        this.users.set(id, updatedUser);
        return { ...updatedUser };
    }
    async delete(id) {
        this.users.delete(id);
    }
}
