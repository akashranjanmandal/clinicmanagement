import { NextResponse } from "next/server";
import { isDatabaseConfigured, requireDatabase } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { contactSchema } from "@/lib/validations";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Our contact form is being set up. Please call the clinic instead." },
      { status: 503 },
    );
  }
  try {
    const rate = await consumeRateLimit(request, "contact", 5, 60 * 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many messages were sent. Please wait or call the clinic." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("Contact rate limiting is unavailable.", error);
    return NextResponse.json({ error: "The contact form is temporarily unavailable." }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit a valid message." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the message details and try again." }, { status: 400 });
  }
  try {
    await requireDatabase().insert(contactMessages).values(parsed.data);
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not save contact message.", error);
    return NextResponse.json(
      { error: "We couldn't send your message. Please try again or call the clinic." },
      { status: 500 },
    );
  }
}
