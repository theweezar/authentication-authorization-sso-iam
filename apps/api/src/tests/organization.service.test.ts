import test from "node:test";
import assert from "node:assert/strict";
import { ScryptPasswordHasher } from "../modules/auth/password-hasher.js";
import { OrganizationService } from "../modules/organizations/organization.service.js";
import { createInMemoryIdentityContext } from "./helpers/in-memory-user.repository.js";

test("createOrganization creates the organization and a SuperAdmin user with a one-time password", async () => {
  const context = createInMemoryIdentityContext();
  const passwordHasher = new ScryptPasswordHasher();
  const service = new OrganizationService(
    context.transactionManager,
    context.organizationRepository,
    context.userRepository,
    context.roleRepository,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    passwordHasher,
    () => "FixedPassword!12345",
  );

  const result = await service.createOrganization({
    name: "Acme Corp",
    email: "owner@acme.test",
    phone: "1234567890",
    address: "123 Main Street",
  });

  assert.equal(result.organization.name, "Acme Corp");
  assert.equal(result.generatedPassword, "FixedPassword!12345");

  const createdUser = await context.userRepository.findByEmail("owner@acme.test");
  assert.ok(createdUser);
  assert.equal(createdUser.roleName, "SuperAdmin");
  assert.equal(createdUser.phone, "1234567890");
  assert.equal(
    await passwordHasher.compare("FixedPassword!12345", createdUser.passwordHash),
    true,
  );
});

test("createOrganization rolls back when the user bootstrap step fails", async () => {
  const context = createInMemoryIdentityContext();
  const passwordHasher = new ScryptPasswordHasher();
  const failingUserRepository = {
    create: async () => {
      throw new Error("user creation failed");
    },
    findByEmail: context.userRepository.findByEmail.bind(context.userRepository),
    findByPhone: context.userRepository.findByPhone.bind(context.userRepository),
    findById: context.userRepository.findById.bind(context.userRepository),
    update: context.userRepository.update.bind(context.userRepository),
    delete: context.userRepository.delete.bind(context.userRepository),
    bulkDelete: context.userRepository.bulkDelete.bind(context.userRepository),
    bulkUpdateRoles: context.userRepository.bulkUpdateRoles.bind(context.userRepository),
    countByRoleId: context.userRepository.countByRoleId.bind(context.userRepository),
  };
  const service = new OrganizationService(
    context.transactionManager,
    context.organizationRepository,
    failingUserRepository,
    context.roleRepository,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    passwordHasher,
    () => "FixedPassword!12345",
  );

  await assert.rejects(
    service.createOrganization({
      name: "Rollback Corp",
      email: "rollback@corp.test",
      phone: "1234500000",
    }),
  );

  const organization = await context.organizationRepository.findByEmail("rollback@corp.test");
  assert.equal(organization, null);
});
