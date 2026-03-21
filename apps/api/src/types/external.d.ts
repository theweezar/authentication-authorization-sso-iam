declare module "passport" {
  const passport: any;
  export default passport;
}

declare module "passport-strategy" {
  export class Strategy {
    name: string;
    success(user: unknown, info?: unknown): void;
    fail(challenge?: unknown, status?: number): void;
    error(error: Error): void;
    authenticate(req: unknown, options?: unknown): void;
  }
}

declare module "jsonwebtoken" {
  const jwt: any;
  export default jwt;
}
