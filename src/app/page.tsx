import type { Metadata } from "next";
import { getClinicSettings, listDoctors } from "@/lib/clinic-data";
import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Choose a doctor and request an appointment with your clinic.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [doctors, settings] = await Promise.all([listDoctors(), getClinicSettings()]);

  return (
    <section className="page-wrap min-h-screen py-10 md:py-16">
      <div className="mx-auto max-w-[1020px]">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">Appointment booking</p>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.075em]">
            Book your <span className="font-medium italic text-[#176b68]">appointment.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#657573]">
            Choose a doctor and an available time. Your clinic team will follow up to confirm your visit.
          </p>
        </div>
        <BookingForm
          doctors={doctors}
          initialDoctor=""
          clinicPhone={settings?.phone ?? ""}
          whatsapp={settings?.whatsapp ?? ""}
          timeZone={settings?.timezone ?? "UTC"}
        />
      </div>
    </section>
  );
}
