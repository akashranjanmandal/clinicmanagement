"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, Clock3, Mail, MapPin, Menu, Phone, X } from "lucide-react";

export type SiteInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  whatsapp: string;
};

const links = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Our doctors" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/appointments/status", label: "Check booking" },
];

const hideChrome = (path: string) => path.startsWith("/admin");
const tel = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

export function SiteHeader({ site }: { site: SiteInfo }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (hideChrome(pathname)) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe5df] bg-white/95 backdrop-blur">
      <div className="page-wrap flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-[#176b68] text-lg font-bold text-white">{site.name.charAt(0).toUpperCase()}</span>
          <span className="max-w-[14rem] truncate text-lg font-bold leading-tight">{site.name}</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-base font-semibold hover:bg-[#e5f4ef] hover:text-[#115350] ${isActive(link.href) ? "bg-[#e5f4ef] text-[#115350]" : "text-[#3b4d4a]"}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {site.phone && (
            <a href={tel(site.phone)} className="hidden items-center gap-2 whitespace-nowrap rounded-full border-2 border-[#176b68] px-4 py-2 text-base font-bold text-[#176b68] hover:bg-[#e5f4ef] 2xl:inline-flex">
              <Phone size={18} /> {site.phone}
            </a>
          )}
          <Link href="/appointments/book" className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-[#176b68] px-5 py-2.5 text-base font-bold text-white hover:bg-[#115350] sm:inline-flex">
            <CalendarPlus size={18} /> Book appointment
          </Link>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="site-menu" className="inline-flex items-center gap-2 rounded-full border-2 border-[#176b68] px-4 py-2 text-base font-bold text-[#176b68] xl:hidden">
            {open ? <X size={20} /> : <Menu size={20} />} {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <nav id="site-menu" aria-label="Mobile" className="page-wrap grid gap-1 pb-4 xl:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={isActive(link.href) ? "page" : undefined} className={`rounded-xl px-4 py-3 text-lg font-semibold ${isActive(link.href) ? "bg-[#e5f4ef] text-[#115350]" : "text-[#3b4d4a]"}`}>
              {link.label}
            </Link>
          ))}
          <Link href="/appointments/book" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-3.5 text-lg font-bold text-white"><CalendarPlus size={20} /> Book appointment</Link>
          {site.phone && <a href={tel(site.phone)} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#176b68] px-5 py-3 text-lg font-bold text-[#176b68]"><Phone size={20} /> Call {site.phone}</a>}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter({ site }: { site: SiteInfo }) {
  const pathname = usePathname();
  if (hideChrome(pathname)) return null;
  return (
    <>
      <footer className="mt-20 border-t border-[#dbe5df] bg-[#12302e] text-white">
        <div className="page-wrap grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-xl font-bold">{site.name}</p>
            <p className="mt-3 max-w-sm text-base leading-7 text-white/80">Care that fits your schedule. Choose a doctor and book a time online in a few minutes.</p>
            <Link href="/appointments/book" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-bold text-[#12302e] hover:bg-[#e5f4ef]"><CalendarPlus size={18} /> Book appointment</Link>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#9fd3c4]">Explore</p>
            <ul className="mt-3 grid gap-2 text-base">
              {links.map((link) => <li key={link.href}><Link href={link.href} className="text-white/90 underline-offset-4 hover:underline">{link.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#9fd3c4]">Contact us</p>
            <ul className="mt-3 grid gap-3 text-base text-white/90">
              {site.phone && <li className="flex gap-3"><Phone size={20} className="mt-0.5 shrink-0" /><a href={tel(site.phone)} className="hover:underline">{site.phone}</a></li>}
              {site.email && <li className="flex gap-3"><Mail size={20} className="mt-0.5 shrink-0" /><a href={`mailto:${site.email}`} className="break-all hover:underline">{site.email}</a></li>}
              {site.address && <li className="flex gap-3"><MapPin size={20} className="mt-0.5 shrink-0" /><span className="whitespace-pre-line">{site.address}</span></li>}
              {site.hours && <li className="flex gap-3"><Clock3 size={20} className="mt-0.5 shrink-0" /><span className="whitespace-pre-line">{site.hours}</span></li>}
              {!site.phone && !site.email && !site.address && !site.hours && <li><Link href="/contact" className="underline">Send us a message</Link></li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="page-wrap flex flex-col items-center justify-between gap-2 py-5 text-sm text-white/70 sm:flex-row">
            <p>© {new Date().getFullYear()} {site.name}. For emergencies, call your local emergency number.</p>
            <Link href="/admin/login" className="font-semibold text-white/90 underline-offset-4 hover:underline">Staff login</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
