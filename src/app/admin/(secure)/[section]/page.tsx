import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminResourceManager } from "@/components/admin-resource-manager";

const sections = new Set([
  "departments",
  "doctors",
  "services",
  "holidays",
  "messages",
  "settings",
]);

type Props = { params: Promise<{ section: string }> };

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  if (user.role !== "super_admin" && section !== "messages") redirect("/admin");
  return <AdminResourceManager resource={section as Parameters<typeof AdminResourceManager>[0]["resource"]} />;
}
