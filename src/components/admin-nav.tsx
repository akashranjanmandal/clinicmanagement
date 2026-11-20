"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarRange,
  HeartPulse,
  Home,
  Info,
  Mail,
  Menu,
  Stethoscope,
  X,
} from "lucide-react";
import { AdminLogout } from "@/components/admin-logout";

type Counts = { pending: number; messages: number };

const groups = [
  {
    title: "Daily work",
    items: [
      { href: "/admin", label: "Home", icon: Home },
      { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck, count: "pending" as const },
      { href: "/admin/messages", label: "Contact messages", icon: Mail, count: "messages" as const },
    ],
  },
  {
    title: "Clinic setup",
    items: [
      { href: "/admin/doctors", label: "Doctors, timings & leave", icon: Stethoscope },
      { href: "/admin/holidays", label: "Clinic holidays", icon: CalendarRange },
      { href: "/admin/departments", label: "Departments", icon: Building2 },
      { href: "/admin/services", label: "Services", icon: HeartPulse },
      { href: "/admin/settings", label: "Clinic details", icon: Info },
    ],
  },
];

export function AdminNav({ user, counts }: { user: { name: string; role: string }; counts: Counts }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = groups.flatMap((g) => g.items).find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)));

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-[#cfdad5] bg-white px-4 py-3 lg:hidden">
        <p className="text-lg font-bold">{current?.label ?? "Clinic admin"}</p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="admin-menu" className="adm-btn adm-btn-outline adm-btn-sm">
          {open ? <X size={20} /> : <Menu size={20} />} {open ? "Close" : "Menu"}
        </button>
      </div>
      <aside id="admin-menu" className={`${open ? "block" : "hidden"} border-[#cfdad5] bg-white p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto lg:border-r-2 lg:p-5`}>
        <div className="hidden px-2 pb-3 lg:block">
          <p className="text-xl font-bold">Clinic Admin</p>
          <p className="text-base text-[#3f524f]">Front desk console</p>
        </div>
        <nav aria-label="Admin menu" className="grid gap-4">
          {groups.filter((group) => group.title === "Daily work" || user.role === "super_admin").map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-sm font-bold uppercase tracking-wider text-[#3f524f]">{group.title}</p>
              <div className="grid gap-1">
                {group.items.map(({ href, label, icon: Icon, ...rest }) => {
                  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                  const countKey = "count" in rest ? rest.count : undefined;
                  const count = countKey ? counts[countKey] : 0;
                  return (
                    <Link key={href} href={href === "/admin/appointments" && counts.pending > 0 ? "/admin/appointments?tab=pending" : href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className="adm-nav-link">
                      <Icon size={22} aria-hidden /> {label}
                      {count > 0 && <span className="adm-count" aria-label={`${count} waiting`}>{count}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="sticky bottom-0 mt-auto border-t-2 border-[#cfdad5] bg-white pt-3">
          <p className="px-2 text-base font-bold">{user.name}</p>
          <p className="px-2 text-sm capitalize text-[#3f524f]">{user.role.replace("_", " ")}</p>
          <AdminLogout />
        </div>
      </aside>
    </>
  );
}
