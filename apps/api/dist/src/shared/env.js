import dotenv from "dotenv";
dotenv.config();
const toPortNumber = (value) => {
    const port = Number(value ?? "3000");
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error("PORT must be a positive integer.");
    }
    return port;
};
export const env = {
    databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
    jwtSecret: process.env.JWT_SECRET ?? "development-jwt-secret-change-me",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    port: toPortNumber(process.env.PORT),
};
