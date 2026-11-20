"use client";

import { useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

type Row = {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  appointmentDate: string;
  startTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  reason: string | null;
  adminNote: string | null;
  doctorName: string;
};

const statusLabels = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

export function AdminAppointments({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(initialRows.length);
  const [hasMore, setHasMore] = useState(initialRows.length === 50);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load(search = query, filter = status, nextOffset = 0) {
    setBusy("load");
    setError("");
    try {
      const params = new URLSearchParams({ q: search, status: filter, offset: String(nextOffset) });
      const response = await fetch(`/api/admin/appointments?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as { appointments?: Row[]; hasMore?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not load appointments.");
      const nextRows = payload.appointments ?? [];
      setRows(nextOffset ? [...rows, ...nextRows] : nextRows);
      setOffset(nextOffset + nextRows.length);
      setHasMore(payload.hasMore ?? false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load appointments.");
    } finally {
      setBusy("");
    }
  }

  async function updateStatus(id: string, nextStatus: Row["status"]) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { status?: Row["status"]; error?: string };
      if (!response.ok || !payload.status) throw new Error(payload.error ?? "Could not update status.");
      setRows((current) => current.map((row) => row.id === id ? { ...row, status: payload.status! } : row));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update appointment.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="eyebrow">Patient visits</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">Appointments</h1></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-xl border border-[#e6ece8] bg-white px-3 py-2.5">
            <Search size={15} className="text-[#82928d]" /><span className="sr-only">Search appointments</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void load(query, status)} placeholder="Name, phone, reference" className="w-full bg-transparent text-xs outline-none sm:w-44" />
          </label>
          <select value={status} onChange={(event) => { setStatus(event.target.value); void load(query, event.target.value); }} className="rounded-xl border border-[#e6ece8] bg-white px-3 py-2.5 text-xs outline-none">
            <option value="">All statuses</option>
            {statusLabels.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6 overflow-hidden rounded-[22px] border border-[#e6ece8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#fafbf9] text-[10px] uppercase tracking-[0.1em] text-[#82928d]">
              <tr><th className="px-5 py-4 font-semibold">Patient</th><th className="px-4 py-4 font-semibold">Doctor</th><th className="px-4 py-4 font-semibold">Date & time</th><th className="px-4 py-4 font-semibold">Status</th><th className="px-4 py-4 font-semibold">Update</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[#edf1ee] align-top">
                  <td className="px-5 py-4"><p className="font-semibold">{row.patientName}</p><p className="mt-1 text-[10px] text-[#82928d]">{row.patientPhone}</p><p className="mt-1 text-[10px] text-[#82928d]">{row.reference}</p></td>
                  <td className="px-4 py-4 text-[#657573]">{row.doctorName}</td>
                  <td className="px-4 py-4 text-[#657573]">{row.appointmentDate}<br />{row.startTime}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-[#f0f5f1] px-2.5 py-1 text-[10px] font-bold capitalize text-[#536b5f]">{row.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-4">
                    <select
                      value={row.status}
                      disabled={busy === row.id}
                      onChange={(event) => void updateStatus(row.id, event.target.value as Row["status"])}
                      aria-label={`Update status for ${row.reference}`}
                      className="rounded-lg border border-[#e6ece8] bg-white px-2 py-2 text-[10px] capitalize outline-none disabled:opacity-50"
                    >
                      {statusLabels.map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <div className="p-12 text-center text-sm text-[#82928d]">No appointments match your filters.</div>}
        {hasMore && (
          <div className="border-t border-[#edf1ee] p-4 text-center">
            <button type="button" disabled={busy === "load"} onClick={() => void load(query, status, offset)} className="inline-flex items-center gap-2 rounded-full border border-[#dfe8e2] px-5 py-2.5 text-xs font-bold text-[#176b68] disabled:opacity-60">
              {busy === "load" && <LoaderCircle size={14} className="animate-spin" />} Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
