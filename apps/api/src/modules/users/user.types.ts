export type UserRecord = {
  id: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  email: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export type CreateUserInput = {
  organizationId: string;
  roleId: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  password: string;
};

export type UpdateUserInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roleId?: string;
};

export type SafeUser = Omit<UserRecord, "passwordHash">;
