import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createAdminSession, adminSessionCookie } from "@/lib/admin-auth";
import { db, isDatabaseConfigured } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ error: "Admin sign-in is not configured." }, { status: 503 });
  }
  try {
    const rate = await consumeRateLimit(request, "admin-login", 5, 15 * 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("Admin login rate limiting is unavailable.", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  try {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, parsed.data.email.toLowerCase()))
      .limit(1);
    const valid = user?.isActive && await compare(parsed.data.password, user.passwordHash);
    if (!valid || !user) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const token = await createAdminSession(user);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie.name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: adminSessionCookie.maxAge,
    });
    return response;
  } catch (error) {
    console.error("Admin sign-in failed.", error);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 500 });
  }
}
