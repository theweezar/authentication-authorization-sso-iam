import jwt from "jsonwebtoken";
export class JwtTokenService {
    secret;
    expiresIn;
    constructor(secret, expiresIn) {
        this.secret = secret;
        this.expiresIn = expiresIn;
    }
    generateToken(payload) {
        return jwt.sign(payload, this.secret, {
            expiresIn: this.expiresIn,
        });
    }
    verifyToken(token) {
        const payload = jwt.verify(token, this.secret);
        if (!payload || typeof payload === "string" || typeof payload.userId !== "string") {
            throw new Error("Invalid token payload.");
        }
        return { userId: payload.userId };
    }
}
