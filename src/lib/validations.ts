import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Enter a valid calendar date.");

export const bookingSchema = z.object({
  doctorId: z.string().min(1),
  patientName: z.string().trim().min(2).max(100),
  patientPhone: z.string().trim().min(7).max(25),
  patientEmail: z.union([z.string().email().max(254), z.literal("")]).optional(),
  patientAge: z.coerce.number().int().min(0).max(120).optional(),
  patientGender: z.enum(["female", "male", "non-binary", "prefer-not-to-say"]).optional(),
  visitType: z.enum(["first", "follow-up"]),
  reason: z.string().trim().max(500).optional(),
  appointmentDate: isoDate,
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(5).max(254),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(2000),
});

export type BookingInput = z.infer<typeof bookingSchema>;
