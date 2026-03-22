import { Router } from "express";
import type { OrganizationController } from "./organization.controller.js";

export const createOrganizationRouter = (
  organizationController: OrganizationController,
): Router => {
  const router = Router();

  router.get("/new", organizationController.renderCreateForm);
  router.post("/", organizationController.createOrganization);

  return router;
};
