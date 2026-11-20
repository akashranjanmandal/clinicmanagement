import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { DoctorCardData } from "@/lib/clinic-content";

export function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#e6ece8] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-42px_rgba(23,65,58,0.35)]">
      <Link href={`/doctors/${doctor.slug}`} className="block">
        <div
          role="img"
          aria-label={`Portrait of ${doctor.name}`}
          className="h-[270px] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
          style={{
            backgroundImage: doctor.imageUrl
              ? `linear-gradient(180deg, transparent 56%, rgba(32,51,50,.12)), url("${doctor.imageUrl}")`
              : "linear-gradient(135deg, #e5f4ef, #b8d9ca)",
          }}
        />
      </Link>
      <div className="p-6">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#176b68]">
          {doctor.departmentName}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">{doctor.name}</h3>
        <p className="mt-1 text-base text-[#4a5a58]">{doctor.qualification}</p>
        <p className="mt-4 min-h-[48px] text-base leading-6 text-[#4a5a58]">{doctor.biography}</p>
        <div className="mt-5 flex items-center justify-between border-t border-[#e6ece8] pt-4">
          <span className="text-sm font-semibold text-[#4a5a58]">
            {doctor.experienceYears} years experience
          </span>
          <Link
            href={`/appointments/book?doctor=${doctor.id ?? doctor.slug}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#176b68] hover:text-[#115350]"
          >
            <CalendarDays size={15} /> Book <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
