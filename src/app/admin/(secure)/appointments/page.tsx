import { count, eq } from "drizzle-orm";
import { AdminAppointments } from "@/components/admin-appointments";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";

const tabs = ["today", "pending", "upcoming", "past", "all"] as const;

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  let pending = 0;
  if (db) {
    const [row] = await db.select({ value: count() }).from(appointments).where(eq(appointments.status, "pending"));
    pending = row?.value ?? 0;
  }
  // Open on whatever needs attention: waiting requests first, otherwise today.
  const initialTab = tabs.find((item) => item === tab) ?? (pending > 0 ? "pending" : "today");
  return <AdminAppointments initialTab={initialTab} pending={pending} />;
}
