import type { JwtPayload } from "../modules/auth/token-service.js";

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
      user?: {
        id: string;
        email: string;
        roleName: string;
        permissions: string[];
      };
    }
  }
}

export {};
