import type { Metadata } from "next";
import { BookingForm } from "@/components/booking-form";
import { getClinicSettings, listDoctors } from "@/lib/clinic-data";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Choose a doctor and request an appointment that works for you.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ doctor?: string }> };

export default async function BookAppointmentPage({ searchParams }: Props) {
  const [{ doctor = "" }, doctors, settings] = await Promise.all([
    searchParams,
    listDoctors(),
    getClinicSettings(),
  ]);
  return (
    <section className="page-wrap py-16 md:py-24">
      <p className="eyebrow">We&apos;ll take it from here</p>
      <h1 className="mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.075em]">
        Let&apos;s find a time that <span className="font-medium italic text-[#176b68]">works for you.</span>
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-[#657573]">
        Choose your doctor and an available time. Your appointment will be requested and our team
        will follow up to confirm.
      </p>
      <div className="mt-10">
        <BookingForm
          doctors={doctors}
          initialDoctor={doctor}
          clinicPhone={settings?.phone ?? ""}
          whatsapp={settings?.whatsapp ?? ""}
          timeZone={settings?.timezone ?? "UTC"}
        />
      </div>
    </section>
  );
}
