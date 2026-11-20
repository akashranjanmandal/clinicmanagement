import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { getAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { appointments, contactMessages } from "@/lib/db/schema";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  let pending = 0;
  let messages = 0;
  if (db) {
    const [p] = await db.select({ value: count() }).from(appointments).where(eq(appointments.status, "pending"));
    const [m] = await db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.status, "new"));
    pending = p?.value ?? 0;
    messages = m?.value ?? 0;
  }
  return (
    <div className="min-h-screen bg-[#f3f7f5] lg:grid lg:grid-cols-[290px_1fr]">
      <AdminNav user={{ name: user.name, role: user.role }} counts={{ pending, messages }} />
      <div className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </div>
    </div>
  );
}
