import type { Metadata } from "next";
import { BookingStatus } from "@/components/booking-status";

export const metadata: Metadata = {
  title: "Check your booking",
  description: "Check whether your appointment has been confirmed.",
  robots: { index: false, follow: true },
};

export default function BookingStatusPage() {
  return (
    <section className="mx-auto w-full max-w-[640px] px-4 py-8 sm:py-14">
      <h1 className="mb-2 text-center text-4xl font-bold leading-tight sm:text-5xl">Check your booking</h1>
      <p className="mb-6 text-center text-lg text-[#3f524f]">Enter the booking number you were given and your mobile number.</p>
      <BookingStatus />
    </section>
  );
}
