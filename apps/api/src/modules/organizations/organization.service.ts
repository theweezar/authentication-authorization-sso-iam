import { AppError } from "../../shared/app-error.js";
import { SYSTEM_ROLE_NAMES } from "../../shared/constants/system-identity.js";
import { SYSTEM_PERMISSION_NAMES } from "../../shared/constants/system-identity.js";
import type { PrismaTransactionManager } from "../../infrastructure/prisma/prisma-transaction.js";
import { normalizeEmail, normalizePhone, requireValue } from "../../shared/identity-input.js";
import type { PasswordHasher } from "../auth/password-hasher.js";
import type {
  PermissionAssignmentRepository,
  PermissionRepository,
} from "../permissions/permission.repository.js";
import type { RoleRepository } from "../roles/role.repository.js";
import type { UserRepository } from "../users/user.repository.js";
import type { OrganizationRepository } from "./organization.repository.js";
import type { CreateOrganizationInput, OrganizationRecord } from "./organization.types.js";

type PasswordGenerator = () => string;

export type OrganizationCreationResult = {
  organization: OrganizationRecord;
  superAdminUser: {
    email: string;
    phone: string;
  };
  generatedPassword: string;
};

export class OrganizationService {
  constructor(
    private readonly transactionManager: PrismaTransactionManager,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionAssignmentRepository: PermissionAssignmentRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordGenerator: PasswordGenerator,
  ) {}

  async createOrganization(input: CreateOrganizationInput): Promise<OrganizationCreationResult> {
    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const address = input.address?.trim();

    requireValue(name, "Organization name is required.");
    requireValue(email, "Organization email is required.");
    requireValue(phone, "Organization phone is required.");

    if (await this.organizationRepository.findByEmail(email)) {
      throw new AppError("Organization email is already in use.", 409);
    }

    if (await this.organizationRepository.findByPhone(phone)) {
      throw new AppError("Organization phone is already in use.", 409);
    }

    if (await this.userRepository.findByEmail(email)) {
      throw new AppError("User email is already in use.", 409);
    }

    if (await this.userRepository.findByPhone(phone)) {
      throw new AppError("User phone is already in use.", 409);
    }

    const generatedPassword = this.passwordGenerator();
    const passwordHash = await this.passwordHasher.hash(generatedPassword);
    const organization = await this.transactionManager.$transaction(async (tx) => {
      const superAdminRole =
        (await this.roleRepository.findByName(SYSTEM_ROLE_NAMES.superAdmin, tx)) ??
        (await this.roleRepository.create(
          {
            name: SYSTEM_ROLE_NAMES.superAdmin,
            description: "System SuperAdmin role",
            createdById: null,
          },
          tx,
        ));
      const systemPermission =
        (await this.permissionRepository.findByName(SYSTEM_PERMISSION_NAMES.system, tx)) ??
        (await this.permissionRepository.create(
          {
            name: SYSTEM_PERMISSION_NAMES.system,
            description: "System-level access",
            createdById: null,
          },
          tx,
        ));

      if (
        !(await this.permissionAssignmentRepository.findByRoleAndPermission(
          superAdminRole.id,
          systemPermission.id,
          tx,
        ))
      ) {
        await this.permissionAssignmentRepository.create(
          {
            roleId: superAdminRole.id,
            permissionId: systemPermission.id,
            createdById: null,
          },
          tx,
        );
      }

      const createdOrganization = await this.organizationRepository.create(
        {
          name,
          email,
          phone,
          address,
        },
        tx,
      );

      await this.userRepository.create(
        {
          organizationId: createdOrganization.id,
          roleId: superAdminRole.id,
          email,
          phone,
          passwordHash,
          createdById: null,
        },
        tx,
      );

      return createdOrganization;
    });

    return {
      organization,
      superAdminUser: {
        email,
        phone,
      },
      generatedPassword,
    };
  }
}
