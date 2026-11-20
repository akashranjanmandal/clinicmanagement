"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Clock3, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatDate, formatTime } from "@/lib/admin-format";

type Doctor = { id: string; name: string; consultationMinutes: number };
type Schedule = { id: string; doctorId: string; weekday: number; startTime: string; endTime: string };
type Leave = { id: string; doctorId: string; startDate: string; endDate: string; reason: string | null };
type Session = { start: string; end: string };

const days = [
  { n: 1, label: "Mon", full: "Monday" },
  { n: 2, label: "Tue", full: "Tuesday" },
  { n: 3, label: "Wed", full: "Wednesday" },
  { n: 4, label: "Thu", full: "Thursday" },
  { n: 5, label: "Fri", full: "Friday" },
  { n: 6, label: "Sat", full: "Saturday" },
  { n: 0, label: "Sun", full: "Sunday" },
];

async function api(method: string, resource: string, body?: unknown) {
  const response = await fetch(`/api/admin/resources/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  return { ok: response.ok, payload };
}

export function DoctorAvailability({ doctor }: { doctor: Doctor }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [picked, setPicked] = useState<number[]>([]);
  const [sessions, setSessions] = useState<Session[]>([{ start: "09:00", end: "13:00" }]);
  const [editId, setEditId] = useState("");
  const [edit, setEdit] = useState<Session>({ start: "", end: "" });
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const fetchAll = useCallback(async () => {
    const [s, l] = await Promise.all([api("GET", "schedules"), api("GET", "leaves")]);
    if (!s.ok) throw new Error(s.payload.error ?? "Could not load timings.");
    if (!l.ok) throw new Error(l.payload.error ?? "Could not load leave.");
    return {
      schedules: ((s.payload.items as Schedule[]) ?? []).filter((item) => item.doctorId === doctor.id),
      leaves: ((l.payload.items as Leave[]) ?? []).filter((item) => item.doctorId === doctor.id),
    };
  }, [doctor.id]);

  const load = useCallback(async () => {
    const data = await fetchAll();
    setSchedules(data.schedules);
    setLeaves(data.leaves);
  }, [fetchAll]);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((data) => {
        if (!active) return;
        setSchedules(data.schedules);
        setLeaves(data.leaves);
      })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Could not load."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [fetchAll]);

  async function run(action: () => Promise<string>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setNotice(await action());
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      await load().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  const toggleDay = (n: number) => setPicked((cur) => (cur.includes(n) ? cur.filter((d) => d !== n) : [...cur, n]));
  const updateSession = (index: number, patch: Partial<Session>) => setSessions((cur) => cur.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  function addTimings() {
    return run(async () => {
      if (!picked.length) throw new Error("Tick at least one day.");
      for (const s of sessions) {
        if (!s.start || !s.end) throw new Error("Fill in the start and end time for every session.");
        if (s.end <= s.start) throw new Error("Each session must end after it starts.");
      }
      let added = 0;
      for (const day of picked) {
        for (const s of sessions) {
          if (schedules.some((x) => x.weekday === day && x.startTime === s.start && x.endTime === s.end)) continue;
          const result = await api("POST", "schedules", {
            doctorId: doctor.id,
            weekday: day,
            startTime: s.start,
            endTime: s.end,
            slotMinutes: Math.max(5, doctor.consultationMinutes),
          });
          if (!result.ok) throw new Error(result.payload.error ?? "Could not save these timings.");
          added++;
        }
      }
      setPicked([]);
      return added ? `Added ${added} timing${added > 1 ? "s" : ""}.` : "Those timings were already added.";
    });
  }

  const byDay = days.map((day) => ({ ...day, items: schedules.filter((s) => s.weekday === day.n).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter((d) => d.items.length);
  const sortedLeaves = [...leaves].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="mt-4 grid gap-6 rounded-2xl border-2 border-[#cfdad5] bg-[#f6faf8] p-4 sm:p-6">
      <div aria-live="polite" className="grid gap-2">
        {error && <p role="alert" className="adm-alert adm-alert-error">{error}</p>}
        {notice && <p className="adm-alert adm-alert-ok">{notice}</p>}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-lg"><LoaderCircle className="animate-spin" /> Loading…</p>
      ) : (
        <>
          <section aria-labelledby={`t-${doctor.id}`}>
            <h3 id={`t-${doctor.id}`} className="flex items-center gap-2 text-xl font-bold"><Clock3 size={22} /> Days and times {doctor.name} sees patients</h3>
            {byDay.length ? (
              <ul className="mt-3 grid gap-2">
                {byDay.map((day) => (
                  <li key={day.n} className="rounded-xl bg-white p-3 sm:flex sm:items-start sm:gap-4">
                    <p className="w-28 shrink-0 text-lg font-bold">{day.full}</p>
                    <div className="grid flex-1 gap-2">
                      {day.items.map((s) =>
                        editId === s.id ? (
                          <div key={s.id} className="flex flex-wrap items-end gap-2">
                            <label className="adm-label">From<input type="time" value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} className="adm-input" /></label>
                            <label className="adm-label">To<input type="time" value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} className="adm-input" /></label>
                            <button type="button" disabled={busy} className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => void run(async () => {
                              if (!edit.start || !edit.end || edit.end <= edit.start) throw new Error("The end time must be after the start time.");
                              const result = await api("PATCH", "schedules", { id: s.id, data: { startTime: edit.start, endTime: edit.end } });
                              if (!result.ok) throw new Error(result.payload.error ?? "Could not save.");
                              setEditId("");
                              return "Timing updated.";
                            })}>Save</button>
                            <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setEditId("")}>Cancel</button>
                          </div>
                        ) : (
                          <div key={s.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-lg">{formatTime(s.startTime)} – {formatTime(s.endTime)}</span>
                            <button type="button" aria-label={`Edit ${day.full} ${formatTime(s.startTime)}`} className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => { setEditId(s.id); setEdit({ start: s.startTime, end: s.endTime }); }}><Pencil size={16} /> Edit</button>
                            <button type="button" disabled={busy} aria-label={`Remove ${day.full} ${formatTime(s.startTime)}`} className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => { if (window.confirm(`Remove ${day.full} ${formatTime(s.startTime)} – ${formatTime(s.endTime)}?`)) void run(async () => { const r = await api("DELETE", "schedules", { id: s.id }); if (!r.ok) throw new Error(r.payload.error ?? "Could not remove."); return "Timing removed."; }); }}><Trash2 size={16} /> Remove</button>
                          </div>
                        ),
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-white p-4 text-lg text-[#3f524f]">No timings yet — patients cannot book this doctor until you add some below.</p>
            )}

            <div className="mt-4 rounded-xl border-2 border-dashed border-[#9fb2ab] bg-white p-4">
              <p className="text-lg font-bold">Add days and times</p>
              <p className="adm-help">Tick the days, then set one or more sessions (for example morning and evening). The same times are added to every ticked day.</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Days">
                {days.map((day) => (
                  <label key={day.n} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-[#9fb2ab] bg-white px-4 py-2 text-base font-semibold has-[:checked]:border-[#0f5f5c] has-[:checked]:bg-[#e5f4ef]">
                    <input type="checkbox" checked={picked.includes(day.n)} onChange={() => toggleDay(day.n)} className="size-5 accent-[#0f5f5c]" /> {day.label}
                  </label>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setPicked([1, 2, 3, 4, 5])}>Mon – Fri</button>
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setPicked([1, 2, 3, 4, 5, 6])}>Mon – Sat</button>
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setPicked([1, 2, 3, 4, 5, 6, 0])}>Every day</button>
                <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setPicked([])}>Clear</button>
              </div>

              <div className="mt-4 grid gap-3">
                {sessions.map((s, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-3">
                    <label className="adm-label">{sessions.length > 1 ? `Session ${index + 1} starts` : "Starts at"}<input type="time" value={s.start} onChange={(e) => updateSession(index, { start: e.target.value })} className="adm-input" /></label>
                    <label className="adm-label">Ends at<input type="time" value={s.end} onChange={(e) => updateSession(index, { end: e.target.value })} className="adm-input" /></label>
                    {sessions.length > 1 && <button type="button" aria-label={`Remove session ${index + 1}`} className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => setSessions((cur) => cur.filter((_, i) => i !== index))}><X size={16} /> Remove</button>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setSessions((cur) => [...cur, { start: "16:00", end: "19:00" }])}><Plus size={18} /> Add another time (e.g. evening)</button>
                <button type="button" disabled={busy} className="adm-btn adm-btn-primary" onClick={() => void addTimings()}>{busy && <LoaderCircle size={18} className="animate-spin" />} Save timings</button>
              </div>
              <p className="adm-help">Each appointment is {doctor.consultationMinutes} minutes (change this with “Edit” on the doctor).</p>
            </div>
          </section>

          <section aria-labelledby={`l-${doctor.id}`}>
            <h3 id={`l-${doctor.id}`} className="flex items-center gap-2 text-xl font-bold"><CalendarOff size={22} /> Leave — days {doctor.name} is away</h3>
            {sortedLeaves.length ? (
              <ul className="mt-3 grid gap-2">
                {sortedLeaves.map((leave) => (
                  <li key={leave.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3">
                    <span className="text-lg font-semibold">{leave.startDate === leave.endDate ? formatDate(leave.startDate) : `${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}</span>
                    {leave.reason && <span className="text-base text-[#3f524f]">({leave.reason})</span>}
                    <button type="button" disabled={busy} className="adm-btn adm-btn-danger adm-btn-sm sm:ml-auto" onClick={() => { if (window.confirm("Remove this leave? Patients will be able to book these days again.")) void run(async () => { const r = await api("DELETE", "leaves", { id: leave.id }); if (!r.ok) throw new Error(r.payload.error ?? "Could not remove."); return "Leave removed."; }); }}><Trash2 size={16} /> Remove</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl bg-white p-4 text-lg text-[#3f524f]">No leave marked.</p>
            )}
            <form className="mt-4 rounded-xl border-2 border-dashed border-[#9fb2ab] bg-white p-4" onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!leaveFrom) throw new Error("Choose the first day of leave.");
                const last = leaveTo || leaveFrom;
                if (last < leaveFrom) throw new Error("The last day must be on or after the first day.");
                const result = await api("POST", "leaves", { doctorId: doctor.id, startDate: leaveFrom, endDate: last, reason: leaveReason });
                if (!result.ok) throw new Error(result.payload.error ?? "Could not save the leave.");
                setLeaveFrom(""); setLeaveTo(""); setLeaveReason("");
                return "Marked as on leave. Patients cannot book these days.";
              });
            }}>
              <p className="text-lg font-bold">Mark doctor on leave</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="adm-label">First day<input type="date" value={leaveFrom} onChange={(e) => setLeaveFrom(e.target.value)} className="adm-input" /></label>
                <label className="adm-label">Last day <span className="font-normal">(optional)</span><input type="date" min={leaveFrom} value={leaveTo} onChange={(e) => setLeaveTo(e.target.value)} className="adm-input" /></label>
                <label className="adm-label min-w-52 flex-1">Reason <span className="font-normal">(optional)</span><input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} maxLength={300} className="adm-input" /></label>
              </div>
              <p className="adm-help">For a single day, leave “Last day” empty.</p>
              <button type="submit" disabled={busy} className="adm-btn adm-btn-primary mt-3">{busy && <LoaderCircle size={18} className="animate-spin" />} Mark on leave</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
