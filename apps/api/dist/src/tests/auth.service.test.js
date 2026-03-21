import test from "node:test";
import assert from "node:assert/strict";
import { AuthService } from "../modules/auth/auth.service.js";
import { LocalStrategy } from "../modules/auth/local.strategy.js";
import { ScryptPasswordHasher } from "../modules/auth/password-hasher.js";
import { JwtTokenService } from "../modules/auth/token-service.js";
import { UserService } from "../modules/users/user.service.js";
import { AppError } from "../shared/app-error.js";
import { InMemoryUserRepository } from "./helpers/in-memory-user.repository.js";
test("authenticate returns a token that contains the user id", async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new ScryptPasswordHasher();
    const tokenService = new JwtTokenService("test-secret", "1h");
    const userService = new UserService(repository, hasher);
    const authService = new AuthService(repository, hasher, tokenService);
    const createdUser = await userService.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    const result = await authService.authenticate("user@example.com", "strong-pass-1");
    const payload = tokenService.verifyToken(result.token);
    assert.equal(result.user.id, createdUser.id);
    assert.equal(payload.userId, createdUser.id);
});
test("authenticate rejects invalid passwords", async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new ScryptPasswordHasher();
    const tokenService = new JwtTokenService("test-secret", "1h");
    const userService = new UserService(repository, hasher);
    const authService = new AuthService(repository, hasher, tokenService);
    await userService.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    await assert.rejects(authService.authenticate("user@example.com", "wrong-password"), (error) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 401);
        return true;
    });
});
test("local strategy fails when credentials are missing", async () => {
    const repository = new InMemoryUserRepository();
    const authService = new AuthService(repository, new ScryptPasswordHasher(), new JwtTokenService("test-secret", "1h"));
    const strategy = new LocalStrategy(authService);
    const failure = await new Promise((resolve) => {
        strategy.fail = (challenge, status) => resolve({ challenge, status });
        strategy.authenticate({ body: {} });
    });
    assert.deepEqual(failure, {
        challenge: { message: "Email and password are required." },
        status: 400,
    });
});
test("local strategy succeeds with valid credentials", async () => {
    const repository = new InMemoryUserRepository();
    const hasher = new ScryptPasswordHasher();
    const tokenService = new JwtTokenService("test-secret", "1h");
    const userService = new UserService(repository, hasher);
    const authService = new AuthService(repository, hasher, tokenService);
    const createdUser = await userService.createUser({
        email: "user@example.com",
        password: "strong-pass-1",
    });
    const strategy = new LocalStrategy(authService);
    const authenticatedUser = await new Promise((resolve) => {
        strategy.success = (user) => resolve(user);
        strategy.authenticate({
            body: { email: "user@example.com", password: "strong-pass-1" },
        });
    });
    assert.equal(authenticatedUser.id, createdUser.id);
    assert.equal(authenticatedUser.email, "user@example.com");
});
