import { AppError } from "../../shared/app-error.js";
import type { PasswordHasher } from "../auth/password-hasher.js";
import type {
  CreateUserInput,
  SafeUser,
  UpdateUserInput,
  UserRecord,
} from "./user.types.js";
import type { UserRepository } from "./user.repository.js";

const sanitizeUser = ({ passwordHash: _passwordHash, ...user }: UserRecord): SafeUser => user;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const validateEmail = (email: string): void => {
  if (!email) {
    throw new AppError("Email is required.", 400);
  }
};

const validatePassword = (password: string): void => {
  if (password.trim().length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }
};

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async createUser(input: CreateUserInput): Promise<SafeUser> {
    const email = normalizeEmail(input.email);
    validateEmail(email);

    validatePassword(input.password);

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("Email is already in use.", 409);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({ email, passwordHash });

    return sanitizeUser(user);
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<SafeUser> {
    if (!input.email && !input.password) {
      throw new AppError("At least one field must be provided for update.", 400);
    }

    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found.", 404);
    }

    const nextEmail = input.email !== undefined ? normalizeEmail(input.email) : undefined;

    if (nextEmail !== undefined) {
      validateEmail(nextEmail);
      const duplicatedUser = await this.userRepository.findByEmail(nextEmail);

      if (duplicatedUser && duplicatedUser.id !== userId) {
        throw new AppError("Email is already in use.", 409);
      }
    }

    let passwordHash: string | undefined;

    if (input.password !== undefined) {
      validatePassword(input.password);
      passwordHash = await this.passwordHasher.hash(input.password);
    }

    const user = await this.userRepository.update(userId, {
      email: nextEmail,
      passwordHash,
    });

    return sanitizeUser(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found.", 404);
    }

    await this.userRepository.delete(userId);
  }
}
