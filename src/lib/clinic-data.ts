import { asc, eq } from "drizzle-orm";
import type { DoctorCardData } from "./clinic-content";
import { db, isDatabaseConfigured } from "./db";
import { clinicSettings, departments, doctors, services } from "./db/schema";

export async function listDoctors(): Promise<DoctorCardData[]> {
  if (!isDatabaseConfigured || !db) {
    return [];
  }
  return db
    .select({
      id: doctors.id,
      slug: doctors.slug,
      name: doctors.name,
      qualification: doctors.qualification,
      specialization: doctors.specialization,
      experienceYears: doctors.experienceYears,
      imageUrl: doctors.imageUrl,
      biography: doctors.biography,
      departmentId: doctors.departmentId,
      departmentName: departments.name,
      consultationFee: doctors.consultationFee,
    })
    .from(doctors)
    .innerJoin(departments, eq(doctors.departmentId, departments.id))
    .where(eq(doctors.isActive, true))
    .orderBy(asc(doctors.displayOrder), asc(doctors.name))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        imageUrl: row.imageUrl,
      })),
    );
}

export async function getDoctor(slug: string): Promise<DoctorCardData | null> {
  if (!isDatabaseConfigured || !db) {
    return null;
  }
  const [doctor] = await db
    .select({
      id: doctors.id,
      slug: doctors.slug,
      name: doctors.name,
      qualification: doctors.qualification,
      specialization: doctors.specialization,
      experienceYears: doctors.experienceYears,
      imageUrl: doctors.imageUrl,
      biography: doctors.biography,
      departmentId: doctors.departmentId,
      departmentName: departments.name,
      consultationFee: doctors.consultationFee,
    })
    .from(doctors)
    .innerJoin(departments, eq(doctors.departmentId, departments.id))
    .where(eq(doctors.slug, slug))
    .limit(1);
  return doctor ?? null;
}

export async function listServices() {
  if (!isDatabaseConfigured || !db) {
    return [];
  }
  return db
    .select({
      id: services.id,
      slug: services.slug,
      title: services.title,
      shortDescription: services.shortDescription,
      description: services.description,
      icon: services.icon,
      departmentName: departments.name,
    })
    .from(services)
    .leftJoin(departments, eq(services.departmentId, departments.id))
    .where(eq(services.isPublished, true))
    .orderBy(asc(services.displayOrder), asc(services.title));
}

export async function listDepartments() {
  if (!db) return [];
  return db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.isActive, true))
    .orderBy(asc(departments.name));
}

export async function getClinicSettings() {
  if (!db) return null;
  const [settings] = await db.select().from(clinicSettings).limit(1);
  return settings ?? null;
}
