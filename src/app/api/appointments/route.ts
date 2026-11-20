import { NextResponse } from "next/server";
import { createAppointment } from "@/lib/appointments";
import { isDatabaseConfigured } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { bookingSchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Online booking is being set up. Please call the clinic to arrange a visit." },
      { status: 503 },
    );
  }
  try {
    const rate = await consumeRateLimit(request, "appointments", 8, 60 * 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many booking attempts. Please wait or call the clinic." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("Appointment rate limiting is unavailable.", error);
    return NextResponse.json({ error: "Online booking is temporarily unavailable." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit valid appointment details." }, { status: 400 });
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details and try again." },
      { status: 400 },
    );
  }

  try {
    const appointment = await createAppointment(parsed.data);
    return NextResponse.json(appointment, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /no longer available|just booked|future date/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Could not create appointment.", error);
    return NextResponse.json(
      { error: "We couldn't save your request. Please try again or call the clinic." },
      { status: 500 },
    );
  }
}
