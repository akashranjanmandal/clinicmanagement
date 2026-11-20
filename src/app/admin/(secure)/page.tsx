import Link from "next/link";
import { count, eq, gte } from "drizzle-orm";
import { ArrowUpRight, CalendarCheck, CalendarDays, Clock3, UsersRound } from "lucide-react";
import { db } from "@/lib/db";
import { appointments, contactMessages, doctors } from "@/lib/db/schema";
import { clinic } from "@/lib/clinic-content";

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function AdminOverviewPage() {
  let total = 0;
  let todays = 0;
  let pending = 0;
  let confirmed = 0;
  let activeDoctors = 0;
  let newMessages = 0;
  let upcoming: Array<{
    id: string;
    reference: string;
    patientName: string;
    appointmentDate: string;
    startTime: string;
    status: string;
    doctorName: string;
  }> = [];
  if (db) {
    const [totalRow] = await db.select({ value: count() }).from(appointments);
    const [todayRow] = await db.select({ value: count() }).from(appointments).where(eq(appointments.appointmentDate, today()));
    const [pendingRow] = await db.select({ value: count() }).from(appointments).where(eq(appointments.status, "pending"));
    const [confirmedRow] = await db.select({ value: count() }).from(appointments).where(eq(appointments.status, "confirmed"));
    const [doctorRow] = await db.select({ value: count() }).from(doctors).where(eq(doctors.isActive, true));
    const [messageRow] = await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "new"));
    total = totalRow?.value ?? 0;
    todays = todayRow?.value ?? 0;
    pending = pendingRow?.value ?? 0;
    confirmed = confirmedRow?.value ?? 0;
    activeDoctors = doctorRow?.value ?? 0;
    newMessages = messageRow?.value ?? 0;
    upcoming = await db
      .select({
        id: appointments.id,
        reference: appointments.reference,
        patientName: appointments.patientName,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        status: appointments.status,
        doctorName: doctors.name,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(gte(appointments.appointmentDate, today()))
      .orderBy(appointments.appointmentDate, appointments.startTime)
      .limit(6);
  }
  const cards = [
    { label: "All appointments", value: total, icon: CalendarDays },
    { label: "Today", value: todays, icon: CalendarCheck },
    { label: "Awaiting confirmation", value: pending, icon: Clock3 },
    { label: "Active doctors", value: activeDoctors, icon: UsersRound },
  ];

  return (
    <div>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Good to see you</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Clinic overview</h1>
          <p className="mt-2 text-sm text-[#657573]">Here&apos;s what&apos;s happening at {clinic.name} today.</p>
        </div>
        <Link href="/appointments/book" className="inline-flex items-center gap-2 rounded-full bg-[#176b68] px-5 py-3 text-xs font-bold text-white hover:bg-[#115350]">
          New appointment <ArrowUpRight size={15} />
        </Link>
      </header>
      {!db && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Database is not configured. Add Turso credentials and run migrations to load clinic data.
        </p>
      )}
      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-[20px] border border-[#e6ece8] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-[13px] bg-[#e5f4ef] text-[#176b68]"><Icon size={18} /></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#82928d]">Live</span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-[-0.06em]">{value}</p>
            <p className="mt-1 text-xs font-semibold text-[#657573]">{label}</p>
          </article>
        ))}
      </section>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <section className="overflow-hidden rounded-[22px] border border-[#e6ece8] bg-white">
          <div className="flex items-center justify-between border-b border-[#e6ece8] px-5 py-5">
            <div><h2 className="font-semibold">Upcoming appointments</h2><p className="mt-1 text-xs text-[#82928d]">The next visits on your calendar</p></div>
            <Link href="/admin/appointments" className="text-xs font-bold text-[#176b68]">View all</Link>
          </div>
          {upcoming.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[590px] text-left text-xs">
                <thead className="bg-[#fafbf9] text-[10px] uppercase tracking-[0.1em] text-[#82928d]">
                  <tr><th className="px-5 py-3 font-semibold">Patient</th><th className="px-4 py-3 font-semibold">Doctor</th><th className="px-4 py-3 font-semibold">Date & time</th><th className="px-4 py-3 font-semibold">Status</th></tr>
                </thead>
                <tbody>
                  {upcoming.map((item) => (
                    <tr key={item.id} className="border-t border-[#edf1ee]">
                      <td className="px-5 py-4"><p className="font-semibold">{item.patientName}</p><p className="mt-1 text-[10px] text-[#82928d]">{item.reference}</p></td>
                      <td className="px-4 py-4 text-[#657573]">{item.doctorName}</td>
                      <td className="px-4 py-4 text-[#657573]">{item.appointmentDate}<br />{item.startTime}</td>
                      <td className="px-4 py-4"><span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-bold capitalize text-[#8a641c]">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center"><p className="text-sm font-semibold">No upcoming appointments</p><p className="mt-2 text-xs text-[#82928d]">New patient requests will show up here.</p></div>
          )}
        </section>
        <aside className="rounded-[22px] bg-[#203332] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b8d9ca]">Clinic inbox</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.07em]">{newMessages}</h2>
          <p className="mt-1 text-sm text-white/65">new patient enquiries</p>
          <div className="mt-8 border-t border-white/15 pt-5">
            <p className="text-sm font-semibold">{confirmed} confirmed visits</p>
            <p className="mt-2 text-xs leading-5 text-white/55">Appointments stay pending until your team confirms them.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
