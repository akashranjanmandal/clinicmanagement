import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { clinicToday } from "@/lib/clinic-date";
import { db } from "@/lib/db";
import { appointments, doctors } from "@/lib/db/schema";

export async function GET(request: Request) {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const status = searchParams.get("status") ?? "";
  const offset = Math.min(10000, Math.max(0, Number(searchParams.get("offset") ?? 0) || 0));
  const when = searchParams.get("when") ?? "";
  const today = await clinicToday();
  const where = [];
  if (when === "today") where.push(eq(appointments.appointmentDate, today));
  if (when === "upcoming") where.push(gt(appointments.appointmentDate, today));
  if (when === "past") where.push(lt(appointments.appointmentDate, today));
  if (query) {
    const term = `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    where.push(or(like(appointments.patientName, term), like(appointments.patientPhone, term), like(appointments.reference, term))!);
  }
  if (["pending", "confirmed", "completed", "cancelled", "no_show"].includes(status)) {
    where.push(eq(appointments.status, status as typeof appointments.$inferSelect.status));
  }
  try {
    const rows = await db
      .select({
        id: appointments.id,
        reference: appointments.reference,
        patientName: appointments.patientName,
        patientPhone: appointments.patientPhone,
        patientEmail: appointments.patientEmail,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        status: appointments.status,
        reason: appointments.reason,
        adminNote: appointments.adminNote,
        doctorName: doctors.name,
        departmentId: doctors.departmentId,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(where.length ? and(...where) : undefined)
      .orderBy(...(when === "today" || when === "upcoming" || status === "pending"
        ? [asc(appointments.appointmentDate), asc(appointments.startTime)]
        : [desc(appointments.appointmentDate), asc(appointments.startTime)]))
      .limit(50)
      .offset(offset);
    return NextResponse.json({ appointments: rows, hasMore: rows.length === 50, today }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load admin appointments.", error);
    return NextResponse.json({ error: "Appointments could not be loaded." }, { status: 500 });
  }
}
