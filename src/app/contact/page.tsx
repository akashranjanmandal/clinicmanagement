import type { Metadata } from "next";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { LocationCard } from "@/components/location-card";
import { getClinicSettings } from "@/lib/clinic-data";

export const metadata: Metadata = {
  title: "Contact your clinic",
  description: "Get in touch with your clinic or plan your visit.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getClinicSettings();
  const phone = settings?.phone ?? "";
  const email = settings?.email ?? "";
  const address = settings?.address ?? "";
  const hours = settings?.workingHours ?? "";
  const mapUrl = settings?.mapsEmbedUrl || process.env.NEXT_PUBLIC_MAPS_EMBED_URL;
  return (
    <section className="page-wrap py-20 md:py-28">
      <p className="eyebrow">We&apos;re easy to reach</p>
      <h1 className="mt-5 max-w-3xl text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
        We&apos;re here to <span className="font-medium italic text-[#176b68]">help.</span>
      </h1>
      <p className="mt-5 max-w-lg text-lg leading-8 text-[#4a5a58]">
        Questions about a visit, getting here, or finding the right doctor? Send us a note or give
        our friendly team a call.
      </p>
      <div className="mt-12 grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {phone && <a href={`tel:${phone.replaceAll(" ", "")}`} className="flex gap-4 rounded-[20px] border border-[#e6ece8] bg-white p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f4ef] text-[#176b68]"><Phone size={18} /></span>
              <span><span className="block text-sm font-bold text-[#4a5a58]">Call our team</span><span className="mt-1 block text-base font-semibold">{phone}</span></span>
            </a>}
            {email && <a href={`mailto:${email}`} className="flex gap-4 rounded-[20px] border border-[#e6ece8] bg-white p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f4ef] text-[#176b68]"><Mail size={18} /></span>
              <span><span className="block text-sm font-bold text-[#4a5a58]">Email us</span><span className="mt-1 block text-base font-semibold">{email}</span></span>
            </a>}
            {address && <div className="flex gap-4 rounded-[20px] border border-[#e6ece8] bg-white p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f4ef] text-[#176b68]"><MapPin size={18} /></span>
              <span><span className="block text-sm font-bold text-[#4a5a58]">Visit us</span><span className="mt-1 block text-base font-semibold leading-6">{address}</span></span>
            </div>}
            {hours && <div className="flex gap-4 rounded-[20px] border border-[#e6ece8] bg-white p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f4ef] text-[#176b68]"><Clock3 size={18} /></span>
              <span><span className="block text-sm font-bold text-[#4a5a58]">Opening hours</span><span className="mt-1 block whitespace-pre-line text-base font-semibold leading-6">{hours}</span></span>
            </div>}
          </div>
          {mapUrl ? (
            <div className="mt-5 overflow-hidden rounded-[20px] border border-[#e6ece8]">
              <iframe
                src={mapUrl}
                title="Clinic location map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[280px] w-full border-0"
              />
            </div>
          ) : address ? (
            <div className="mt-5"><LocationCard address={address} /></div>
          ) : null}
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
