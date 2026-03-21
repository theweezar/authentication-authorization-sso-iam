import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export class ScryptPasswordHasher {
    async hash(password) {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = (await scrypt(password, salt, 64));
        return `scrypt$${salt}$${derivedKey.toString("hex")}`;
    }
    async compare(password, passwordHash) {
        const [algorithm, salt, storedHash] = passwordHash.split("$");
        if (algorithm !== "scrypt" || !salt || !storedHash) {
            return false;
        }
        const derivedKey = (await scrypt(password, salt, 64));
        const storedBuffer = Buffer.from(storedHash, "hex");
        if (storedBuffer.length !== derivedKey.length) {
            return false;
        }
        return timingSafeEqual(storedBuffer, derivedKey);
    }
}
