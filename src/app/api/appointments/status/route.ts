import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/lib/db";
import { appointments, doctors } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  reference: z.string().trim().min(4).max(40),
  phone: z.string().trim().min(7).max(25),
});

const lastDigits = (value: string) => value.replace(/\D/g, "").slice(-10);

export async function POST(request: Request) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ error: "Status lookup is being set up. Please call the clinic." }, { status: 503 });
  }
  try {
    const rate = await consumeRateLimit(request, "appointment-status", 20, 60 * 60);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please wait a while or call the clinic." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    }
  } catch {
    return NextResponse.json({ error: "Status lookup is temporarily unavailable." }, { status: 503 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your booking number and mobile number." }, { status: 400 });

  const [row] = await db
    .select({
      status: appointments.status,
      reference: appointments.reference,
      patientPhone: appointments.patientPhone,
      appointmentDate: appointments.appointmentDate,
      startTime: appointments.startTime,
      doctorName: doctors.name,
    })
    .from(appointments)
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(eq(appointments.reference, parsed.data.reference.toUpperCase()))
    .limit(1);

  // Both the booking number AND the phone number must match, so bookings cannot be browsed.
  if (!row || lastDigits(row.patientPhone) !== lastDigits(parsed.data.phone)) {
    return NextResponse.json({ error: "We couldn't find a booking with those details. Please check the booking number and mobile number." }, { status: 404 });
  }
  return NextResponse.json(
    { status: row.status, reference: row.reference, doctorName: row.doctorName, appointmentDate: row.appointmentDate, startTime: row.startTime },
    { headers: { "Cache-Control": "no-store" } },
  );
}
