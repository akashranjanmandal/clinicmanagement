import { BookingForm } from "@/components/booking-form";
import { getClinicSettings, listDoctors } from "@/lib/clinic-data";

export async function BookingPage({ initialDoctor = "" }: { initialDoctor?: string }) {
  const [doctors, settings] = await Promise.all([listDoctors(), getClinicSettings()]);
  return (
    <section className="mx-auto w-full max-w-[640px] px-4 py-8 sm:py-14">
      <p className="text-center text-lg font-bold text-[#176b68]">{settings?.name?.trim() || "Your Clinic"}</p>
      <h1 className="mb-6 mt-2 text-center text-4xl font-bold leading-tight sm:text-5xl">Book an appointment</h1>
      <BookingForm doctors={doctors} initialDoctor={initialDoctor} clinicPhone={settings?.phone ?? ""} whatsapp={settings?.whatsapp ?? ""} clinicName={settings?.name?.trim() || "the clinic"} timeZone={settings?.timezone ?? "UTC"} />
    </section>
  );
}
