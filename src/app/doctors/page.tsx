import type { Metadata } from "next";
import { DoctorsDirectory } from "@/components/doctors-directory";
import { listDoctors } from "@/lib/clinic-data";

export const metadata: Metadata = {
  title: "Our doctors",
  description: "Meet the thoughtful, experienced doctors at your clinic.",
};

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const doctors = await listDoctors();
  return (
    <section className="page-wrap py-20 md:py-28">
      <p className="eyebrow">People who care</p>
      <div className="mt-5 grid gap-8 md:grid-cols-[1fr_0.6fr] md:items-end">
        <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.02em]">
          Meet your care <span className="font-medium italic text-[#176b68]">team.</span>
        </h1>
        <p className="pb-1 text-[15px] leading-7 text-[#4a5a58]">
          Experienced clinicians, kind listeners, and real people who care about helping you feel
          better.
        </p>
      </div>
      <DoctorsDirectory doctors={doctors} />
    </section>
  );
}
