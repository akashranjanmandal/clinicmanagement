"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, CheckCheck, LoaderCircle, MessageCircle, MessageSquareText, Phone, RefreshCw, Search, Undo2, UserX, X } from "lucide-react";
import Link from "next/link";
import { useSingleFlight } from "@/lib/use-single-flight";
import { type AppointmentStatus, formatDate, formatTime, friendlyDate, statusMeta } from "@/lib/admin-format";

type Row = {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  appointmentDate: string;
  startTime: string;
  status: AppointmentStatus;
  reason: string | null;
  adminNote: string | null;
  doctorName: string;
};

type Tab = "today" | "pending" | "upcoming" | "past" | "all";

const tabs: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "today", label: "Today", hint: "Patients coming in today" },
  { id: "pending", label: "Needs confirmation", hint: "New requests waiting for you to confirm" },
  { id: "upcoming", label: "Coming up", hint: "Appointments after today" },
  { id: "past", label: "Earlier", hint: "Appointments before today" },
  { id: "all", label: "Everything", hint: "All appointments, newest first" },
];


function whatsappLink(row: Row, clinicName: string, countryCode: string) {
  let number = row.patientPhone.replace(/\D/g, "").replace(/^0+/, "");
  if (number.length === 10 && countryCode) number = countryCode + number;
  const when = `${formatDate(row.appointmentDate)} at ${formatTime(row.startTime)}`;
  const lines: Record<AppointmentStatus, string> = {
    pending: `Hello ${row.patientName}, we received your appointment request with ${row.doctorName} on ${when}. We will confirm it shortly. Booking no. ${row.reference}. - ${clinicName}`,
    confirmed: `Hello ${row.patientName}, your appointment with ${row.doctorName} on ${when} is CONFIRMED. Please arrive 10 minutes early. Booking no. ${row.reference}. - ${clinicName}`,
    cancelled: `Hello ${row.patientName}, we are sorry - your appointment with ${row.doctorName} on ${when} has been cancelled. Please book another time or call us. Booking no. ${row.reference}. - ${clinicName}`,
    completed: `Hello ${row.patientName}, thank you for visiting ${clinicName}. Booking no. ${row.reference}.`,
    no_show: `Hello ${row.patientName}, we missed you for your appointment with ${row.doctorName} on ${when}. Please call us to book another time. - ${clinicName}`,
  };
  return `https://wa.me/${number}?text=${encodeURIComponent(lines[row.status])}`;
}

function tabParams(tab: Tab): Record<string, string> {
  if (tab === "today" || tab === "upcoming" || tab === "past") return { when: tab };
  if (tab === "pending") return { status: "pending" };
  return {};
}

export function AdminAppointments({ initialTab, pending = 0 }: { initialTab: Tab; pending?: number }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState<Row[]>([]);
  const [today, setToday] = useState("");
  const [clinicName, setClinicName] = useState("the clinic");
  const [countryCode, setCountryCode] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const requestId = useRef(0);
  const once = useSingleFlight();

  const load = useCallback(async (nextTab: Tab, search: string, nextOffset = 0) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: search, offset: String(nextOffset), ...tabParams(nextTab) });
      const response = await fetch(`/api/admin/appointments?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as { appointments?: Row[]; hasMore?: boolean; today?: string; clinicName?: string; countryCode?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load appointments.");
      if (id !== requestId.current) return;
      const next = payload.appointments ?? [];
      setRows((current) => (nextOffset ? [...current, ...next] : next));
      setOffset(nextOffset + next.length);
      setHasMore(payload.hasMore ?? false);
      setToday(payload.today ?? "");
      setClinicName(payload.clinicName ?? "the clinic");
      setCountryCode(payload.countryCode ?? "");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Could not load appointments.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch; deferred so state updates happen outside the effect body.
    const timer = setTimeout(() => void load(initialTab, ""), 0);
    return () => clearTimeout(timer);
  }, [initialTab, load]);

  function chooseTab(next: Tab) {
    setTab(next);
    setNotice("");
    void load(next, query);
  }

  function patch(row: Row, body: { status?: AppointmentStatus; adminNote?: string | null }, done: string) {
    return once(() => patchRow(row, body, done));
  }

  async function patchRow(row: Row, body: { status?: AppointmentStatus; adminNote?: string | null }, done: string) {
    setBusy(row.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/appointments/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { status?: AppointmentStatus; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update this appointment.");
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, ...(body.status ? { status: body.status } : {}), ...(body.adminNote !== undefined ? { adminNote: body.adminNote } : {}) } : item)),
      );
      setNotice(`${done} — ${row.patientName}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this appointment.");
    } finally {
      setBusy("");
    }
  }

  function setStatus(row: Row, status: AppointmentStatus, done: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    void patch(row, { status }, done);
  }

  const current = tabs.find((item) => item.id === tab)!;

  return (
    <div>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="adm-h1">Appointments</h1>
          <p className="adm-sub">{current.hint}.</p>
        </div>
        <Link href="/appointments/book" className="adm-btn adm-btn-primary shrink-0"><CalendarPlus size={20} /> Book for a patient</Link>
      </header>

      <div role="tablist" aria-label="Appointment groups" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button key={item.id} role="tab" type="button" aria-selected={tab === item.id} onClick={() => chooseTab(item.id)} className={`adm-btn ${tab === item.id ? "adm-btn-primary" : "adm-btn-outline"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); void load(tab, query); }}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        role="search"
      >
        <label className="flex-1">
          <span className="sr-only">Search by patient name or phone</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by patient name or phone number" className="adm-input !mt-0" />
        </label>
        <button type="submit" className="adm-btn adm-btn-primary"><Search size={20} /> Search</button>
        <button type="button" onClick={() => { setQuery(""); void load(tab, ""); }} className="adm-btn adm-btn-outline"><RefreshCw size={20} /> Refresh</button>
      </form>

      <div aria-live="polite" className="mt-4 grid gap-3">
        {error && <p role="alert" className="adm-alert adm-alert-error">{error}</p>}
        {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}
      </div>

      <div className="mt-5 grid gap-4">
        {loading && !rows.length ? (
          <p className="adm-card flex items-center justify-center gap-3 p-12 text-lg"><LoaderCircle className="animate-spin" /> Loading appointments…</p>
        ) : rows.length === 0 ? (
          <div className="adm-card p-12 text-center">
            <p className="text-xl font-bold">Nothing here</p>
            <p className="mt-2 text-lg text-[#3f524f]">{query ? "No appointment matches your search." : tab === "pending" ? "Great — no requests are waiting for confirmation." : "There are no appointments in this list."}</p>
            {!query && tab !== "pending" && pending > 0 && (
              <button type="button" onClick={() => chooseTab("pending")} className="adm-btn adm-btn-primary mt-5">{pending} {pending === 1 ? "request is" : "requests are"} waiting for confirmation — view</button>
            )}
          </div>
        ) : (
          rows.map((row) => {
            const meta = statusMeta[row.status];
            const working = busy === row.id;
            return (
              <article key={row.id} className="adm-card p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-5">
                    <div className="w-32 shrink-0 rounded-xl bg-[#e5f4ef] p-3 text-center">
                      <p className="text-xl font-bold text-[#0a4744]">{formatTime(row.startTime)}</p>
                      <p className="mt-1 text-base font-semibold text-[#2d4a47]">{friendlyDate(row.appointmentDate, today)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold">{row.patientName}</p>
                      <a href={`tel:${row.patientPhone}`} className="mt-1 inline-flex items-center gap-2 text-lg font-semibold text-[#0f5f5c] underline"><Phone size={18} /> {row.patientPhone}</a>
                      <p className="mt-1 text-lg">With <strong>{row.doctorName}</strong></p>
                      {row.reason && <p className="mt-1 text-base text-[#3f524f]">Reason: {row.reason}</p>}
                      {row.adminNote && <p className="mt-2 rounded-lg bg-[#fff4d1] px-3 py-2 text-base text-[#5c3d00]"><strong>Note:</strong> {row.adminNote}</p>}
                      <p className="mt-2 text-sm text-[#3f524f]">Booking no. {row.reference}</p>
                    </div>
                  </div>
                  <span className={`badge ${meta.className} self-start`}>{meta.label}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-[#e3ebe7] pt-4">
                  {row.status === "pending" && (
                    <>
                      <button type="button" disabled={working} onClick={() => setStatus(row, "confirmed", "Appointment confirmed")} className="adm-btn adm-btn-primary"><Check size={20} /> Confirm</button>
                      <button type="button" disabled={working} onClick={() => setStatus(row, "cancelled", "Appointment cancelled", `Cancel the appointment for ${row.patientName}?`)} className="adm-btn adm-btn-danger"><X size={20} /> Cancel appointment</button>
                    </>
                  )}
                  {row.status === "confirmed" && (
                    <>
                      <button type="button" disabled={working} onClick={() => setStatus(row, "completed", "Marked as visit done")} className="adm-btn adm-btn-primary"><CheckCheck size={20} /> Visit done</button>
                      <button type="button" disabled={working} onClick={() => setStatus(row, "no_show", "Marked as did not come", `Mark ${row.patientName} as did not come?`)} className="adm-btn adm-btn-outline"><UserX size={20} /> Did not come</button>
                      <button type="button" disabled={working} onClick={() => setStatus(row, "cancelled", "Appointment cancelled", `Cancel the appointment for ${row.patientName}?`)} className="adm-btn adm-btn-danger"><X size={20} /> Cancel appointment</button>
                    </>
                  )}
                  {(row.status === "completed" || row.status === "cancelled" || row.status === "no_show") && (
                    <button type="button" disabled={working} onClick={() => setStatus(row, "confirmed", "Appointment reopened as confirmed", `Reopen this appointment for ${row.patientName}?`)} className="adm-btn adm-btn-outline"><Undo2 size={20} /> Reopen</button>
                  )}
                  {(row.status === "pending" || row.status === "confirmed" || row.status === "cancelled") && (
                    <a href={whatsappLink(row, clinicName, countryCode)} target="_blank" rel="noreferrer" className={`adm-btn ${row.status === "confirmed" ? "!border-[#1a8f4c] !bg-[#1a8f4c] !text-white" : "adm-btn-outline"}`}>
                      <MessageCircle size={20} /> {row.status === "confirmed" ? "Send confirmation on WhatsApp" : row.status === "cancelled" ? "Tell patient on WhatsApp" : "Message on WhatsApp"}
                    </a>
                  )}
                  <button type="button" onClick={() => setNoteOpen(noteOpen === row.id ? null : row.id)} className="adm-btn adm-btn-outline"><MessageSquareText size={20} /> {row.adminNote ? "Edit note" : "Add note"}</button>
                  {working && <LoaderCircle className="animate-spin self-center" aria-label="Saving" />}
                </div>

                {noteOpen === row.id && (
                  <form
                    className="mt-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const note = String(new FormData(event.currentTarget).get("note") ?? "").trim();
                      void patch(row, { adminNote: note || null }, "Note saved").then(() => setNoteOpen(null));
                    }}
                  >
                    <label className="adm-label">Internal note (patients cannot see this)
                      <textarea name="note" defaultValue={row.adminNote ?? ""} maxLength={1000} className="adm-input" />
                    </label>
                    <button type="submit" disabled={working} className="adm-btn adm-btn-primary mt-3">Save note</button>
                  </form>
                )}
              </article>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button type="button" disabled={loading} onClick={() => void load(tab, query, offset)} className="adm-btn adm-btn-outline">
            {loading && <LoaderCircle size={18} className="animate-spin" />} Show more
          </button>
        </div>
      )}
    </div>
  );
}
