import { AppError } from "../../shared/app-error.js";
import type { UserRepository } from "../users/user.repository.js";
import type { SafeUser, UserRecord } from "../users/user.types.js";
import type { PasswordHasher } from "./password-hasher.js";
import type { TokenService } from "./token-service.js";

type AuthenticatedUser = {
  token: string;
  user: SafeUser;
};

const sanitizeUser = ({ passwordHash: _passwordHash, ...user }: UserRecord): SafeUser => user;

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<SafeUser> {
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

  async authenticate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.validateCredentials(email, password);
    const token = this.tokenService.generateToken({
      userId: user.id,
      role: user.roleName,
      permissions: user.permissions,
    });

    return {
      token,
      user,
    };
  }
}
