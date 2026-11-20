import { hash } from "bcryptjs";
import { and, asc, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  adminUserInput,
  adminResourceUpdate,
  departmentInput,
  doctorInput,
  exceptionBase,
  exceptionInput,
  holidayInput,
  messageStatusInput,
  scheduleBase,
  scheduleInput,
  serviceInput,
  settingsInput,
} from "@/lib/admin-resource-validation";
import {
  adminUsers,
  auditLogs,
  clinicHolidays,
  clinicSettings,
  contactMessages,
  departments,
  doctors,
  doctorSchedules,
  scheduleExceptions,
  services,
} from "@/lib/db/schema";

type Props = { params: Promise<{ resource: string }> };
type Resource =
  | "departments"
  | "doctors"
  | "services"
  | "schedules"
  | "leaves"
  | "holidays"
  | "messages"
  | "settings"
  | "users";

const resources = new Set<Resource>([
  "departments",
  "doctors",
  "services",
  "schedules",
  "leaves",
  "holidays",
  "messages",
  "settings",
  "users",
]);

async function authorize(resource?: string) {
  const user = await getAdminSession();
  if (!user) {
    return { response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  }
  // Front-desk staff may handle patient messages; everything else is administrator-only.
  if (user.role !== "super_admin" && resource !== "messages") {
    return { response: NextResponse.json({ error: "You do not have permission to manage clinic settings." }, { status: 403 }) };
  }
  if (!db) {
    return { response: NextResponse.json({ error: "Database is not configured." }, { status: 503 }) };
  }
  return { user, database: db };
}

async function getResource(resource: Resource) {
  if (!db) return null;
  switch (resource) {
    case "departments":
      return { items: await db.select().from(departments).orderBy(asc(departments.name)) };
    case "doctors":
      return {
        items: await db
          .select({
            id: doctors.id,
            slug: doctors.slug,
            name: doctors.name,
            qualification: doctors.qualification,
            specialization: doctors.specialization,
            departmentId: doctors.departmentId,
            departmentName: departments.name,
            experienceYears: doctors.experienceYears,
            biography: doctors.biography,
            imageUrl: doctors.imageUrl,
            consultationFee: doctors.consultationFee,
            consultationMinutes: doctors.consultationMinutes,
            isActive: doctors.isActive,
            displayOrder: doctors.displayOrder,
          })
          .from(doctors)
          .innerJoin(departments, eq(doctors.departmentId, departments.id))
          .orderBy(asc(doctors.displayOrder), asc(doctors.name)),
        options: { departments: await db.select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(departments.name)) },
      };
    case "services":
      return {
        items: await db
          .select({
            id: services.id,
            slug: services.slug,
            title: services.title,
            shortDescription: services.shortDescription,
            description: services.description,
            icon: services.icon,
            departmentId: services.departmentId,
            departmentName: departments.name,
            isPublished: services.isPublished,
            displayOrder: services.displayOrder,
          })
          .from(services)
          .leftJoin(departments, eq(services.departmentId, departments.id))
          .orderBy(asc(services.displayOrder), asc(services.title)),
        options: { departments: await db.select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(departments.name)) },
      };
    case "schedules":
      return {
        items: await db
          .select({
            id: doctorSchedules.id,
            doctorId: doctorSchedules.doctorId,
            doctorName: doctors.name,
            weekday: doctorSchedules.weekday,
            startTime: doctorSchedules.startTime,
            endTime: doctorSchedules.endTime,
            slotMinutes: doctorSchedules.slotMinutes,
            isActive: doctorSchedules.isActive,
          })
          .from(doctorSchedules)
          .innerJoin(doctors, eq(doctorSchedules.doctorId, doctors.id))
          .orderBy(asc(doctors.name), asc(doctorSchedules.weekday), asc(doctorSchedules.startTime)),
        options: { doctors: await db.select({ id: doctors.id, name: doctors.name }).from(doctors).orderBy(asc(doctors.name)) },
      };
    case "leaves":
      return {
        items: await db
          .select({
            id: scheduleExceptions.id,
            doctorId: scheduleExceptions.doctorId,
            doctorName: doctors.name,
            startDate: scheduleExceptions.startDate,
            endDate: scheduleExceptions.endDate,
            reason: scheduleExceptions.reason,
          })
          .from(scheduleExceptions)
          .innerJoin(doctors, eq(scheduleExceptions.doctorId, doctors.id))
          .orderBy(asc(scheduleExceptions.startDate)),
        options: { doctors: await db.select({ id: doctors.id, name: doctors.name }).from(doctors).orderBy(asc(doctors.name)) },
      };
    case "holidays":
      return { items: await db.select().from(clinicHolidays).orderBy(asc(clinicHolidays.date)) };
    case "messages":
      return { items: await db.select().from(contactMessages).orderBy(asc(contactMessages.status), asc(contactMessages.createdAt)).limit(200) };
    case "settings": {
      const [settings] = await db.select().from(clinicSettings).limit(1);
      return { settings: settings ?? null };
    }
    case "users":
      return {
        items: await db
          .select({
            id: adminUsers.id,
            email: adminUsers.email,
            name: adminUsers.name,
            role: adminUsers.role,
            isActive: adminUsers.isActive,
            createdAt: adminUsers.createdAt,
          })
          .from(adminUsers)
          .orderBy(asc(adminUsers.name)),
      };
  }
}

export async function GET(_request: Request, { params }: Props) {
  const { resource: key } = await params;
  const auth = await authorize(key);
  if (auth.response) return auth.response;
  if (!resources.has(key as Resource)) {
    return NextResponse.json({ error: "Unknown management section." }, { status: 404 });
  }
  try {
    const data = await getResource(key as Resource);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load clinic management data.", error);
    return NextResponse.json({ error: "Clinic data could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Props) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { user, database } = auth;
  const { resource: key } = await params;
  if (!resources.has(key as Resource)) return NextResponse.json({ error: "Unknown management section." }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit valid clinic data." }, { status: 400 });
  }
  try {
    let result: unknown;
    switch (key as Resource) {
      case "departments": {
        const parsed = departmentInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: "Check the department details." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(departments).values(parsed.data).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "department.created", entity: "department", entityId: row.id });
          return row;
        });
        break;
      }
      case "doctors": {
        const parsed = doctorInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the doctor details." }, { status: 400 });
        const [department] = await database.select({ id: departments.id }).from(departments).where(eq(departments.id, parsed.data.departmentId)).limit(1);
        if (!department) return NextResponse.json({ error: "Choose an existing department." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(doctors).values({
            ...parsed.data,
            imageUrl: parsed.data.imageUrl || null,
            consultationFee: parsed.data.consultationFee ?? null,
          }).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "doctor.created", entity: "doctor", entityId: row.id });
          return row;
        });
        break;
      }
      case "services": {
        const parsed = serviceInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the service details." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(services).values({
            ...parsed.data,
            departmentId: parsed.data.departmentId || null,
          }).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "service.created", entity: "service", entityId: row.id });
          return row;
        });
        break;
      }
      case "schedules": {
        const parsed = scheduleInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the schedule details." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(doctorSchedules).values(parsed.data).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "schedule.created", entity: "doctor_schedule", entityId: row.id });
          return row;
        });
        break;
      }
      case "leaves": {
        const parsed = exceptionInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the leave dates." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(scheduleExceptions).values(parsed.data).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "doctor.leave_created", entity: "schedule_exception", entityId: row.id });
          return row;
        });
        break;
      }
      case "holidays": {
        const parsed = holidayInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the holiday details." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(clinicHolidays).values(parsed.data).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "clinic_holiday.created", entity: "clinic_holiday", entityId: row.id });
          return row;
        });
        break;
      }
      case "settings": {
        const parsed = settingsInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the clinic settings." }, { status: 400 });
        try {
          new Intl.DateTimeFormat("en-US", { timeZone: parsed.data.timezone });
        } catch {
          return NextResponse.json({ error: "Enter a valid IANA timezone." }, { status: 400 });
        }
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(clinicSettings).values({ id: "clinic", ...parsed.data }).onConflictDoUpdate({
            target: clinicSettings.id,
            set: parsed.data,
          }).returning();
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "clinic_settings.updated", entity: "clinic_settings", entityId: row.id });
          return row;
        });
        break;
      }
      case "users": {
        const parsed = adminUserInput.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the admin user details." }, { status: 400 });
        result = await database.transaction(async (tx) => {
          const [row] = await tx.insert(adminUsers).values({
            email: parsed.data.email.toLowerCase(),
            name: parsed.data.name,
            passwordHash: await hash(parsed.data.password, 12),
            role: parsed.data.role,
          }).returning({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role });
          await tx.insert(auditLogs).values({ adminUserId: user.id, action: "admin_user.created", entity: "admin_user", entityId: row.id });
          return row;
        });
        break;
      }
      default:
        return NextResponse.json({ error: "This section does not accept new entries." }, { status: 405 });
    }
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not create clinic management record.", error);
    return NextResponse.json({ error: "The record could not be saved. Check for duplicate names or slugs." }, { status: 409 });
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const { resource: key } = await params;
  const auth = await authorize(key);
  if (auth.response) return auth.response;
  const { user, database } = auth;
  if (!resources.has(key as Resource)) return NextResponse.json({ error: "Unknown management section." }, { status: 404 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit a valid update." }, { status: 400 });
  }
  const requestData = adminResourceUpdate.safeParse(body);
  if (!requestData.success) return NextResponse.json({ error: "Submit a valid update." }, { status: 400 });
  const { id, data } = requestData.data;
  try {
    const result = await database.transaction(async (tx) => {
      let updated: { id: string } | undefined;
      switch (key as Resource) {
        case "departments": {
          const parsed = departmentInput.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the department details.");
          [updated] = await tx.update(departments).set(parsed.data).where(eq(departments.id, id)).returning({ id: departments.id });
          break;
        }
        case "doctors": {
          const parsed = doctorInput.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the doctor details.");
          [updated] = await tx.update(doctors).set({
            ...parsed.data,
            ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl || null } : {}),
            ...(parsed.data.consultationFee !== undefined ? { consultationFee: parsed.data.consultationFee ?? null } : {}),
            ...(("consultationFee" in data && (data.consultationFee === "" || data.consultationFee === null)) ? { consultationFee: null } : {}),
          }).where(eq(doctors.id, id)).returning({ id: doctors.id });
          break;
        }
        case "services": {
          const parsed = serviceInput.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the service details.");
          [updated] = await tx.update(services).set({
            ...parsed.data,
            ...(parsed.data.departmentId !== undefined ? { departmentId: parsed.data.departmentId || null } : {}),
          }).where(eq(services.id, id)).returning({ id: services.id });
          break;
        }
        case "schedules": {
          const parsed = scheduleBase.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the timing details.");
          const [existing] = await tx.select().from(doctorSchedules).where(eq(doctorSchedules.id, id)).limit(1);
          if (!existing) break;
          const start = parsed.data.startTime ?? existing.startTime;
          const end = parsed.data.endTime ?? existing.endTime;
          if (end <= start) throw new Error("End time must be after start time.");
          [updated] = await tx.update(doctorSchedules).set(parsed.data).where(eq(doctorSchedules.id, id)).returning({ id: doctorSchedules.id });
          break;
        }
        case "leaves": {
          const parsed = exceptionBase.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the leave details.");
          const [existing] = await tx.select().from(scheduleExceptions).where(eq(scheduleExceptions.id, id)).limit(1);
          if (!existing) break;
          const first = parsed.data.startDate ?? existing.startDate;
          const last = parsed.data.endDate ?? existing.endDate;
          if (last < first) throw new Error("The last day must be on or after the first day.");
          [updated] = await tx.update(scheduleExceptions).set(parsed.data).where(eq(scheduleExceptions.id, id)).returning({ id: scheduleExceptions.id });
          break;
        }
        case "holidays": {
          const parsed = holidayInput.partial().safeParse(data);
          if (!parsed.success) throw new Error("Check the holiday details.");
          [updated] = await tx.update(clinicHolidays).set(parsed.data).where(eq(clinicHolidays.id, id)).returning({ id: clinicHolidays.id });
          break;
        }
        case "messages": {
          const parsed = messageStatusInput.safeParse(data);
          if (!parsed.success) throw new Error("Choose a valid message status.");
          [updated] = await tx.update(contactMessages).set(parsed.data).where(eq(contactMessages.id, id)).returning({ id: contactMessages.id });
          break;
        }
        case "users": {
          const parsed = z.object({
            name: z.string().trim().min(2).max(120).optional(),
            role: z.enum(["super_admin", "staff"]).optional(),
            isActive: z.boolean().optional(),
          }).refine((value) => Object.keys(value).length > 0).safeParse(data);
          if (!parsed.success) throw new Error("Check the admin user update.");
          if (id === user.id && parsed.data.isActive === false) throw new Error("You cannot deactivate your own account.");
          if (parsed.data.isActive === false) {
            const [target] = await tx.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
            if (target?.role === "super_admin") {
              const [{ value: activeAdmins }] = await tx.select({ value: count() }).from(adminUsers).where(and(eq(adminUsers.role, "super_admin"), eq(adminUsers.isActive, true)));
              if (activeAdmins <= 1) throw new Error("At least one active super-admin must remain.");
            }
          }
          [updated] = await tx.update(adminUsers).set(parsed.data).where(eq(adminUsers.id, id)).returning({ id: adminUsers.id });
          break;
        }
        default:
          throw new Error("This section cannot be updated here.");
      }
      if (!updated) return null;
      await tx.insert(auditLogs).values({
        adminUserId: user.id,
        action: `${key}.updated`,
        entity: key,
        entityId: id,
      });
      return updated;
    });
    if (!result) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && !/SQLITE|UNIQUE|constraint/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Could not update clinic management record.", error);
    return NextResponse.json({ error: "The record could not be updated." }, { status: 409 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const { user, database } = auth;
  const { resource: key } = await params;
  if (!resources.has(key as Resource)) return NextResponse.json({ error: "Unknown management section." }, { status: 404 });
  const bodySchema = z.object({ id: z.string().uuid() });
  let recordId: string;
  try {
    recordId = bodySchema.parse(await request.json()).id;
  } catch {
    return NextResponse.json({ error: "Submit a valid record ID." }, { status: 400 });
  }
  try {
    const result = await database.transaction(async (tx) => {
      let row: { id: string } | undefined;
      switch (key as Resource) {
        case "departments":
          [row] = await tx.update(departments).set({ isActive: false }).where(eq(departments.id, recordId)).returning({ id: departments.id });
          break;
        case "doctors":
          [row] = await tx.update(doctors).set({ isActive: false }).where(eq(doctors.id, recordId)).returning({ id: doctors.id });
          break;
        case "services":
          [row] = await tx.update(services).set({ isPublished: false }).where(eq(services.id, recordId)).returning({ id: services.id });
          break;
        case "schedules":
          [row] = await tx.delete(doctorSchedules).where(eq(doctorSchedules.id, recordId)).returning({ id: doctorSchedules.id });
          break;
        case "leaves":
          [row] = await tx.delete(scheduleExceptions).where(eq(scheduleExceptions.id, recordId)).returning({ id: scheduleExceptions.id });
          break;
        case "holidays":
          [row] = await tx.delete(clinicHolidays).where(eq(clinicHolidays.id, recordId)).returning({ id: clinicHolidays.id });
          break;
        case "users": {
          if (recordId === user.id) throw new Error("You cannot deactivate your own account.");
          const [target] = await tx.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.id, recordId)).limit(1);
          if (target?.role === "super_admin") {
            const [{ value: activeAdmins }] = await tx.select({ value: count() }).from(adminUsers).where(and(eq(adminUsers.role, "super_admin"), eq(adminUsers.isActive, true)));
            if (activeAdmins <= 1) throw new Error("At least one active super-admin must remain.");
          }
          [row] = await tx.update(adminUsers).set({ isActive: false }).where(eq(adminUsers.id, recordId)).returning({ id: adminUsers.id });
          break;
        }
        default:
          throw new Error("This section does not support removal.");
      }
      if (row) {
        await tx.insert(auditLogs).values({
          adminUserId: user.id,
          action: `${key}.archived`,
          entity: key,
          entityId: row.id,
        });
      }
      return row;
    });
    if (!result) return NextResponse.json({ error: "Record not found." }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && !/SQLITE|UNIQUE|constraint/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Could not archive clinic management record.", error);
    return NextResponse.json({ error: "The record could not be archived." }, { status: 409 });
  }
}
