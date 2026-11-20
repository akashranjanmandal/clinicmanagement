"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DoctorCard } from "@/components/doctor-card";
import type { DoctorCardData } from "@/lib/clinic-content";

export function DoctorsDirectory({ doctors }: { doctors: DoctorCardData[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const departments = [...new Set(doctors.map((doctor) => doctor.departmentName))];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesQuery =
        !needle ||
        [doctor.name, doctor.specialization, doctor.qualification]
          .some((value) => value.toLowerCase().includes(needle));
      const matchesDepartment =
        department === "all" || doctor.departmentName === department;
      return matchesQuery && matchesDepartment;
    });
  }, [department, doctors, query]);

  return (
    <>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-full border border-[#e6ece8] bg-white px-5 py-3.5">
          <Search size={17} className="text-[#5f6f6c]" />
          <span className="sr-only">Search doctors</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or specialty"
            className="w-full bg-transparent text-base outline-none placeholder:text-[#97a39f]"
          />
        </label>
        <label className="rounded-full border border-[#e6ece8] bg-white px-5 py-3.5 text-base text-[#4a5a58]">
          <span className="sr-only">Filter by department</span>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="min-w-[180px] bg-transparent outline-none"
          >
            <option value="all">All departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doctor) => <DoctorCard key={doctor.slug} doctor={doctor} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-[24px] border border-dashed border-[#cbd9d1] bg-white p-12 text-center">
          <h2 className="text-lg font-semibold">No doctors found</h2>
          <p className="mt-2 text-base text-[#4a5a58]">Try a different name or department.</p>
        </div>
      )}
    </>
  );
}
