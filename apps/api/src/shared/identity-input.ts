import { AppError } from "./app-error.js";

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizePhone = (phone: string): string => phone.trim();

export const normalizePermissionName = (permissionName: string): string =>
  permissionName.trim().toUpperCase();

export const requireValue = (value: string, message: string): void => {
  if (!value.trim()) {
    throw new AppError(message, 400);
  }
};

export const cleanOptionalText = (value?: string): string | null => {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
};

export const validatePassword = (password: string): void => {
  if (password.trim().length < 12) {
    throw new AppError("Password must be at least 12 characters long.", 400);
  }
};

export const validatePermissionName = (permissionName: string): void => {
  if (!/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(permissionName)) {
    throw new AppError("Permission names must use UPPERCASE_SNAKE_CASE.", 400);
  }
};
