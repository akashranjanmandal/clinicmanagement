"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, LoaderCircle } from "lucide-react";
import type { DoctorCardData } from "@/lib/clinic-content";
import { formatDate, formatTime } from "@/lib/admin-format";

type CreatedAppointment = {
  reference: string;
  status: "pending" | "confirmed";
};

function todayInTimezone(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function BookingForm({
  doctors,
  initialDoctor,
  clinicPhone,
  whatsapp,
  timeZone,
}: {
  doctors: DoctorCardData[];
  initialDoctor: string;
  clinicPhone: string;
  whatsapp: string;
  timeZone: string;
}) {
  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slotResult, setSlotResult] = useState<{
    key: string;
    slots: string[];
    error: string;
  } | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [appointment, setAppointment] = useState<CreatedAppointment | null>(null);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => (doctor.id ?? doctor.slug) === doctorId),
    [doctorId, doctors],
  );
  const requestKey = doctorId && date ? `${doctorId}:${date}` : "";
  const slots = slotResult?.key === requestKey ? slotResult.slots : [];
  const availabilityError = slotResult?.key === requestKey ? slotResult.error : "";
  const loadingSlots = Boolean(requestKey && slotResult?.key !== requestKey);

  useEffect(() => {
    if (!doctorId || !date) return;
    const controller = new AbortController();
    fetch(`/api/appointments/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as { slots?: string[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not load appointment times.");
        setSlotResult({ key: `${doctorId}:${date}`, slots: payload.slots ?? [], error: "" });
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setSlotResult({ key: `${doctorId}:${date}`, slots: [], error: cause.message });
        }
      })
    return () => controller.abort();
  }, [date, doctorId]);

  async function submitDetails(formData: FormData) {
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
          patientEmail: formData.get("patientEmail"),
          patientAge: formData.get("patientAge") || undefined,
          patientGender: formData.get("patientGender") || undefined,
          visitType: formData.get("visitType"),
          reason: formData.get("reason"),
        }),
      });
      const payload = (await response.json()) as CreatedAppointment & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your appointment could not be booked.");
      setAppointment(payload);
      setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const whatsappMessage = appointment
    ? `Hello, I just booked appointment ${appointment.reference} with ${selectedDoctor?.name ?? "the clinic"} on ${formatDate(date)} at ${formatTime(time)}.`
    : "";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.62fr]">
      <div className="rounded-[26px] border border-[#e6ece8] bg-white p-6 sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex flex-1 items-center gap-2">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${step >= item ? "bg-[#176b68] text-white" : "bg-[#f0f4f1] text-[#5f6f6c]"}`}>
                {step > item ? <Check size={15} /> : item}
              </span>
              <span className={`hidden text-sm font-semibold sm:block ${step === item ? "text-[#203332]" : "text-[#5f6f6c]"}`}>
                {["Choose a time", "Your details", "Confirmation"][item - 1]}
              </span>
              {item < 3 && <span className="h-px flex-1 bg-[#e6ece8]" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Choose your doctor & time</h2>
            <p className="mt-2 text-base text-[#4a5a58]">Select a doctor, then pick an available day and time.</p>
            <label className="mt-7 block text-base font-bold text-[#2f3f3d]">
              Doctor
              <select
                value={doctorId}
                onChange={(event) => {
                  setDoctorId(event.target.value);
                  setTime("");
                }}
                required
                disabled={!doctors.length}
                className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-medium outline-none focus:border-[#176b68]"
              >
                <option value="">
                  {doctors.length ? "Choose a doctor" : "No doctors available right now"}
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor.slug} value={doctor.id ?? doctor.slug}>
                    {doctor.name} · {doctor.specialization}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-5 block text-base font-bold text-[#2f3f3d]">
              Appointment date
              <input
                type="date"
                min={todayInTimezone(timeZone)}
                value={date}
                disabled={!doctors.length}
                onChange={(event) => {
                  setDate(event.target.value);
                  setTime("");
                }}
                className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base outline-none focus:border-[#176b68]"
              />
            </label>
            <div className="mt-6">
              <p className="text-base font-bold text-[#2f3f3d]">Available times</p>
              {loadingSlots ? (
                <p className="mt-4 flex items-center gap-2 text-base text-[#4a5a58]"><LoaderCircle size={16} className="animate-spin" /> Checking availability…</p>
              ) : slots.length ? (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setTime(slot)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${slot === time ? "border-[#176b68] bg-[#e5f4ef] text-[#115350]" : "border-[#e6ece8] text-[#4a5a58] hover:border-[#9bbdad]"}`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-[#f7f9f7] px-4 py-3 text-base text-[#5f6f6c]">
                  {!doctors.length
                    ? "Our appointment calendar is being prepared. Please check back soon."
                    : doctorId && date
                      ? "No times are available. Choose another date."
                      : "Choose a doctor and date to see available times."}
                </p>
              )}
            </div>
            {(error || availabilityError) && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error || availabilityError}</p>}
            <button
              type="button"
              disabled={!doctorId || !date || !time}
              onClick={() => { setError(""); setStep(2); }}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#115350]"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <form action={submitDetails}>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">A few details about you</h2>
            <p className="mt-2 text-base text-[#4a5a58]">We only ask for what we need to arrange your visit.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="text-base font-bold text-[#2f3f3d] sm:col-span-2">
                Full name *
                <input name="patientName" required minLength={2} maxLength={100} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
              </label>
              <label className="text-base font-bold text-[#2f3f3d]">
                Mobile number *
                <input name="patientPhone" required minLength={7} maxLength={25} autoComplete="tel" type="tel" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
              </label>
              <label className="text-base font-bold text-[#2f3f3d]">
                Email (optional)
                <input name="patientEmail" type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
              </label>
              <label className="text-base font-bold text-[#2f3f3d]">
                Age (optional)
                <input name="patientAge" type="number" min={0} max={120} className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
              </label>
              <label className="text-base font-bold text-[#2f3f3d]">
                Visit type
                <select name="visitType" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]">
                  <option value="first">First visit</option>
                  <option value="follow-up">Follow-up</option>
                </select>
              </label>
              <label className="text-base font-bold text-[#2f3f3d] sm:col-span-2">
                Reason for visit (optional)
                <textarea name="reason" rows={3} maxLength={500} className="mt-2 w-full resize-y rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
              </label>
            </div>
            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={() => { setError(""); setStep(1); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe8e2] px-5 py-4 text-base font-bold text-[#425553]">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-4 text-base font-bold text-white disabled:opacity-60 hover:bg-[#115350]">
                {busy ? <><LoaderCircle size={16} className="animate-spin" /> Booking…</> : <>Request appointment <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}

        {step === 3 && appointment && (
          <div className="py-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e5f4ef] text-[#176b68]"><Check size={25} /></span>
            <p className="eyebrow mt-6">Request received</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em]">You&apos;re in good hands.</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#4a5a58]">
              Your appointment is {appointment.status}. Our team will be in touch to confirm the details.
            </p>
            <div className="mx-auto mt-7 max-w-sm rounded-[20px] bg-[#f4f7f4] p-5 text-left">
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#4a5a58]">Reference</p>
              <p className="mt-1 text-xl font-bold tracking-[0.08em]">{appointment.reference}</p>
              <div className="mt-4 flex items-center gap-2 text-base text-[#4a5a58]"><Clock3 size={15} /> {formatDate(date)} at {formatTime(time)}</div>
              <p className="mt-2 text-base font-semibold">{selectedDoctor?.name}</p>
            </div>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/^\+/, "")}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#176b68] px-6 py-3.5 text-base font-bold text-white hover:bg-[#115350]"
              >
                Send details on WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      <aside className="h-fit rounded-[26px] bg-[#e5f4ef] p-7 sm:p-8">
        <p className="eyebrow">Your visit</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">A little more peace of mind.</h2>
        <div className="mt-7 border-t border-[#cbded3] pt-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4a5a58]">Selected doctor</p>
          <p className="mt-2 font-semibold">{selectedDoctor?.name ?? "Choose a doctor"}</p>
          <p className="mt-1 text-base text-[#4a5a58]">{selectedDoctor?.specialization ?? "Care that fits you"}</p>
        </div>
        <div className="mt-6 border-t border-[#cbded3] pt-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#4a5a58]">Date & time</p>
          <p className="mt-2 font-semibold">{date ? formatDate(date) : "Choose a date"}</p>
          <p className="mt-1 text-base text-[#4a5a58]">{time ? formatTime(time) : "Choose an available time"}</p>
        </div>
        <p className="mt-7 text-sm leading-6 text-[#4a5a58]">
          Your information is only used to coordinate your appointment.
          {clinicPhone && <> Need help? Call <a href={`tel:${clinicPhone.replaceAll(" ", "")}`} className="font-bold text-[#176b68]">{clinicPhone}</a>.</>}
        </p>
      </aside>
    </div>
  );
}
