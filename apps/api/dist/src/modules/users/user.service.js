import { AppError } from "../../shared/app-error.js";
const sanitizeUser = ({ passwordHash: _passwordHash, ...user }) => user;
const normalizeEmail = (email) => email.trim().toLowerCase();
const validateEmail = (email) => {
    if (!email) {
        throw new AppError("Email is required.", 400);
    }
};
const validatePassword = (password) => {
    if (password.trim().length < 8) {
        throw new AppError("Password must be at least 8 characters long.", 400);
    }
};
export class UserService {
    userRepository;
    passwordHasher;
    constructor(userRepository, passwordHasher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }
    async createUser(input) {
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
    async updateUser(userId, input) {
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
        let passwordHash;
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
    async deleteUser(userId) {
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new AppError("User not found.", 404);
        }
        await this.userRepository.delete(userId);
    }
}
