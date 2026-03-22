import test from "node:test";
import assert from "node:assert/strict";
import { AuthService } from "../modules/auth/auth.service.js";
import { ScryptPasswordHasher } from "../modules/auth/password-hasher.js";
import { JwtTokenService } from "../modules/auth/token-service.js";
import { OrganizationService } from "../modules/organizations/organization.service.js";
import { createInMemoryIdentityContext } from "./helpers/in-memory-user.repository.js";
test("authenticate returns JWT payload with userId, role, and permissions", async () => {
    const context = createInMemoryIdentityContext();
    const passwordHasher = new ScryptPasswordHasher();
    const tokenService = new JwtTokenService("test-secret", "1h");
    const organizationService = new OrganizationService(context.transactionManager, context.organizationRepository, context.userRepository, context.roleRepository, context.permissionRepository, context.permissionAssignmentRepository, passwordHasher, () => "BootstrapPassword!123");
    const authService = new AuthService(context.userRepository, passwordHasher, tokenService);
    await organizationService.createOrganization({
        name: "JWT Org",
        email: "owner@jwt.test",
        phone: "3000000000",
    });
    const result = await authService.authenticate("owner@jwt.test", "BootstrapPassword!123");
    const payload = tokenService.verifyToken(result.token);
    assert.equal(payload.userId, result.user.id);
    assert.equal(payload.role, "SuperAdmin");
    assert.deepEqual(payload.permissions, ["SYSTEM"]);
});
