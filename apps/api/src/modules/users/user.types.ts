export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  email: string;
  password: string;
};

export type UpdateUserInput = {
  email?: string;
  password?: string;
};

export type SafeUser = Omit<UserRecord, "passwordHash">;
