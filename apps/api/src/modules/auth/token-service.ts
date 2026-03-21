import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId: string;
};

export interface TokenService {
  generateToken(payload: JwtPayload): string;
  verifyToken(token: string): JwtPayload;
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verifyToken(token: string): JwtPayload {
    const payload = jwt.verify(token, this.secret);

    if (!payload || typeof payload === "string" || typeof payload.userId !== "string") {
      throw new Error("Invalid token payload.");
    }

    return { userId: payload.userId };
  }
}
