import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const schema = "./src/lib/db/schema.ts";
const out = "./drizzle";

export default url.startsWith("file:")
  ? defineConfig({ schema, out, dialect: "sqlite", dbCredentials: { url } })
  : defineConfig({
      schema,
      out,
      dialect: "turso",
      dbCredentials: {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN ?? "",
      },
    });
