import { createApp } from "./app.js";
import { env } from "./shared/env.js";

export const startServer = async (): Promise<void> => {
  const { app } = createApp();

  await new Promise<void>((resolve) => {
    app.listen(env.port, () => {
      console.log(`API server listening on port ${env.port}.`);
      resolve();
    });
  });
};
