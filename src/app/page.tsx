import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Baby, CalendarCheck, CalendarPlus, Clock3, Heart, MapPin, MessageCircle, Phone, Scan, Stethoscope, UserRoundCheck } from "lucide-react";
import { DoctorCard } from "@/components/doctor-card";
import { LocationCard } from "@/components/location-card";
import { getClinicSettings, listDoctors, listServices } from "@/lib/clinic-data";

export const dynamic = "force-dynamic";

const iconMap = { heart: Heart, activity: Activity, baby: Baby, scan: Scan, stethoscope: Stethoscope };

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getClinicSettings().catch(() => null);
  const name = settings?.name?.trim() || "Our Clinic";
  return {
    title: { absolute: `${name} | Book a doctor appointment online` },
    description: `${name}: meet our doctors, explore our services and book an appointment online in minutes.${settings?.address ? ` Visit us at ${settings.address.replace(/\s+/g, " ")}.` : ""}`,
    alternates: { canonical: "/" },
    openGraph: { title: `${name} | Book a doctor appointment online`, description: `Meet our doctors, explore our services and book an appointment online at ${name}.`, type: "website", siteName: name },
  };
}

const steps = [
  { icon: UserRoundCheck, title: "Choose a doctor", body: "Pick the doctor or speciality you need." },
  { icon: CalendarCheck, title: "Pick a day and time", body: "See the times that are really free." },
  { icon: Phone, title: "We confirm with you", body: "Our team calls or messages to confirm your visit." },
];

export default async function Home() {
  const [doctors, services, settings] = await Promise.all([listDoctors(), listServices(), getClinicSettings()]);
  const name = settings?.name?.trim() || "Our Clinic";
  const phone = settings?.phone ?? "";
  const whatsapp = (settings?.whatsapp ?? "").replace(/\D/g, "");
  const address = settings?.address ?? "";
  const hours = settings?.workingHours ?? "";
  const mapUrl = settings?.mapsEmbedUrl || process.env.NEXT_PUBLIC_MAPS_EMBED_URL || "";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name,
    url: site,
    ...(phone && { telephone: phone }),
    ...(settings?.email && { email: settings.email }),
    ...(address && { address: { "@type": "PostalAddress", streetAddress: address.replace(/\s+/g, " ") } }),
    ...(hours && { openingHours: hours.replace(/\s+/g, " ") }),
    potentialAction: { "@type": "ReserveAction", target: `${site}/appointments/book`, name: "Book an appointment" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section className="bg-gradient-to-b from-[#e5f4ef] to-[#fafbf9]">
        <div className="page-wrap grid gap-10 py-14 md:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="eyebrow">Welcome to {name}</p>
            <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.8rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
              Quality care, <span className="font-medium italic text-[#176b68]">booked in minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#3f524f]">
              Meet our doctors, see the times that are free and request your appointment online. No calls, no waiting on hold.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/appointments/book" className="inline-flex items-center gap-2 rounded-full bg-[#176b68] px-7 py-4 text-lg font-bold text-white hover:bg-[#115350]"><CalendarPlus size={22} /> Book appointment</Link>
              {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-full border-2 border-[#176b68] bg-white px-6 py-4 text-lg font-bold text-[#176b68] hover:bg-[#e5f4ef]"><Phone size={22} /> {phone}</a>}
              {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello ${name}, I would like to book an appointment.`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1a8f4c] px-6 py-4 text-lg font-bold text-white hover:bg-[#157a40]"><MessageCircle size={22} /> WhatsApp us</a>}
            </div>
          </div>
          <aside className="rounded-[24px] border border-[#cfe0d7] bg-white p-6 shadow-sm sm:p-8" aria-label="Clinic information">
            <h2 className="text-xl font-bold">Visit us</h2>
            <ul className="mt-4 grid gap-4 text-lg">
              {hours && <li className="flex gap-3"><Clock3 className="mt-1 shrink-0 text-[#176b68]" size={22} /><span className="whitespace-pre-line">{hours}</span></li>}
              {address && <li className="flex gap-3"><MapPin className="mt-1 shrink-0 text-[#176b68]" size={22} /><span className="whitespace-pre-line">{address}</span></li>}
              {phone && <li className="flex gap-3"><Phone className="mt-1 shrink-0 text-[#176b68]" size={22} /><a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="font-semibold underline">{phone}</a></li>}
              {!hours && !address && !phone && <li className="text-[#3f524f]">Our contact details are coming soon.</li>}
            </ul>
          </aside>
        </div>
      </section>

      <section className="page-wrap py-16 md:py-20" aria-labelledby="how">
        <p className="eyebrow">Simple and quick</p>
        <h2 id="how" className="section-title mt-3">How booking works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-[22px] border border-[#dbe5df] bg-white p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e5f4ef] text-[#176b68]"><Icon size={24} /></span>
              <p className="mt-5 text-sm font-bold uppercase tracking-widest text-[#176b68]">Step {i + 1}</p>
              <h3 className="mt-1 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-lg leading-7 text-[#3f524f]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {services.length > 0 && (
        <section className="bg-white py-16 md:py-20" aria-labelledby="services">
          <div className="page-wrap">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="eyebrow">What we offer</p><h2 id="services" className="section-title mt-3">Our services</h2></div>
              <Link href="/services" className="inline-flex items-center gap-2 text-lg font-bold text-[#176b68] underline">All services <ArrowRight size={18} /></Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.slice(0, 4).map((service) => {
                const Icon = iconMap[service.icon as keyof typeof iconMap] ?? Stethoscope;
                return (
                  <article key={service.id} className="rounded-[22px] border border-[#dbe5df] bg-[#fafbf9] p-6">
                    <span className="grid size-12 place-items-center rounded-2xl bg-[#e5f4ef] text-[#176b68]"><Icon size={22} /></span>
                    <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                    <p className="mt-2 text-base leading-7 text-[#3f524f]">{service.shortDescription}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="page-wrap py-16 md:py-20" aria-labelledby="doctors">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="eyebrow">People who care</p><h2 id="doctors" className="section-title mt-3">Meet our doctors</h2></div>
          {doctors.length > 0 && <Link href="/doctors" className="inline-flex items-center gap-2 text-lg font-bold text-[#176b68] underline">All doctors <ArrowRight size={18} /></Link>}
        </div>
        {doctors.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{doctors.slice(0, 3).map((doctor) => <DoctorCard key={doctor.slug} doctor={doctor} />)}</div>
        ) : (
          <p className="mt-8 rounded-2xl border border-[#dbe5df] bg-white p-8 text-lg text-[#3f524f]">Our doctors will be listed here soon.</p>
        )}
      </section>

      {(address || mapUrl) && (
        <section className="page-wrap pb-16 md:pb-20" aria-labelledby="find">
          <p className="eyebrow">Find us</p>
          <h2 id="find" className="section-title mt-3">Location</h2>
          <div className="mt-8"><LocationCard address={address} mapUrl={mapUrl} /></div>
        </section>
      )}

      <section className="page-wrap pb-4">
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-[#176b68] p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div><h2 className="text-3xl font-semibold">Ready to see a doctor?</h2><p className="mt-2 text-lg text-white/85">It takes about a minute to request your appointment.</p></div>
          <Link href="/appointments/book" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-[#12302e] hover:bg-[#e5f4ef]"><CalendarPlus size={22} /> Book appointment</Link>
        </div>
      </section>
    </>
  );
}
