import { startServer } from "./src/server.js";

startServer().catch((error) => {
  console.error("Failed to start API server.", error);
  process.exitCode = 1;
});
