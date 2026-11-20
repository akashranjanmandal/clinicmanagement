import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const isDatabaseConfigured = Boolean(
  url && (authToken || url.startsWith("file:")),
);
export const db = isDatabaseConfigured
  ? drizzle(
      createClient({
        url: url!,
        authToken,
      }),
      { schema },
    )
  : null;

export function requireDatabase() {
  if (!db) {
    throw new Error(
      "Database is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
    );
  }
  return db;
}
