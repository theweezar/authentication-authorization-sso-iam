import { AppError } from "../../shared/app-error.js";
import type { ActorContext } from "../../shared/actor.types.js";
import { SYSTEM_MANAGED_ROLE_NAMES } from "../../shared/constants/system-identity.js";
import { cleanOptionalText, requireValue } from "../../shared/identity-input.js";
import type { UserRepository } from "../users/user.repository.js";
import type { RoleRepository } from "./role.repository.js";
import type { CreateRoleInput, RoleRecord } from "./role.types.js";

const ensureRoleManager = (actor: ActorContext): void => {
  if (!["SuperAdmin", "Admin"].includes(actor.role)) {
    throw new AppError("You are not allowed to manage roles.", 403);
  }
};

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createRole(input: CreateRoleInput, actor: ActorContext): Promise<RoleRecord> {
    ensureRoleManager(actor);

    const name = input.name.trim();
    requireValue(name, "Role name is required.");

    if (await this.roleRepository.findByName(name)) {
      throw new AppError("Role name is already in use.", 409);
    }

    return this.roleRepository.create({
      name,
      description: cleanOptionalText(input.description) ?? undefined,
      createdById: actor.userId,
    });
  }

  async deleteRole(roleId: string, actor: ActorContext): Promise<void> {
    ensureRoleManager(actor);

    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new AppError("Role not found.", 404);
    }

    if (SYSTEM_MANAGED_ROLE_NAMES.has(role.name)) {
      throw new AppError("System roles cannot be removed.", 403);
    }

    if ((await this.userRepository.countByRoleId(roleId)) > 0) {
      throw new AppError("Cannot remove a role that is still assigned to users.", 409);
    }

    await this.roleRepository.delete(roleId);
  }
}
