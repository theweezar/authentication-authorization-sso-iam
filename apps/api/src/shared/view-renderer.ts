import { readFile } from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export const renderTemplate = async (
  templateName: string,
  context: Record<string, unknown>,
): Promise<string> => {
  const templatePath = path.resolve(process.cwd(), "views", templateName);

  let template = templateCache.get(templatePath);

  if (!template) {
    const source = await readFile(templatePath, "utf8");
    template = Handlebars.compile(source);
    templateCache.set(templatePath, template);
  }

  return template(context);
};
