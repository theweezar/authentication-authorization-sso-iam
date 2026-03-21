import type { UpdateUserInput, UserRecord } from "./user.types.js";

export interface UserRepository {
  create(input: { email: string; passwordHash: string }): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  update(id: string, input: { email?: string; passwordHash?: string }): Promise<UserRecord>;
  delete(id: string): Promise<void>;
}

export type UpdateUserPersistenceInput = UpdateUserInput & {
  passwordHash?: string;
};
