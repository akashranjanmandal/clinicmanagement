import type { Metadata } from "next";
import { BookingPage } from "@/components/booking-page";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Choose a doctor and request an appointment with your clinic.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default function Home() {
  return <BookingPage />;
}
