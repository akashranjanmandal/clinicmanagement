import type { Metadata } from "next";
import { BookingPage } from "@/components/booking-page";

export const metadata: Metadata = {
  title: "Book an appointment",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BookAppointmentPage({ searchParams }: { searchParams: Promise<{ doctor?: string }> }) {
  const { doctor = "" } = await searchParams;
  return <BookingPage initialDoctor={doctor} />;
}
