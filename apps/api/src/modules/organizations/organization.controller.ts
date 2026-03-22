import type { Request, Response } from "express";
import { AppError } from "../../shared/app-error.js";
import { renderTemplate } from "../../shared/view-renderer.js";
import type { OrganizationService } from "./organization.service.js";

const renderOrganizationForm = async (
  response: Response,
  options?: {
    error?: string;
    values?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
  },
): Promise<void> => {
  response
    .status(options?.error ? 400 : 200)
    .type("html")
    .send(
      await renderTemplate("organizations/create.hbs", {
        error: options?.error,
        values: options?.values ?? {},
      }),
    );
};

export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  renderCreateForm = async (_request: Request, response: Response): Promise<void> => {
    await renderOrganizationForm(response);
  };

  createOrganization = async (request: Request, response: Response): Promise<void> => {
    try {
      const result = await this.organizationService.createOrganization({
        name: request.body.name,
        email: request.body.email,
        phone: request.body.phone,
        address: request.body.address,
      });

      response
        .status(201)
        .type("html")
        .send(
          await renderTemplate("organizations/created.hbs", {
            organization: result.organization,
            superAdminUser: result.superAdminUser,
            generatedPassword: result.generatedPassword,
          }),
        );
    } catch (error) {
      if (error instanceof AppError) {
        await renderOrganizationForm(response, {
          error: error.message,
          values: request.body,
        });
        return;
      }

      throw error;
    }
  };
}
