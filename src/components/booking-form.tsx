"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { DoctorCardData } from "@/lib/clinic-content";
import { formatDate, formatTime } from "@/lib/admin-format";

type Created = { reference: string; status: "pending" | "confirmed" };

function todayInTimezone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

const field = "mt-2 block w-full rounded-xl border-2 border-[#9fb2ab] bg-white px-4 py-3.5 text-lg font-normal text-[#12211f] outline-none focus:border-[#176b68]";
const label = "block text-base font-bold text-[#12211f]";

export function BookingForm({
  doctors,
  initialDoctor,
  clinicPhone,
  timeZone,
}: {
  doctors: DoctorCardData[];
  initialDoctor: string;
  clinicPhone: string;
  whatsapp?: string;
  timeZone: string;
}) {
  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [result, setResult] = useState<{ key: string; slots: string[]; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Created | null>(null);

  const key = doctorId && date ? `${doctorId}:${date}` : "";
  const slots = result?.key === key ? result.slots : [];
  const slotError = result?.key === key ? result.error : "";
  const loading = Boolean(key && result?.key !== key);
  const doctor = doctors.find((item) => (item.id ?? item.slug) === doctorId);

  useEffect(() => {
    if (!doctorId || !date) return;
    const controller = new AbortController();
    fetch(`/api/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { slots?: string[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load times.");
        setResult({ key: `${doctorId}:${date}`, slots: payload.slots ?? [], error: "" });
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") setResult({ key: `${doctorId}:${date}`, slots: [], error: cause.message });
      });
    return () => controller.abort();
  }, [date, doctorId]);

  async function submit(formData: FormData) {
    if (!time) {
      setError("Please choose a time.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          appointmentDate: date,
          startTime: time,
          patientName: formData.get("patientName"),
          patientPhone: formData.get("patientPhone"),
          reason: formData.get("reason"),
          visitType: "first",
        }),
      });
      const payload = (await response.json()) as Created & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your appointment could not be booked.");
      setDone(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[24px] border-2 border-[#cfdad5] bg-white p-7 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e5f4ef] text-[#176b68]"><Check size={30} /></span>
        <h2 className="mt-5 text-3xl font-bold">Appointment requested</h2>
        <p className="mt-3 text-lg text-[#3f524f]">
          {doctor?.name} · {formatDate(date)} at {formatTime(time)}
        </p>
        <p className="mt-2 text-lg text-[#3f524f]">
          {done.status === "confirmed" ? "Your appointment is confirmed." : "Our team will call you to confirm."}
        </p>
        <p className="mt-5 inline-block rounded-xl bg-[#f1f6f3] px-5 py-3 text-lg">Booking number: <strong>{done.reference}</strong></p>
      </div>
    );
  }

  return (
    <form action={submit} className="rounded-[24px] border-2 border-[#cfdad5] bg-white p-6 sm:p-9">
      <div className="grid gap-5">
        <label className={label}>
          Doctor
          <select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setTime(""); }} required disabled={!doctors.length} className={field}>
            <option value="">{doctors.length ? "Choose a doctor" : "No doctors available right now"}</option>
            {doctors.map((item) => <option key={item.slug} value={item.id ?? item.slug}>{item.name} — {item.specialization}</option>)}
          </select>
        </label>

        <label className={label}>
          Date
          <input type="date" required min={todayInTimezone(timeZone)} value={date} disabled={!doctors.length} onChange={(e) => { setDate(e.target.value); setTime(""); }} className={field} />
        </label>

        <div>
          <p className={label}>Time</p>
          {loading ? (
            <p className="mt-2 flex items-center gap-2 text-lg text-[#3f524f]"><LoaderCircle size={20} className="animate-spin" /> Checking times…</p>
          ) : slots.length ? (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button type="button" key={slot} aria-pressed={slot === time} onClick={() => setTime(slot)} className={`rounded-xl border-2 px-3 py-3 text-lg font-semibold ${slot === time ? "border-[#176b68] bg-[#176b68] text-white" : "border-[#9fb2ab] bg-white text-[#12211f] hover:border-[#176b68]"}`}>
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-xl bg-[#f1f6f3] px-4 py-3 text-lg text-[#3f524f]">
              {slotError || (doctorId && date ? "No times available on this date. Please choose another date." : "Choose a doctor and date to see times.")}
            </p>
          )}
        </div>

        <label className={label}>
          Your name
          <input name="patientName" required minLength={2} maxLength={100} autoComplete="name" className={field} />
        </label>
        <label className={label}>
          Mobile number
          <input name="patientPhone" required minLength={7} maxLength={25} autoComplete="tel" type="tel" inputMode="tel" className={field} />
        </label>
        <label className={label}>
          Reason for visit <span className="font-normal text-[#3f524f]">(optional)</span>
          <textarea name="reason" rows={2} maxLength={500} className={`${field} resize-y`} />
        </label>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border-2 border-[#e0a3a3] bg-[#fdecec] px-4 py-3 text-lg font-semibold text-[#7a1414]">{error}</p>}

      <button type="submit" disabled={busy || !doctorId || !date || !time} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#176b68] px-6 py-4 text-xl font-bold text-white hover:bg-[#115350] disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <><LoaderCircle size={22} className="animate-spin" /> Booking…</> : "Book appointment"}
      </button>
      {clinicPhone && <p className="mt-4 text-center text-base text-[#3f524f]">Need help? Call <a href={`tel:${clinicPhone.replace(/[^\d+]/g, "")}`} className="font-bold text-[#176b68] underline">{clinicPhone}</a></p>}
    </form>
  );
}
