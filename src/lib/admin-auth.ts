import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

const cookieName = "aster_admin_session";
const sessionLifetime = 60 * 60 * 8;

function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(user: {
  id: string;
  email: string;
  role: "super_admin" | "staff";
}) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("aster-clinic")
    .setAudience("aster-admin")
    .setIssuedAt()
    .setExpirationTime(`${sessionLifetime}s`)
    .sign(signingKey());
}

export async function getAdminSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !db) return null;
  const key = signingKey();
  let subject: string;
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: "aster-clinic",
      audience: "aster-admin",
    });
    if (!payload.sub) return null;
    subject = payload.sub;
  } catch {
    return null;
  }
  const [user] = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, subject))
    .limit(1);
  if (!user?.isActive) return null;
  return user;
}

export const adminSessionCookie = {
  name: cookieName,
  maxAge: sessionLifetime,
};
