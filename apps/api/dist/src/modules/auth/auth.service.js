import { AppError } from "../../shared/app-error.js";
const sanitizeUser = ({ passwordHash: _passwordHash, ...user }) => user;
export class AuthService {
    userRepository;
    passwordHasher;
    tokenService;
    constructor(userRepository, passwordHasher, tokenService) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
    }
    async validateCredentials(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new AppError("Invalid email or password.", 401);
        }
        const isValidPassword = await this.passwordHasher.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError("Invalid email or password.", 401);
        }
        return sanitizeUser(user);
    }
    async authenticate(email, password) {
        const user = await this.validateCredentials(email, password);
        const token = this.tokenService.generateToken({ userId: user.id });
        return {
            token,
            user,
        };
    }
}
