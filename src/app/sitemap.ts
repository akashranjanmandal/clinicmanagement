import type { MetadataRoute } from "next";
import { listDoctors } from "@/lib/clinic-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fixedRoutes = ["", "/about", "/doctors", "/services", "/contact"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
  }));
  const doctors = await listDoctors();
  return [
    ...fixedRoutes,
    ...doctors.map((doctor) => ({
      url: `${baseUrl}/doctors/${doctor.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
    })),
  ];
}
