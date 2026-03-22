import { randomInt } from "node:crypto";

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

export const generateSecurePassword = (length = 20): string =>
  Array.from({ length }, () => PASSWORD_ALPHABET[randomInt(0, PASSWORD_ALPHABET.length)]).join("");
