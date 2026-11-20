import Link from "next/link";
import { and, asc, count, eq, gt, ne } from "drizzle-orm";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarPlus, ClipboardList, Mail, Stethoscope } from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { clinicToday } from "@/lib/clinic-date";
import { db } from "@/lib/db";
import { appointments, contactMessages, doctors } from "@/lib/db/schema";
import { formatDate, formatTime, statusMeta } from "@/lib/admin-format";

export default async function AdminHomePage() {
  const user = await getAdminSession();
  const today = await clinicToday();
  let todayCount = 0;
  let pending = 0;
  let upcoming = 0;
  let messages = 0;
  let activeDoctors = 0;
  let agenda: Array<{ id: string; patientName: string; startTime: string; status: keyof typeof statusMeta; doctorName: string }> = [];

  if (db) {
    const one = async (q: Promise<Array<{ value: number }>>) => (await q)[0]?.value ?? 0;
    [todayCount, pending, upcoming, messages, activeDoctors] = await Promise.all([
      one(db.select({ value: count() }).from(appointments).where(and(eq(appointments.appointmentDate, today), ne(appointments.status, "cancelled")))),
      one(db.select({ value: count() }).from(appointments).where(eq(appointments.status, "pending"))),
      one(db.select({ value: count() }).from(appointments).where(and(gt(appointments.appointmentDate, today), ne(appointments.status, "cancelled")))),
      one(db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "new"))),
      one(db.select({ value: count() }).from(doctors).where(eq(doctors.isActive, true))),
    ]);
    agenda = await db
      .select({ id: appointments.id, patientName: appointments.patientName, startTime: appointments.startTime, status: appointments.status, doctorName: doctors.name })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(and(eq(appointments.appointmentDate, today), ne(appointments.status, "cancelled")))
      .orderBy(asc(appointments.startTime))
      .limit(10);
  }

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const tiles = [
    { href: "/admin/appointments?tab=today", label: "Patients today", value: todayCount, icon: CalendarCheck, tone: "bg-white" },
    { href: "/admin/appointments?tab=pending", label: "Waiting for your confirmation", value: pending, icon: ClipboardList, tone: pending ? "bg-[#fff4d1] border-[#e6c766]" : "bg-white" },
    { href: "/admin/messages", label: "New patient messages", value: messages, icon: Mail, tone: messages ? "bg-[#fff4d1] border-[#e6c766]" : "bg-white" },
    { href: "/admin/appointments?tab=upcoming", label: "Coming up after today", value: upcoming, icon: CalendarClock, tone: "bg-white" },
  ];

  return (
    <div>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="adm-h1">{greeting}, {user?.name.split(" ")[0] ?? "there"}</h1>
          <p className="adm-sub">Today is {formatDate(today)}. Here is what needs your attention.</p>
        </div>
        <Link href="/appointments/book" className="adm-btn adm-btn-primary shrink-0"><CalendarPlus size={20} /> Book for a patient</Link>
      </header>

      {!db && <p className="adm-alert adm-alert-warn mt-6">The database is not connected. Ask your technical contact to check the clinic database settings.</p>}

      <section aria-label="Summary" className="mt-7 grid gap-4 sm:grid-cols-2">
        {tiles.map(({ href, label, value, icon: Icon, tone }) => (
          <Link key={label} href={href} className={`adm-card ${tone} flex items-center gap-5 p-5 transition-shadow hover:shadow-lg`}>
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#e5f4ef] text-[#0f5f5c]"><Icon size={28} aria-hidden /></span>
            <span>
              <span className="block text-4xl font-bold leading-none">{value}</span>
              <span className="mt-1 block text-lg font-semibold text-[#3f524f]">{label}</span>
            </span>
            <ArrowRight className="ml-auto text-[#0f5f5c]" aria-hidden />
          </Link>
        ))}
      </section>

      <section className="adm-card mt-7 overflow-hidden" aria-labelledby="today-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#e3ebe7] px-5 py-4">
          <h2 id="today-heading" className="text-xl font-bold">Today&apos;s patients</h2>
          <Link href="/admin/appointments?tab=today" className="adm-btn adm-btn-outline adm-btn-sm">Open full list <ArrowRight size={18} /></Link>
        </div>
        {agenda.length ? (
          <ul className="divide-y-2 divide-[#e3ebe7]">
            {agenda.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4">
                <span className="w-28 text-xl font-bold text-[#0a4744]">{formatTime(item.startTime)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{item.patientName}</span>
                  <span className="block text-base text-[#3f524f]">with {item.doctorName}</span>
                </span>
                <span className={`badge ${statusMeta[item.status].className}`}>{statusMeta[item.status].label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-lg text-[#3f524f]">No patients booked for today.</p>
        )}
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2" aria-label="Quick links">
        <Link href="/admin/doctors" className="adm-card flex items-center gap-4 p-5 hover:shadow-lg">
          <Stethoscope size={28} className="text-[#0f5f5c]" aria-hidden />
          <span><span className="block text-lg font-bold">Doctors and timings</span><span className="text-base text-[#3f524f]">{activeDoctors} doctors taking appointments</span></span>
        </Link>
        <Link href="/admin/holidays" className="adm-card flex items-center gap-4 p-5 hover:shadow-lg">
          <CalendarClock size={28} className="text-[#0f5f5c]" aria-hidden />
          <span><span className="block text-lg font-bold">Clinic closed on a day?</span><span className="text-base text-[#3f524f]">Add a holiday so patients cannot book</span></span>
        </Link>
      </section>
    </div>
  );
}
