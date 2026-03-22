import test from "node:test";
import assert from "node:assert/strict";
import { PermissionService } from "../modules/permissions/permission.service.js";
import { RoleService } from "../modules/roles/role.service.js";
import { AppError } from "../shared/app-error.js";
import { createInMemoryIdentityContext } from "./helpers/in-memory-user.repository.js";

const actor = {
  userId: "system-actor",
  role: "Admin",
  permissions: ["ALL"],
};

test("assignPermissionToRole stores a permission assignment for a role", async () => {
  const context = createInMemoryIdentityContext();
  const roleService = new RoleService(context.roleRepository, context.userRepository);
  const permissionService = new PermissionService(
    context.transactionManager,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    context.roleRepository,
  );

  const role = await roleService.createRole(
    {
      name: "SupportAgent",
      description: "Support team role",
    },
    actor,
  );

  const permission = await permissionService.createPermission(
    {
      name: "USER_CREATE",
      description: "Create users",
    },
    actor,
  );

  const assignment = await permissionService.assignPermissionToRole(role.id, permission.id, actor);

  assert.equal(assignment.roleId, role.id);
  assert.equal(assignment.permissionId, permission.id);
});

test("assignPermissionsToRole rolls back when one assignment is invalid", async () => {
  const context = createInMemoryIdentityContext();
  const roleService = new RoleService(context.roleRepository, context.userRepository);
  const permissionService = new PermissionService(
    context.transactionManager,
    context.permissionRepository,
    context.permissionAssignmentRepository,
    context.roleRepository,
  );

  const role = await roleService.createRole(
    {
      name: "Auditor",
      description: "Audit role",
    },
    actor,
  );

  const existingPermission = await context.permissionRepository.findByName("SYSTEM");
  const newPermission = await permissionService.createPermission(
    {
      name: "ROLE_ASSIGN",
      description: "Assign roles",
    },
    actor,
  );

  assert.ok(existingPermission);

  await permissionService.assignPermissionToRole(role.id, existingPermission.id, actor);

  await assert.rejects(
    permissionService.assignPermissionsToRole(role.id, [existingPermission.id, newPermission.id], actor),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 409);
      return true;
    },
  );

  assert.equal(
    await context.permissionAssignmentRepository.findByRoleAndPermission(role.id, newPermission.id),
    null,
  );
});
