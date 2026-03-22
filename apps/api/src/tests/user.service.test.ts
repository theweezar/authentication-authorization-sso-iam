import test from "node:test";
import assert from "node:assert/strict";
import { ScryptPasswordHasher } from "../modules/auth/password-hasher.js";
import { OrganizationService } from "../modules/organizations/organization.service.js";
import { UserService } from "../modules/users/user.service.js";
import { AppError } from "../shared/app-error.js";
import { createInMemoryIdentityContext } from "./helpers/in-memory-user.repository.js";

const toActor = (user: { id: string; roleName: string; permissions: string[] }) => ({
  userId: user.id,
  role: user.roleName,
  permissions: user.permissions,
});

test("Admin users cannot create other Admin users", async () => {
  const context = createInMemoryIdentityContext();
  const passwordHasher = new ScryptPasswordHasher();
  const organizationService = new OrganizationService(
    context.transactionManager,
    context.organizationRepository,
    context.userRepository,
    context.roleRepository,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    passwordHasher,
    () => "BootstrapPassword!123",
  );
  const userService = new UserService(
    context.transactionManager,
    context.userRepository,
    context.roleRepository,
    passwordHasher,
  );
  const organization = await organizationService.createOrganization({
    name: "Example Org",
    email: "owner@example.test",
    phone: "1000000000",
  });
  const superAdmin = await context.userRepository.findByEmail("owner@example.test");
  const adminRole = await context.roleRepository.findByName("Admin");

  assert.ok(superAdmin);
  assert.ok(adminRole);

  const createdAdmin = await userService.createUser(
    {
      organizationId: organization.organization.id,
      roleId: adminRole.id,
      email: "admin@example.test",
      phone: "1000000001",
      password: "AdminPassword!123",
    },
    toActor(superAdmin),
  );

  await assert.rejects(
    userService.createUser(
      {
        organizationId: organization.organization.id,
        roleId: adminRole.id,
        email: "second-admin@example.test",
        phone: "1000000002",
        password: "SecondAdmin!123",
      },
      toActor(createdAdmin),
    ),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

test("Admin users cannot remove other Admin users", async () => {
  const context = createInMemoryIdentityContext();
  const passwordHasher = new ScryptPasswordHasher();
  const organizationService = new OrganizationService(
    context.transactionManager,
    context.organizationRepository,
    context.userRepository,
    context.roleRepository,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    passwordHasher,
    () => "BootstrapPassword!123",
  );
  const userService = new UserService(
    context.transactionManager,
    context.userRepository,
    context.roleRepository,
    passwordHasher,
  );
  const organization = await organizationService.createOrganization({
    name: "Delete Org",
    email: "owner@delete.test",
    phone: "2000000000",
  });
  const superAdmin = await context.userRepository.findByEmail("owner@delete.test");
  const adminRole = await context.roleRepository.findByName("Admin");

  assert.ok(superAdmin);
  assert.ok(adminRole);

  const firstAdmin = await userService.createUser(
    {
      organizationId: organization.organization.id,
      roleId: adminRole.id,
      email: "admin-one@delete.test",
      phone: "2000000001",
      password: "AdminOnePassword!123",
    },
    toActor(superAdmin),
  );

  const secondAdmin = await userService.createUser(
    {
      organizationId: organization.organization.id,
      roleId: adminRole.id,
      email: "admin-two@delete.test",
      phone: "2000000002",
      password: "AdminTwoPassword!123",
    },
    toActor(superAdmin),
  );

  await assert.rejects(
    userService.deleteUser(secondAdmin.id, toActor(firstAdmin)),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

test("bulkDeleteUsers rolls back when one deletion is not allowed", async () => {
  const context = createInMemoryIdentityContext();
  const passwordHasher = new ScryptPasswordHasher();
  const organizationService = new OrganizationService(
    context.transactionManager,
    context.organizationRepository,
    context.userRepository,
    context.roleRepository,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    passwordHasher,
    () => "BootstrapPassword!123",
  );
  const userService = new UserService(
    context.transactionManager,
    context.userRepository,
    context.roleRepository,
    passwordHasher,
  );
  const organization = await organizationService.createOrganization({
    name: "Bulk Delete Org",
    email: "owner@bulk-delete.test",
    phone: "2100000000",
  });
  const superAdmin = await context.userRepository.findByEmail("owner@bulk-delete.test");
  const adminRole = await context.roleRepository.findByName("Admin");
  const memberRole = await context.roleRepository.create(
    { name: "Member", description: "Standard member role", createdById: "system" },
  );

  assert.ok(superAdmin);
  assert.ok(adminRole);

  const adminUser = await userService.createUser(
    {
      organizationId: organization.organization.id,
      roleId: adminRole.id,
      email: "managed-admin@bulk-delete.test",
      phone: "2100000001",
      password: "AdminManagedPassword!123",
    },
    toActor(superAdmin),
  );

  const memberUser = await userService.createUser(
    {
      organizationId: organization.organization.id,
      roleId: memberRole.id,
      email: "member@bulk-delete.test",
      phone: "2100000002",
      password: "MemberPassword!123",
    },
    toActor(superAdmin),
  );

  await assert.rejects(
    userService.bulkDeleteUsers([adminUser.id, memberUser.id], toActor(adminUser)),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 403);
      return true;
    },
  );

  assert.ok(await context.userRepository.findById(adminUser.id));
  assert.ok(await context.userRepository.findById(memberUser.id));
});
