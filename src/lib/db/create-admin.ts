import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured, requireDatabase } from "./index";
import { adminUsers } from "./schema";

async function createAdmin() {
  if (!isDatabaseConfigured || !db) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before creating an admin.");
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set a valid ADMIN_EMAIL.");
  }
  if (!password || password.length < 12) {
    throw new Error("Set ADMIN_PASSWORD to a value at least 12 characters long.");
  }
  const database = requireDatabase();
  const [existing] = await database
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing) throw new Error("An account already exists for that email; no changes were made.");
  await database.insert(adminUsers).values({
    email,
    name: name || "Clinic Administrator",
    passwordHash: await hash(password, 12),
    role: "super_admin",
  });
  console.info("Super-admin account created.");
}

createAdmin().catch((error: unknown) => {
  console.error("Could not create the super-admin account.", error);
  process.exitCode = 1;
});
