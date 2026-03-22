export type RoleRecord = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
};
