import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Building2,
  CalendarDays,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  Mail,
  Settings,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLogout } from "@/components/admin-logout";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/schedules", label: "Schedules", icon: Clock3 },
  { href: "/admin/leaves", label: "Doctor leave", icon: CalendarDays },
  { href: "/admin/holidays", label: "Clinic holidays", icon: CalendarDays },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/services", label: "Services", icon: HeartPulse },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/settings", label: "Clinic settings", icon: Settings },
  { href: "/admin/users", label: "Admin users", icon: UserRound },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getAdminSession();
  if (!user) redirect("/admin/login");
  return (
    <div className="min-h-[75vh] bg-[#f5f8f5]">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[230px_1fr] lg:gap-9 lg:px-10 lg:py-9">
        <aside className="flex flex-col rounded-[24px] border border-[#e6ece8] bg-white p-5">
          <Link href="/" className="flex items-center gap-3 px-2 py-2">
            <span className="grid size-9 place-items-center rounded-[13px] bg-[#176b68] text-white">a</span>
            <span>            <span className="block text-sm font-bold">clinic management</span><span className="text-[10px] text-[#82928d]">ADMIN CONSOLE</span></span>
          </Link>
          <p className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#82928d]">Workspace</p>
          <nav className="grid gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#657573] transition-colors hover:bg-[#e5f4ef] hover:text-[#176b68]">
                <Icon size={17} /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-[#e6ece8] pt-5">
            <div className="flex items-center gap-3 px-2">
              <span className="grid size-9 place-items-center rounded-full bg-[#e5f4ef] text-[#176b68]"><Stethoscope size={16} /></span>
              <span className="min-w-0"><span className="block truncate text-xs font-bold">{user.name}</span><span className="text-[10px] text-[#82928d]">{user.role.replace("_", " ")}</span></span>
              <Activity size={15} className="ml-auto text-[#8ab59e]" />
            </div>
            <AdminLogout />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
