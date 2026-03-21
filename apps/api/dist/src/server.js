import { createApp } from "./app.js";
import { env } from "./shared/env.js";
export const startServer = async () => {
    const { app } = createApp();
    await new Promise((resolve) => {
        app.listen(env.port, () => {
            console.log(`API server listening on port ${env.port}.`);
            resolve();
        });
    });
};
