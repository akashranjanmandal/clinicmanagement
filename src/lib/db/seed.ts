import { hash } from "bcryptjs";
import { fromZonedTime } from "date-fns-tz";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured, requireDatabase } from "./index";
import {
  adminUsers,
  appointments,
  clinicHolidays,
  clinicSettings,
  contactMessages,
  departments,
  doctors,
  doctorSchedules,
  services,
} from "./schema";

const departmentData = [
  { name: "General Medicine", slug: "general-medicine", description: "Primary and preventive care." },
  { name: "Heart & Vascular", slug: "heart-vascular", description: "Cardiovascular health." },
  { name: "Children's Health", slug: "childrens-health", description: "Paediatric care for every age." },
  { name: "Women's Health", slug: "womens-health", description: "Personal, comprehensive women's care." },
];

const doctorData = [
  { slug: "ananya-rao", name: "Dr. Ananya Rao", qualification: "MBBS, MD (Internal Medicine)", specialization: "Internal Medicine", department: "General Medicine", experienceYears: 12, imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=960&q=85", biography: "Dr. Rao believes good medicine starts with listening. She brings a calm, evidence-led approach to preventive and everyday care.", days: [1, 3, 5], startTime: "10:00", endTime: "13:00" },
  { slug: "vikram-shah", name: "Dr. Vikram Shah", qualification: "MBBS, DM (Cardiology)", specialization: "Cardiology", department: "Heart & Vascular", experienceYears: 15, imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=960&q=85", biography: "Dr. Shah focuses on practical, personalized heart care and helping patients feel confident about their health.", days: [2, 4, 6], startTime: "09:00", endTime: "12:00" },
  { slug: "meera-iyer", name: "Dr. Meera Iyer", qualification: "MBBS, MD (Paediatrics)", specialization: "Paediatrics", department: "Children's Health", experienceYears: 9, imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=960&q=85", biography: "Dr. Iyer partners with families to make every visit reassuring, supportive, and focused on a child's whole wellbeing.", days: [1, 2, 4], startTime: "11:00", endTime: "15:00" },
  { slug: "kavya-menon", name: "Dr. Kavya Menon", qualification: "MBBS, MS (Obstetrics & Gynaecology)", specialization: "Women's Health", department: "Women's Health", experienceYears: 11, imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=960&q=85", biography: "Dr. Menon offers considered, compassionate care through every stage of a woman's health journey.", days: [1, 3, 6], startTime: "09:30", endTime: "13:30" },
  { slug: "rohan-kulkarni", name: "Dr. Rohan Kulkarni", qualification: "MBBS, MD (Family Medicine)", specialization: "Family Medicine", department: "General Medicine", experienceYears: 8, imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=960&q=85", biography: "Dr. Kulkarni enjoys building long-term relationships with patients and helping families make confident health decisions.", days: [2, 3, 5], startTime: "15:00", endTime: "19:00" },
  { slug: "sara-thomas", name: "Dr. Sara Thomas", qualification: "MBBS, DNB (Cardiology)", specialization: "Preventive Cardiology", department: "Heart & Vascular", experienceYears: 7, imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=960&q=85", biography: "Dr. Thomas helps patients understand their heart health and build realistic, sustainable plans for wellbeing.", days: [1, 4, 5], startTime: "16:00", endTime: "19:00" },
];

const serviceData = [
  ["primary-care", "Primary care", "Everyday health support, check-ups, and care that keeps you well.", "heart", "General Medicine"],
  ["cardiology", "Cardiology", "Expert heart health assessments and ongoing cardiac care.", "activity", "Heart & Vascular"],
  ["paediatrics", "Paediatrics", "Gentle, thoughtful healthcare for every stage of childhood.", "baby", "Children's Health"],
  ["womens-health", "Women's health", "Personalized care for changing needs through every life stage.", "heart", "Women's Health"],
  ["preventive-health", "Preventive health", "Screening and practical guidance to help you stay well.", "stethoscope", "General Medicine"],
  ["diagnostics", "Diagnostics", "Clear answers with convenient, coordinated diagnostic services.", "scan", "General Medicine"],
  ["family-medicine", "Family medicine", "Connected care for individuals and the people they care for.", "heart", "General Medicine"],
  ["heart-screening", "Heart screening", "Thoughtful cardiovascular risk checks and follow-up.", "activity", "Heart & Vascular"],
] as const;

async function seed() {
  if (process.env.NODE_ENV === "production" || process.env.SEED_DEMO_DATA !== "true") {
    throw new Error("Seeding is disabled. Set SEED_DEMO_DATA=true in a non-production environment.");
  }
  if (!isDatabaseConfigured || !db) {
    throw new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before seeding.");
  }
  const database = requireDatabase();
  await database.insert(departments).values(departmentData).onConflictDoNothing();
  const departmentRows = await database.select().from(departments);
  const departmentIds = new Map(departmentRows.map((item) => [item.name, item.id]));

  for (const [index, item] of doctorData.entries()) {
    const existing = await database.select({ id: doctors.id }).from(doctors).where(eq(doctors.slug, item.slug)).limit(1);
    if (existing.length) continue;
    const departmentId = departmentIds.get(item.department);
    if (!departmentId) throw new Error(`Missing seeded department: ${item.department}`);
    const [doctor] = await database.insert(doctors).values({
      slug: item.slug,
      name: item.name,
      qualification: item.qualification,
      specialization: item.specialization,
      departmentId,
      experienceYears: item.experienceYears,
      imageUrl: item.imageUrl,
      biography: item.biography,
      displayOrder: index,
      consultationMinutes: 30,
      consultationFee: 900 + index * 100,
    }).returning({ id: doctors.id });
    await database.insert(doctorSchedules).values(
      item.days.map((weekday) => ({
        doctorId: doctor.id,
        weekday,
        startTime: item.startTime,
        endTime: item.endTime,
        slotMinutes: 30,
      })),
    );
  }

  for (const [index, [slug, title, shortDescription, icon, department]] of serviceData.entries()) {
    const departmentId = departmentIds.get(department);
    if (!departmentId) throw new Error(`Missing seeded department: ${department}`);
    await database.insert(services).values({
      slug,
      title,
      shortDescription,
      description: shortDescription,
      icon,
      departmentId,
      displayOrder: index,
    }).onConflictDoNothing();
  }

  await database.insert(clinicSettings).values({
    id: "clinic",
    name: "Demo Care Clinic",
    address: "12 Example Road, Sample City 400001",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    email: "hello@democlinic.test",
    workingHours: "Mon–Sat: 9:00 AM – 7:00 PM\nSunday: Closed",
    timezone: "Asia/Kolkata",
    mapsEmbedUrl: "",
  }).onConflictDoNothing();
  await database.insert(clinicHolidays).values({ date: "2099-01-01", name: "Example clinic closure" }).onConflictDoNothing();
  await database.insert(contactMessages).values({
    name: "Sample visitor",
    contact: "sample@example.test",
    subject: "Example enquiry",
    message: "This is development-only sample content. Delete or replace it before launch.",
  }).onConflictDoNothing();

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    const existing = await database.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, adminEmail)).limit(1);
    if (!existing.length) {
      await database.insert(adminUsers).values({
        email: adminEmail,
        name: process.env.SEED_ADMIN_NAME?.trim() || "Clinic Administrator",
        passwordHash: await hash(adminPassword, 12),
        role: "super_admin",
      });
    }
  } else {
    console.info("No seed admin created. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before seeding.");
  }

  const doctorRows = await database.select().from(doctors);
  if (doctorRows.length && (await database.select({ id: appointments.id }).from(appointments).limit(1)).length === 0) {
    const doctor = doctorRows[0];
    const schedule = await database.select().from(doctorSchedules).where(eq(doctorSchedules.doctorId, doctor.id)).limit(1);
    if (schedule[0]) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + ((schedule[0].weekday - date.getUTCDay() + 7) % 7 || 7));
      const appointmentDate = date.toISOString().slice(0, 10);
      await database.insert(appointments).values({
        reference: "DEMO-AST-0001",
        doctorId: doctor.id,
        patientName: "Sample Patient",
        patientPhone: "+910000000000",
        patientEmail: "sample@example.test",
        appointmentDate,
        startTime: schedule[0].startTime,
        appointmentAtUtc: fromZonedTime(
          `${appointmentDate}T${schedule[0].startTime}:00`,
          "UTC",
        ).toISOString(),
        reason: "Development sample booking — replace before launch.",
        status: "pending",
      }).onConflictDoNothing();
    }
  }
  console.info("Development seed data is ready.");
}

seed().catch((error: unknown) => {
  console.error("Development seed failed.", error);
  process.exitCode = 1;
});
