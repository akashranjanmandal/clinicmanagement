import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("concurrent requests cannot reserve the same doctor slot", async () => {
  const directory = await mkdtemp(join(tmpdir(), "clinic-booking-test-"));
  const originalUrl = process.env.TURSO_DATABASE_URL;
  const originalToken = process.env.TURSO_AUTH_TOKEN;
  const originalSecret = process.env.AUTH_SECRET;
  process.env.TURSO_DATABASE_URL = `file:${join(directory, "test.db")}`;
  process.env.TURSO_AUTH_TOKEN = "";
  process.env.AUTH_SECRET = "test-only-auth-secret-long-enough-for-ratelimits";

  let database: Awaited<ReturnType<typeof import("./db").requireDatabase>> | undefined;
  try {
    const [{ migrate }, { requireDatabase }, schema, { createAppointment, availableSlots }] =
      await Promise.all([
        import("drizzle-orm/libsql/migrator"),
        import("./db"),
        import("./db/schema"),
        import("./appointments"),
      ]);
    database = requireDatabase();
    await migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });

    await database.insert(schema.departments).values({
      name: "Test Department",
      slug: "test-department",
    });
    const [department] = await database
      .select()
      .from(schema.departments)
      .limit(1);
    const [doctor] = await database
      .insert(schema.doctors)
      .values({
        slug: "test-doctor",
        name: "Test Doctor",
        qualification: "MD",
        specialization: "General care",
        departmentId: department.id,
        biography: "Test data only.",
        consultationMinutes: 30,
      })
      .returning();
    await database.insert(schema.doctorSchedules).values({
      doctorId: doctor.id,
      weekday: 1,
      startTime: "09:00",
      endTime: "10:00",
      slotMinutes: 30,
    });
    await database.insert(schema.clinicSettings).values({
      id: "clinic",
      timezone: "UTC",
    });

    const appointmentDate = "2099-01-05";
    assert.deepEqual(await availableSlots(doctor.id, appointmentDate), ["09:00", "09:30"]);

    const input = {
      doctorId: doctor.id,
      patientName: "Test Patient",
      patientPhone: "5550100",
      visitType: "first" as const,
      appointmentDate,
      startTime: "09:00",
    };
    const results = await Promise.allSettled([
      createAppointment(input),
      createAppointment(input),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected && rejected.status === "rejected");
    assert.match(String(rejected.reason), /just booked|database is locked/i);

    const bookings = await database.select().from(schema.appointments);
    assert.equal(bookings.length, 1);
  } finally {
    if (database) await database.$client.close();
    if (originalUrl === undefined) delete process.env.TURSO_DATABASE_URL;
    else process.env.TURSO_DATABASE_URL = originalUrl;
    if (originalToken === undefined) delete process.env.TURSO_AUTH_TOKEN;
    else process.env.TURSO_AUTH_TOKEN = originalToken;
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
    await rm(directory, { recursive: true, force: true });
  }
});
