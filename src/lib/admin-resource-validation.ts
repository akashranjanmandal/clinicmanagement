import { z } from "zod";

const slug = z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const optionalInteger = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(min).max(max).optional(),
  );
const httpsUrl = z.union([z.literal(""), z.string().url().max(2048)]).refine(
  (value) => !value || value.startsWith("https://"),
  "Use an HTTPS image URL.",
);

export const departmentInput = z.object({
  name: z.string().trim().min(2).max(100),
  slug,
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const doctorInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  qualification: z.string().trim().min(2).max(160),
  specialization: z.string().trim().min(2).max(120),
  departmentId: z.string().uuid(),
  experienceYears: z.coerce.number().int().min(0).max(80),
  biography: z.string().trim().min(10).max(4000),
  imageUrl: httpsUrl.optional(),
  consultationFee: optionalInteger(0, 1000000),
  consultationMinutes: z.coerce.number().int().min(5).max(240),
  displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().optional(),
});

export const serviceInput = z.object({
  title: z.string().trim().min(2).max(120),
  slug,
  shortDescription: z.string().trim().min(5).max(300),
  description: z.string().trim().max(4000).optional(),
  icon: z.string().trim().min(1).max(40).default("stethoscope"),
  departmentId: z.union([z.string().uuid(), z.literal("")]).optional(),
  displayOrder: z.coerce.number().int().min(0).max(10000).default(0),
  isPublished: z.boolean().optional(),
});

export const scheduleInput = z.object({
  doctorId: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  slotMinutes: z.coerce.number().int().min(5).max(240),
}).refine((value) => value.endTime > value.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export const exceptionInput = z.object({
  doctorId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().trim().max(300).optional(),
}).refine((value) => value.endDate >= value.startDate, {
  message: "End date must be on or after start date.",
  path: ["endDate"],
});

export const holidayInput = z.object({
  date: z.string().date(),
  name: z.string().trim().min(2).max(120),
});

export const settingsInput = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(20).regex(/^\+?\d*$/).optional(),
  email: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  workingHours: z.string().trim().max(1000).optional(),
  timezone: z.string().trim().min(1).max(100),
  mapsEmbedUrl: z.union([z.literal(""), z.string().url().max(2048)]).optional(),
  autoConfirmAppointments: z.boolean(),
});

export const adminUserInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  role: z.enum(["super_admin", "staff"]),
});

export const messageStatusInput = z.object({
  status: z.enum(["new", "read", "resolved"]),
});

export const adminResourceUpdate = z.object({
  id: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
});
