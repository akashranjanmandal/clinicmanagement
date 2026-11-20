import { NextResponse } from "next/server";
import { availableSlots } from "@/lib/appointments";
import { isDatabaseConfigured } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (
    !doctorId ||
    doctorId.length > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return NextResponse.json({ error: "Choose a doctor and a valid date." }, { status: 400 });
  }
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Online booking is being set up. Please call the clinic to arrange a visit." },
      { status: 503 },
    );
  }
  try {
    const rate = await consumeRateLimit(request, "availability", 120, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many availability checks. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
    const slots = await availableSlots(doctorId, date);
    return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load appointment availability.", error);
    return NextResponse.json(
      { error: "We couldn't check availability. Please try again." },
      { status: 500 },
    );
  }
}
