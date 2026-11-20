import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Baby, Heart, Scan, Stethoscope } from "lucide-react";
import { listServices } from "@/lib/clinic-data";

export const metadata: Metadata = {
  title: "Care and services",
  description: "Explore care services at your clinic.",
};

const iconMap = { heart: Heart, activity: Activity, baby: Baby, scan: Scan, stethoscope: Stethoscope };

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await listServices();
  return (
    <>
      <section className="page-wrap py-20 md:py-28">
        <p className="eyebrow">Care, thoughtfully connected</p>
        <div className="mt-5 grid gap-8 md:grid-cols-[1fr_0.65fr] md:items-end">
          <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.075em]">
            The care you need, <span className="font-medium italic text-[#176b68]">all in one place.</span>
          </h1>
          <p className="pb-1 text-[15px] leading-7 text-[#657573]">
            From everyday wellbeing to specialist support, our team makes it simpler to get the
            right care at the right time.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon as keyof typeof iconMap] ?? Stethoscope;
            return (
              <article key={service.title} className="rounded-[22px] border border-[#e6ece8] bg-white p-7">
                <span className="grid size-12 place-items-center rounded-[16px] bg-[#e5f4ef] text-[#176b68]">
                  <Icon size={20} />
                </span>
                <h2 className="mt-7 text-xl font-semibold tracking-[-0.045em]">{service.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#657573]">{service.shortDescription}</p>
                {"departmentName" in service && service.departmentName && (
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#176b68]">
                    {service.departmentName}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        {!services.length && (
          <p className="mt-8 rounded-[20px] border border-dashed border-[#cbd9d1] bg-white p-6 text-sm text-[#657573]">
            Services will appear here after they are added to the clinic database.
          </p>
        )}
      </section>
      <section className="bg-[#f0f6f2] py-20">
        <div className="page-wrap grid gap-10 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">A welcoming space</p>
            <h2 className="section-title mt-4">Thoughtful details make a difference.</h2>
          </div>
          <div className="grid gap-5 text-sm leading-7 text-[#657573] sm:grid-cols-2">
            <p>Comfortable, accessible spaces designed to help you feel at ease from the moment you arrive.</p>
            <p>Convenient diagnostics and coordinated follow-up, so your care feels connected.</p>
            <p>Clear guidance from our team at each step of your health journey.</p>
            <p>Conveniently located for your community, with clear directions from your clinic team.</p>
          </div>
        </div>
        <div className="page-wrap mt-10">
          <Link href="/appointments/book" className="inline-flex items-center gap-2 rounded-full bg-[#176b68] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#115350]">
            Find the right care <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
