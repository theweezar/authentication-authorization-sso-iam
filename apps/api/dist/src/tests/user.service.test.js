import test from "node:test";
import assert from "node:assert/strict";
import { ScryptPasswordHasher } from "../modules/auth/password-hasher.js";
import { UserService } from "../modules/users/user.service.js";
import { AppError } from "../shared/app-error.js";
import { InMemoryUserRepository } from "./helpers/in-memory-user.repository.js";
test("createUser stores a hashed password and normalizes email", async () => {
    const repository = new InMemoryUserRepository();
    const service = new UserService(repository, new ScryptPasswordHasher());
    const createdUser = await service.createUser({
        email: "  USER@Example.com ",
        password: "strong-pass-1",
    });
    assert.equal(createdUser.email, "user@example.com");
    const storedUser = await repository.findById(createdUser.id);
    assert.ok(storedUser);
    assert.notEqual(storedUser.passwordHash, "strong-pass-1");
});
test("createUser rejects duplicate email addresses", async () => {
    const repository = new InMemoryUserRepository();
    const service = new UserService(repository, new ScryptPasswordHasher());
    await service.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    await assert.rejects(service.createUser({
        email: "USER@example.com",
        password: "strong-pass-2",
    }), (error) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        return true;
    });
});
test("updateUser updates email and password hash", async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new ScryptPasswordHasher();
    const service = new UserService(repository, hasher);
    const createdUser = await service.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    const beforeUpdate = await repository.findById(createdUser.id);
    const updatedUser = await service.updateUser(createdUser.id, {
        email: "new@example.com",
        password: "strong-pass-2",
    });
    assert.equal(updatedUser.email, "new@example.com");
    const afterUpdate = await repository.findById(createdUser.id);
    assert.ok(beforeUpdate);
    assert.ok(afterUpdate);
    assert.notEqual(beforeUpdate.passwordHash, afterUpdate.passwordHash);
    assert.equal(await hasher.compare("strong-pass-2", afterUpdate.passwordHash), true);
});
test("deleteUser rejects unknown users", async () => {
    const repository = new InMemoryUserRepository();
    const service = new UserService(repository, new ScryptPasswordHasher());
    await assert.rejects(service.deleteUser("missing-user"), (error) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 404);
        return true;
    });
});
test("updateUser rejects blank email values", async () => {
    const repository = new InMemoryUserRepository();
    const service = new UserService(repository, new ScryptPasswordHasher());
    const createdUser = await service.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    await assert.rejects(service.updateUser(createdUser.id, {
        email: "   ",
    }), (error) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        return true;
    });
});
