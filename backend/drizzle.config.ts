import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const isSsl =
  process.env.DB_SSL === "true" ||
  (Boolean(process.env.DATABASE_URL) &&
    (process.env.DATABASE_URL!.includes("render.com") ||
      process.env.DATABASE_URL!.includes("sslmode=require")));

export default defineConfig({
  schema: "./src/database/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL
    ? {
        url: process.env.DATABASE_URL,
        ssl: isSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST || "127.0.0.1",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "taskflow",
        ssl: isSsl ? { rejectUnauthorized: false } : false,
      },
  verbose: true,
  strict: true,
});
