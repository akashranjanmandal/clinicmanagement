import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { appointments, auditLogs } from "@/lib/db/schema";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  adminNote: z.string().trim().max(1000).nullable().optional(),
}).refine((value) => value.status !== undefined || value.adminNote !== undefined);

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  if (!db) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit a valid update." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Submit a valid update." }, { status: 400 });
  const { id } = await params;
  try {
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(appointments)
        .set(parsed.data)
        .where(eq(appointments.id, id))
        .returning({ id: appointments.id, status: appointments.status });
      if (!row) return null;
      await tx.insert(auditLogs).values({
        adminUserId: user.id,
        action: parsed.data.status ? `appointment.${parsed.data.status}` : "appointment.note_updated",
        entity: "appointment",
        entityId: id,
      });
      return row;
    });
    if (!updated) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not update appointment.", error);
    return NextResponse.json({ error: "Appointment could not be updated." }, { status: 500 });
  }
}
