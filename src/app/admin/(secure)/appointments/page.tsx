import { desc, eq } from "drizzle-orm";
import { AdminAppointments } from "@/components/admin-appointments";
import { db } from "@/lib/db";
import { appointments, doctors } from "@/lib/db/schema";

export default async function AdminAppointmentsPage() {
  const initialRows = db
    ? await db
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
        })
        .from(appointments)
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime))
        .limit(50)
    : [];
  return <AdminAppointments initialRows={initialRows} />;
}
