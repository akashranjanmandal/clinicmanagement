import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString());
const updatedAt = () =>
  text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString())
    .$onUpdate(() => new Date().toISOString());

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const doctors = sqliteTable(
  "doctors",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    qualification: text("qualification").notNull(),
    specialization: text("specialization").notNull(),
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id),
    experienceYears: integer("experience_years").notNull().default(0),
    biography: text("biography").notNull(),
    imageUrl: text("image_url"),
    consultationFee: integer("consultation_fee"),
    consultationMinutes: integer("consultation_minutes").notNull().default(30),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("doctors_department_idx").on(table.departmentId)],
);

export const doctorSchedules = sqliteTable(
  "doctor_schedules",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    slotMinutes: integer("slot_minutes").notNull().default(30),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("doctor_schedules_lookup_idx").on(table.doctorId, table.weekday),
  ],
);

export const doctorServices = sqliteTable(
  "doctor_services",
  {
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("doctor_services_pair_unique").on(table.doctorId, table.serviceId)],
);

export const scheduleExceptions = sqliteTable(
  "schedule_exceptions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (table) => [index("schedule_exceptions_doctor_dates_idx").on(table.doctorId, table.startDate, table.endDate)],
);

export const clinicHolidays = sqliteTable("clinic_holidays", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull().unique(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description"),
    icon: text("icon").notNull().default("stethoscope"),
    departmentId: text("department_id").references(() => departments.id),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("services_department_idx").on(table.departmentId)],
);

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    reference: text("reference").notNull().unique(),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id),
    patientName: text("patient_name").notNull(),
    patientPhone: text("patient_phone").notNull(),
    patientEmail: text("patient_email"),
    patientAge: integer("patient_age"),
    patientGender: text("patient_gender"),
    visitType: text("visit_type").notNull().default("first"),
    reason: text("reason"),
    appointmentDate: text("appointment_date").notNull(),
    startTime: text("start_time").notNull(),
    appointmentAtUtc: text("appointment_at_utc").notNull(),
    status: text("status", {
      enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
    })
      .notNull()
      .default("pending"),
    adminNote: text("admin_note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("appointments_active_slot_unique")
      .on(table.doctorId, table.appointmentDate, table.startTime)
      .where(sql`${table.status} IN ('pending', 'confirmed')`),
    index("appointments_date_status_idx").on(table.appointmentDate, table.status),
    index("appointments_patient_phone_idx").on(table.patientPhone),
  ],
);

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["new", "read", "resolved"] })
      .notNull()
      .default("new"),
    createdAt: createdAt(),
  },
  (table) => [index("contact_messages_status_created_idx").on(table.status, table.createdAt)],
);

export const clinicSettings = sqliteTable("clinic_settings", {
  id: text("id").primaryKey().default("clinic"),
  name: text("name").notNull().default("Your Clinic"),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  workingHours: text("working_hours").notNull().default(""),
  timezone: text("timezone").notNull().default("UTC"),
  mapsEmbedUrl: text("maps_embed_url").notNull().default(""),
  autoConfirmAppointments: integer("auto_confirm_appointments", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  updatedAt: updatedAt(),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["super_admin", "staff"] })
    .notNull()
    .default("staff"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    adminUserId: text("admin_user_id").references(() => adminUsers.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    createdAt: createdAt(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    keyHash: text("key_hash").primaryKey(),
    windowStartedAt: integer("window_started_at").notNull(),
    requestCount: integer("request_count").notNull(),
  },
  (table) => [index("rate_limits_window_idx").on(table.windowStartedAt)],
);

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
  schedules: many(doctorSchedules),
  appointments: many(appointments),
}));
