import { fromZonedTime } from "date-fns-tz";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { requireDatabase } from "./db";
import {
  appointments,
  clinicSettings,
  clinicHolidays,
  doctors,
  doctorSchedules,
  scheduleExceptions,
} from "./db/schema";
import type { BookingInput } from "./validations";

export function clinicToday(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function buildSlotTimes(
  schedules: Array<{ startTime: string; endTime: string; slotMinutes: number }>,
  bookedStartTimes: string[],
  consultationMinutes: number,
) {
  const starts = new Set<number>();
  for (const schedule of schedules) {
    const start = minutesFromTime(schedule.startTime);
    const end = minutesFromTime(schedule.endTime);
    const interval = Math.max(schedule.slotMinutes, consultationMinutes);
    if (!Number.isFinite(interval) || interval <= 0) continue;
    for (let cursor = start; cursor + consultationMinutes <= end; cursor += interval) {
      starts.add(cursor);
    }
  }

  const booked = bookedStartTimes.map(minutesFromTime);
  const available: number[] = [];
  for (const candidate of [...starts].sort((a, b) => a - b)) {
    const overlapsBooking = booked.some(
      (start) => candidate < start + consultationMinutes && start < candidate + consultationMinutes,
    );
    const overlapsEarlierSlot =
      available.length > 0 &&
      candidate < available[available.length - 1] + consultationMinutes;
    if (!overlapsBooking && !overlapsEarlierSlot) available.push(candidate);
  }
  return available.map(timeFromMinutes);
}

export async function availableSlots(doctorId: string, date: string) {
  const database = requireDatabase();
  const [doctor] = await database
    .select({ id: doctors.id, consultationMinutes: doctors.consultationMinutes })
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.isActive, true)))
    .limit(1);
  if (!doctor) return [];

  const [holiday] = await database
    .select({ id: clinicHolidays.id })
    .from(clinicHolidays)
    .where(eq(clinicHolidays.date, date))
    .limit(1);
  if (holiday) return [];

  const [leave] = await database
    .select({ id: scheduleExceptions.id })
    .from(scheduleExceptions)
    .where(
      and(
        eq(scheduleExceptions.doctorId, doctorId),
        lte(scheduleExceptions.startDate, date),
        gte(scheduleExceptions.endDate, date),
      ),
    )
    .limit(1);
  if (leave) return [];

  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const schedules = await database
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.weekday, weekday),
        eq(doctorSchedules.isActive, true),
      ),
    );

  const booked = await database
    .select({ startTime: appointments.startTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, date),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
  const [settings] = await database.select().from(clinicSettings).limit(1);
  const timeZone = settings?.timezone ?? "UTC";
  const slots = buildSlotTimes(
    schedules,
    booked.map((appointment) => appointment.startTime),
    doctor.consultationMinutes,
  );
  if (date === clinicToday(timeZone)) {
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    return slots.filter((time) => time > now);
  }
  return slots;
}

export async function createAppointment(input: BookingInput) {
  const database = requireDatabase();
  const [settings] = await database.select().from(clinicSettings).limit(1);
  const timeZone = settings?.timezone ?? "UTC";
  if (input.appointmentDate < clinicToday(timeZone)) {
    throw new Error("Please choose a future date.");
  }
  const slots = await availableSlots(input.doctorId, input.appointmentDate);
  if (!slots.includes(input.startTime)) {
    throw new Error("That appointment time is no longer available.");
  }

  const reference = `CLN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const appointmentAtUtc = fromZonedTime(
    `${input.appointmentDate}T${input.startTime}:00`,
    timeZone,
  ).toISOString();
  try {
    const appointment = await database.transaction(async (tx) => {
      const [row] = await tx
        .insert(appointments)
        .values({
          ...input,
          patientEmail: input.patientEmail || null,
          reference,
          appointmentAtUtc,
          status: settings?.autoConfirmAppointments ? "confirmed" : "pending",
        })
        .returning({
          id: appointments.id,
          reference: appointments.reference,
          status: appointments.status,
        });
      return row;
    });
    return appointment;
  } catch (error) {
    if (
      error instanceof Error &&
      /appointments_active_slot_unique|UNIQUE constraint failed|SQLITE_BUSY|database is locked/i.test(
        error.message,
      )
    ) {
      throw new Error("That appointment time was just booked. Please choose another.");
    }
    throw error;
  }
}
