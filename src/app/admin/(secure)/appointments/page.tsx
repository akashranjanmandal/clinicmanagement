import { AdminAppointments } from "@/components/admin-appointments";

const tabs = ["today", "pending", "upcoming", "past", "all"] as const;

export default async function AdminAppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initialTab = tabs.find((item) => item === tab) ?? "today";
  return <AdminAppointments initialTab={initialTab} />;
}
