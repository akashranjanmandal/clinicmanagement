import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check } from "lucide-react";
import { getDoctor } from "@/lib/clinic-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) return { title: "Doctor not found" };
  return {
    title: doctor.name,
    description: `${doctor.name}, ${doctor.specialization} at Clinic Management.`,
    openGraph: { title: `${doctor.name} | Clinic Management`, description: doctor.biography },
  };
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = await getDoctor(slug);
  if (!doctor) notFound();

  return (
    <section className="page-wrap py-14 md:py-20">
      <Link href="/doctors" className="inline-flex items-center gap-2 text-sm font-semibold text-[#657573] hover:text-[#176b68]">
        <ArrowLeft size={16} /> All doctors
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div
          role="img"
          aria-label={`Portrait of ${doctor.name}`}
          className="min-h-[400px] rounded-[30px] bg-cover bg-center lg:min-h-[590px]"
          style={{ backgroundImage: doctor.imageUrl ? `url("${doctor.imageUrl}")` : "linear-gradient(135deg, #e5f4ef, #b8d9ca)" }}
        />
        <div className="py-2 lg:py-10">
          <p className="eyebrow">{doctor.departmentName} · {doctor.specialization}</p>
          <h1 className="mt-5 text-[clamp(2.8rem,5vw,4.7rem)] font-semibold leading-[1.02] tracking-[-0.07em]">
            {doctor.name}
          </h1>
          <p className="mt-3 text-base text-[#657573]">{doctor.qualification}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full bg-[#e5f4ef] px-4 py-2 text-xs font-semibold text-[#176b68]">
              {doctor.experienceYears} years of experience
            </span>
            {doctor.consultationFee ? (
              <span className="rounded-full border border-[#e6ece8] bg-white px-4 py-2 text-xs font-semibold text-[#657573]">
                Consultation ₹{doctor.consultationFee}
              </span>
            ) : null}
          </div>
          <p className="mt-8 max-w-xl text-[15px] leading-8 text-[#657573]">{doctor.biography}</p>
          <div className="mt-8 rounded-[22px] border border-[#e6ece8] bg-white p-6">
            <h2 className="text-sm font-bold">A thoughtful approach to your care</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[#657573]">
              <li className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-[#176b68]" /> Clear guidance and time for your questions</li>
              <li className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-[#176b68]" /> Coordinated care with the wider clinic team</li>
              <li className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-[#176b68]" /> A care plan shaped around your needs</li>
            </ul>
          </div>
          <Link
            href={`/appointments/book?doctor=${doctor.id ?? doctor.slug}`}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#176b68] px-6 py-4 text-sm font-bold text-white hover:bg-[#115350]"
          >
            <CalendarDays size={17} /> Book with {doctor.name.split(" ")[1]} <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
