import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, passwordHash: string): Promise<boolean>;
}

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString("hex")}`;
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    const [algorithm, salt, storedHash] = passwordHash.split("$");

    if (algorithm !== "scrypt" || !salt || !storedHash) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (storedBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
  }
}
