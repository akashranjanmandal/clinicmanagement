import assert from "node:assert/strict";
import test from "node:test";
import { buildSlotTimes } from "./appointments";
import { bookingSchema } from "./validations";

test("generates clinic slots at the configured interval", () => {
  assert.deepEqual(
    buildSlotTimes([{ startTime: "09:00", endTime: "11:00", slotMinutes: 30 }], [], 30),
    ["09:00", "09:30", "10:00", "10:30"],
  );
});

test("excludes bookings that overlap a doctor's consultation duration", () => {
  assert.deepEqual(
    buildSlotTimes(
      [{ startTime: "09:00", endTime: "11:00", slotMinutes: 15 }],
      ["09:15"],
      30,
    ),
    ["10:00", "10:30"],
  );
});

test("does not offer overlapping slots from overlapping schedule sessions", () => {
  assert.deepEqual(
    buildSlotTimes(
      [
        { startTime: "09:00", endTime: "10:00", slotMinutes: 30 },
        { startTime: "09:15", endTime: "10:15", slotMinutes: 15 },
      ],
      [],
      30,
    ),
    ["09:00", "09:30"],
  );
});

test("rejects impossible calendar dates in booking submissions", () => {
  const parsed = bookingSchema.safeParse({
    doctorId: "doctor-1",
    patientName: "Sample Person",
    patientPhone: "5550100",
    visitType: "first",
    appointmentDate: "2026-02-31",
    startTime: "09:00",
  });
  assert.equal(parsed.success, false);
});
