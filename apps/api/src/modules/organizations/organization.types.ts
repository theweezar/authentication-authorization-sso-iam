export type OrganizationRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrganizationInput = {
  name: string;
  email: string;
  phone: string;
  address?: string;
};
