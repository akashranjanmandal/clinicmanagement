"use client";

import { useState } from "react";
import { CalendarCheck, Clock3, LoaderCircle, Search } from "lucide-react";
import { formatDate, formatTime } from "@/lib/admin-format";
import { useSingleFlight } from "@/lib/use-single-flight";

type Result = { status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"; reference: string; doctorName: string; appointmentDate: string; startTime: string };

const copy: Record<Result["status"], { title: string; body: string; tone: string }> = {
  pending: { title: "Waiting for confirmation", body: "We have your request. Our team will confirm it shortly. Check this page again or wait for our call or message.", tone: "bg-[#fff4d1] border-[#e6c766] text-[#5c3d00]" },
  confirmed: { title: "Your appointment is confirmed", body: "Please arrive about 10 minutes early. If you cannot come, please call the clinic.", tone: "bg-[#e3f6ea] border-[#9ed4b2] text-[#0d4a26]" },
  completed: { title: "Visit completed", body: "Thank you for visiting us.", tone: "bg-[#e3ecf8] border-[#a9c3e6] text-[#12396b]" },
  cancelled: { title: "This appointment was cancelled", body: "Please book another time or call the clinic.", tone: "bg-[#fdecec] border-[#e0a3a3] text-[#7a1414]" },
  no_show: { title: "Marked as missed", body: "Please call the clinic to book another time.", tone: "bg-[#eceeed] border-[#c5cbc8] text-[#2f3b39]" },
};

const field = "mt-2 block w-full rounded-xl border-2 border-[#9fb2ab] bg-white px-4 py-3.5 text-lg text-[#12211f] outline-none focus:border-[#176b68]";

export function BookingStatus() {
  const once = useSingleFlight();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  function submit(formData: FormData) {
    return once(async () => {
      setBusy(true);
      setError("");
      setResult(null);
      try {
        const response = await fetch("/api/appointments/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: formData.get("reference"), phone: formData.get("phone") }),
        });
        const payload = (await response.json()) as Result & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Could not check your booking.");
        setResult(payload);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <form action={submit} aria-busy={busy} className="rounded-[24px] border-2 border-[#cfdad5] bg-white p-6 sm:p-9">
        <div className="grid gap-5">
          <label className="block text-base font-bold">Booking number
            <input name="reference" required minLength={4} maxLength={40} placeholder="e.g. CLN-1A2B3C4D" autoCapitalize="characters" className={field} />
          </label>
          <label className="block text-base font-bold">Mobile number used for the booking
            <input name="phone" required type="tel" inputMode="tel" minLength={7} maxLength={25} className={field} />
          </label>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border-2 border-[#e0a3a3] bg-[#fdecec] px-4 py-3 text-lg font-semibold text-[#7a1414]">{error}</p>}
        <button type="submit" disabled={busy} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#176b68] px-6 py-4 text-xl font-bold text-white hover:bg-[#115350] disabled:opacity-60">
          {busy ? <><LoaderCircle size={22} className="animate-spin" /> Checking…</> : <><Search size={22} /> Check status</>}
        </button>
      </form>

      {result && (
        <section aria-live="polite" className={`rounded-[24px] border-2 p-6 sm:p-8 ${copy[result.status].tone}`}>
          <p className="flex items-center gap-2 text-2xl font-bold"><CalendarCheck size={26} /> {copy[result.status].title}</p>
          <p className="mt-3 text-lg">{copy[result.status].body}</p>
          <p className="mt-4 flex items-center gap-2 text-lg font-semibold"><Clock3 size={20} /> {result.doctorName} · {formatDate(result.appointmentDate)} at {formatTime(result.startTime)}</p>
          <p className="mt-1 text-base">Booking number: {result.reference}</p>
        </section>
      )}
    </div>
  );
}
