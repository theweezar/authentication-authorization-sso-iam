import { AppError } from "../../shared/app-error.js";
import type { ActorContext } from "../../shared/actor.types.js";
import { SYSTEM_ROLE_NAMES } from "../../shared/constants/system-identity.js";
import type { PrismaTransactionManager } from "../../infrastructure/prisma/prisma-transaction.js";
import {
  cleanOptionalText,
  normalizeEmail,
  normalizePhone,
  requireValue,
  validatePassword,
} from "../../shared/identity-input.js";
import type { PasswordHasher } from "../auth/password-hasher.js";
import type { RoleRepository } from "../roles/role.repository.js";
import type {
  CreateUserInput,
  SafeUser,
  UpdateUserInput,
  UserRecord,
} from "./user.types.js";
import type { UserRepository } from "./user.repository.js";

const sanitizeUser = ({ passwordHash: _passwordHash, ...user }: UserRecord): SafeUser => user;

const ensureAdminLifecyclePermission = (targetRoleName: string, actor: ActorContext): void => {
  if (targetRoleName === SYSTEM_ROLE_NAMES.admin && actor.role !== SYSTEM_ROLE_NAMES.superAdmin) {
    throw new AppError("Only SuperAdmin can manage Admin users.", 403);
  }
};

export class UserService {
  constructor(
    private readonly transactionManager: PrismaTransactionManager,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async createUser(input: CreateUserInput, actor: ActorContext): Promise<SafeUser> {
    if (!["SuperAdmin", "Admin"].includes(actor.role)) {
      throw new AppError("You are not allowed to create users.", 403);
    }

    requireValue(input.organizationId, "Organization id is required.");
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const firstName = cleanOptionalText(input.firstName) ?? undefined;
    const lastName = cleanOptionalText(input.lastName) ?? undefined;

    requireValue(email, "Email is required.");
    requireValue(phone, "Phone is required.");
    validatePassword(input.password);

    const role = await this.roleRepository.findById(input.roleId);

    if (!role) {
      throw new AppError("Role not found.", 404);
    }

    ensureAdminLifecyclePermission(role.name, actor);

    const existingUser = await this.userRepository.findByEmail(email);
    const existingPhone = await this.userRepository.findByPhone(phone);

    if (existingUser) {
      throw new AppError("Email is already in use.", 409);
    }

    if (existingPhone) {
      throw new AppError("Phone is already in use.", 409);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      organizationId: input.organizationId,
      roleId: input.roleId,
      email,
      phone,
      firstName,
      lastName,
      passwordHash,
      createdById: actor.userId,
    });

    return sanitizeUser(user);
  }

  async updateUser(userId: string, input: UpdateUserInput, actor: ActorContext): Promise<SafeUser> {
    if (
      !input.email &&
      !input.phone &&
      input.firstName === undefined &&
      input.lastName === undefined &&
      !input.password &&
      !input.roleId
    ) {
      throw new AppError("At least one field must be provided for update.", 400);
    }

    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found.", 404);
    }

    const nextEmail = input.email !== undefined ? normalizeEmail(input.email) : undefined;
    const nextPhone = input.phone !== undefined ? normalizePhone(input.phone) : undefined;
    const firstName = input.firstName !== undefined ? cleanOptionalText(input.firstName) : undefined;
    const lastName = input.lastName !== undefined ? cleanOptionalText(input.lastName) : undefined;

    if (nextEmail !== undefined) {
      requireValue(nextEmail, "Email is required.");
      const duplicatedUser = await this.userRepository.findByEmail(nextEmail);

      if (duplicatedUser && duplicatedUser.id !== userId) {
        throw new AppError("Email is already in use.", 409);
      }
    }

    if (nextPhone !== undefined) {
      requireValue(nextPhone, "Phone is required.");
      const duplicatedPhone = await this.userRepository.findByPhone(nextPhone);

      if (duplicatedPhone && duplicatedPhone.id !== userId) {
        throw new AppError("Phone is already in use.", 409);
      }
    }

    let roleId: string | undefined;

    if (input.roleId !== undefined) {
      const role = await this.roleRepository.findById(input.roleId);

      if (!role) {
        throw new AppError("Role not found.", 404);
      }

      ensureAdminLifecyclePermission(role.name, actor);
      roleId = role.id;
    }

    let passwordHash: string | undefined;

    if (input.password !== undefined) {
      validatePassword(input.password);
      passwordHash = await this.passwordHasher.hash(input.password);
    }

    const user = await this.userRepository.update(userId, {
      roleId,
      email: nextEmail,
      phone: nextPhone,
      firstName,
      lastName,
      passwordHash,
    });

    return sanitizeUser(user);
  }

  async deleteUser(userId: string, actor: ActorContext): Promise<void> {
    if (!["SuperAdmin", "Admin"].includes(actor.role)) {
      throw new AppError("You are not allowed to remove users.", 403);
    }

    const existingUser = await this.userRepository.findById(userId);

    if (!existingUser) {
      throw new AppError("User not found.", 404);
    }

    ensureAdminLifecyclePermission(existingUser.roleName, actor);

    await this.userRepository.delete(userId);
  }

  async bulkDeleteUsers(userIds: string[], actor: ActorContext): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    await this.transactionManager.$transaction(async (tx) => {
      for (const userId of userIds) {
        const existingUser = await this.userRepository.findById(userId, tx);

        if (!existingUser) {
          throw new AppError("User not found.", 404);
        }

        ensureAdminLifecyclePermission(existingUser.roleName, actor);
      }

      await this.userRepository.bulkDelete(userIds, tx);
    });
  }

  async bulkUpdateUserRoles(
    updates: Array<{ userId: string; roleId: string }>,
    actor: ActorContext,
  ): Promise<SafeUser[]> {
    if (updates.length === 0) {
      return [];
    }

    return this.transactionManager.$transaction(async (tx) => {
      for (const update of updates) {
        const role = await this.roleRepository.findById(update.roleId, tx);

        if (!role) {
          throw new AppError("Role not found.", 404);
        }

        const user = await this.userRepository.findById(update.userId, tx);

        if (!user) {
          throw new AppError("User not found.", 404);
        }

        ensureAdminLifecyclePermission(role.name, actor);
      }

      const users = await this.userRepository.bulkUpdateRoles(
        updates.map((update) => ({
          id: update.userId,
          roleId: update.roleId,
        })),
        tx,
      );

      return users.map(sanitizeUser);
    });
  }
}
