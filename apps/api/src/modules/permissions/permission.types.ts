export type PermissionRecord = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export type PermissionAssignmentRecord = {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
};

export type CreatePermissionInput = {
  name: string;
  description: string;
};
