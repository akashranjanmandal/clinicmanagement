import { notFound } from "next/navigation";
import { AdminResourceManager } from "@/components/admin-resource-manager";

const sections = new Set([
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

type Props = { params: Promise<{ section: string }> };

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return <AdminResourceManager resource={section as Parameters<typeof AdminResourceManager>[0]["resource"]} />;
}
