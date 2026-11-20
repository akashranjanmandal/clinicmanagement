"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";

type Resource =
  | "departments"
  | "doctors"
  | "services"
  | "schedules"
  | "leaves"
  | "holidays"
  | "messages"
  | "settings"
  | "users";
type RecordRow = Record<string, unknown> & { id?: string };
type Options = { departments?: Array<{ id: string; name: string }>; doctors?: Array<{ id: string; name: string }> };
type ResourceData = { items?: RecordRow[]; settings?: RecordRow | null; options?: Options };
type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "time" | "date" | "email" | "url" | "password" | "checkbox";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  wide?: boolean;
};

const weekdays = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const definitions: Record<Resource, { title: string; description: string; fields: Field[]; statusKey?: string; canCreate?: boolean; singleton?: boolean; removable?: boolean }> = {
  departments: {
    title: "Departments",
    description: "Organize doctors and services by specialty.",
    fields: [
      { key: "name", label: "Department name", required: true },
      { key: "slug", label: "URL slug", required: true },
      { key: "description", label: "Description", type: "textarea", wide: true },
    ],
    statusKey: "isActive",
  },
  doctors: {
    title: "Doctors",
    description: "Manage doctor profiles and booking preferences.",
    fields: [
      { key: "name", label: "Full name", required: true },
      { key: "slug", label: "Profile URL slug", required: true },
      { key: "qualification", label: "Qualifications", required: true },
      { key: "specialization", label: "Specialization", required: true },
      { key: "departmentId", label: "Department", type: "select", required: true },
      { key: "experienceYears", label: "Years of experience", type: "number", min: 0, max: 80, required: true },
      { key: "consultationMinutes", label: "Consultation length (minutes)", type: "number", min: 5, max: 240, required: true },
      { key: "consultationFee", label: "Consultation fee", type: "number", min: 0 },
      { key: "displayOrder", label: "Display order", type: "number", min: 0 },
      { key: "imageUrl", label: "Photo URL (HTTPS)", type: "url", wide: true },
      { key: "biography", label: "Biography", type: "textarea", required: true, wide: true },
    ],
    statusKey: "isActive",
  },
  services: {
    title: "Services",
    description: "Publish and order the services shown to patients.",
    fields: [
      { key: "title", label: "Service title", required: true },
      { key: "slug", label: "URL slug", required: true },
      { key: "icon", label: "Lucide icon name", required: true },
      { key: "departmentId", label: "Department", type: "select" },
      { key: "displayOrder", label: "Display order", type: "number", min: 0 },
      { key: "shortDescription", label: "Short description", type: "textarea", required: true, wide: true },
      { key: "description", label: "Detailed description", type: "textarea", wide: true },
    ],
    statusKey: "isPublished",
  },
  schedules: {
    title: "Doctor schedules",
    description: "Add separate consultation sessions for each weekday. Use multiple entries to define breaks.",
    fields: [
      { key: "doctorId", label: "Doctor", type: "select", required: true },
      { key: "weekday", label: "Weekday", type: "select", options: weekdays, required: true },
      { key: "startTime", label: "Start time", type: "time", required: true },
      { key: "endTime", label: "End time", type: "time", required: true },
      { key: "slotMinutes", label: "Slot interval (minutes)", type: "number", min: 5, max: 240, required: true },
    ],
    removable: true,
  },
  leaves: {
    title: "Doctor leave",
    description: "Block an individual doctor for a date or leave period.",
    fields: [
      { key: "doctorId", label: "Doctor", type: "select", required: true },
      { key: "startDate", label: "First day", type: "date", required: true },
      { key: "endDate", label: "Last day", type: "date", required: true },
      { key: "reason", label: "Reason (optional)", type: "text", wide: true },
    ],
    removable: true,
  },
  holidays: {
    title: "Clinic holidays",
    description: "Close appointment availability across the clinic on selected dates.",
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "name", label: "Holiday name", required: true },
    ],
    removable: true,
  },
  messages: {
    title: "Contact messages",
    description: "Review patient enquiries and track follow-up status.",
    fields: [],
    canCreate: false,
  },
  settings: {
    title: "Clinic settings",
    description: "Set public clinic details, timezone, map, and booking confirmation behavior.",
    fields: [
      { key: "name", label: "Clinic name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp international number" },
      { key: "timezone", label: "IANA timezone", required: true },
      { key: "workingHours", label: "Opening hours", type: "textarea", wide: true },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "mapsEmbedUrl", label: "Google Maps embed URL", type: "url", wide: true },
      { key: "autoConfirmAppointments", label: "Auto-confirm new bookings", type: "checkbox", wide: true },
    ],
    canCreate: false,
    singleton: true,
  },
  users: {
    title: "Admin users",
    description: "Create staff accounts and manage access. Use a unique password of at least 12 characters.",
    fields: [
      { key: "name", label: "Name", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "password", label: "Initial password", type: "password", required: true },
      { key: "role", label: "Role", type: "select", options: [{ value: "staff", label: "Staff" }, { value: "super_admin", label: "Super-admin" }], required: true },
    ],
    statusKey: "isActive",
  },
};

function displayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

async function fetchResource(resource: Resource) {
  const response = await fetch(`/api/admin/resources/${resource}`, { cache: "no-store" });
  const payload = (await response.json()) as ResourceData & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Could not load this section.");
  return payload;
}

export function AdminResourceManager({ resource }: { resource: Resource }) {
  const definition = definitions[resource];
  const [data, setData] = useState<ResourceData>({});
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const items = data.items ?? (data.settings ? [data.settings] : []);
  const options = data.options ?? {};

  async function reload() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchResource(resource));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this section.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchResource(resource)
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this section.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resource]);

  const selectOptions = useMemo(() => ({
    departmentId: options.departments?.map((row) => ({ value: row.id, label: row.name })) ?? [],
    doctorId: options.doctors?.map((row) => ({ value: row.id, label: row.name })) ?? [],
  }), [options.departments, options.doctors]);

  async function save(formData: FormData) {
    setSaving(true);
    setError("");
    setSuccess("");
    const values: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const rawValue = formData.get(field.key);
      if (field.type === "checkbox") {
        values[field.key] = rawValue === "on";
      } else if (rawValue !== null) {
        const value = String(rawValue);
        const numeric = field.type === "number" || ["experienceYears", "consultationMinutes", "consultationFee", "displayOrder", "weekday", "slotMinutes"].includes(field.key);
        values[field.key] = numeric && value !== "" ? Number(value) : value;
      }
    }
    const endpoint = `/api/admin/resources/${resource}`;
    const method = editing && !definition.singleton ? "PATCH" : "POST";
    const body = method === "PATCH" ? { id: editing?.id, data: values } : values;
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not save this record.");
      setEditing(null);
      setFormOpen(false);
      setSuccess(editing ? "Changes saved." : "Added successfully.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this record.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: RecordRow) {
    if (!row.id || !definition.statusKey) return;
    const statusKey = definition.statusKey;
    const next = !Boolean(row[statusKey]);
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/resources/${resource}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, data: { [statusKey]: next } }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update status.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update status.");
    } finally {
      setSaving(false);
    }
  }

  async function updateMessageStatus(row: RecordRow, status: string) {
    if (!row.id) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/resources/${resource}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, data: { status } }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not update message.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update message.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: RecordRow) {
    if (!row.id || !window.confirm("Remove this record?")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/resources/${resource}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not remove this record.");
      setSuccess("Record removed.");
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove this record.");
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(() => {
    if (resource === "messages") return ["name", "contact", "subject", "message", "createdAt"];
    if (resource === "settings") return ["name", "timezone", "autoConfirmAppointments"];
    if (resource === "users") return ["name", "email", "role", "isActive"];
    if (resource === "doctors") return ["name", "specialization", "departmentName", "experienceYears", "isActive"];
    if (resource === "services") return ["title", "departmentName", "displayOrder", "isPublished"];
    if (resource === "schedules") return ["doctorName", "weekday", "startTime", "endTime", "slotMinutes"];
    if (resource === "leaves") return ["doctorName", "startDate", "endDate", "reason"];
    if (resource === "holidays") return ["date", "name"];
    return ["name", "slug", "description", "isActive"];
  }, [resource]);

  return (
    <div>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Clinic workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{definition.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#657573]">{definition.description}</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setFormOpen(true); setSuccess(""); }} disabled={!definition.fields.length || definition.canCreate === false && !definition.singleton} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#115350]">
          <Plus size={15} /> {definition.singleton ? "Edit settings" : "Add new"}
        </button>
      </header>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mt-5 rounded-xl bg-[#e5f4ef] px-4 py-3 text-sm text-[#176b68]">{success}</p>}

      {(formOpen || definition.singleton) && definition.fields.length > 0 && (
        <form key={editing?.id ?? String(data.settings?.id ?? "new")} action={save} className="mt-6 rounded-[22px] border border-[#e6ece8] bg-white p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-semibold">{definition.singleton ? "Clinic details" : editing ? "Edit record" : "Add a record"}</h2><p className="mt-1 text-xs text-[#82928d]">Changes are saved to the clinic database.</p></div>
            {editing && !definition.singleton && <button type="button" onClick={() => { setEditing(null); setFormOpen(false); }} className="text-xs font-semibold text-[#657573]">Cancel</button>}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {definition.fields.map((field) => {
              const value = editing?.[field.key] ?? data.settings?.[field.key] ?? "";
              const optionsForField = field.options ?? (field.key === "departmentId" ? selectOptions.departmentId : field.key === "doctorId" ? selectOptions.doctorId : []);
              const common = "mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-3.5 py-3 text-sm font-normal outline-none focus:border-[#176b68]";
              return (
                <label key={field.key} className={`text-xs font-bold text-[#425553] ${field.wide ? "sm:col-span-2" : ""}`}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea name={field.key} required={field.required} maxLength={4000} defaultValue={String(value)} rows={3} className={`${common} resize-y`} />
                  ) : field.type === "checkbox" ? (
                    <span className="mt-3 flex items-center gap-3 text-sm font-medium">
                      <input name={field.key} type="checkbox" defaultChecked={Boolean(value)} className="size-4 accent-[#176b68]" />
                      Enabled
                    </span>
                  ) : field.type === "select" ? (
                    <select name={field.key} required={field.required} defaultValue={String(field.key === "role" && !value ? "staff" : value)} className={common}>
                      {!field.required && <option value="">No department</option>}
                      {optionsForField.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      required={field.required}
                      type={field.type ?? "text"}
                      min={field.min}
                      max={field.max}
                      minLength={field.type === "password" ? 12 : undefined}
                      autoComplete={field.type === "password" ? "new-password" : undefined}
                      defaultValue={field.type === "password" ? "" : value === null ? "" : String(value)}
                      className={common}
                    />
                  )}
                </label>
              );
            })}
          </div>
          <button type="submit" disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#176b68] px-5 py-3 text-xs font-bold text-white disabled:opacity-60 hover:bg-[#115350]">
            {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
            {definition.singleton ? "Save settings" : editing ? "Save changes" : "Create"}
          </button>
        </form>
      )}

      <section className="mt-6 overflow-hidden rounded-[22px] border border-[#e6ece8] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6ece8] px-5 py-4">
          <h2 className="text-sm font-semibold">Current records</h2>
          <button type="button" onClick={() => void reload()} className="inline-flex items-center gap-2 text-xs font-semibold text-[#657573] hover:text-[#176b68]"><RotateCcw size={14} /> Refresh</button>
        </div>
        {loading ? (
          <p className="flex items-center justify-center gap-2 p-12 text-sm text-[#657573]"><LoaderCircle size={16} className="animate-spin" /> Loading clinic data…</p>
        ) : resource === "messages" ? (
          items.length ? (
            <div className="divide-y divide-[#edf1ee]">
              {items.map((row) => (
                <article key={String(row.id)} className="grid gap-3 px-5 py-5 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{displayValue(row.name)}</h3><span className="rounded-full bg-[#f0f5f1] px-2.5 py-1 text-[10px] font-bold capitalize">{displayValue(row.status)}</span><span className="text-[10px] text-[#82928d]">{displayValue(row.createdAt)}</span></div>
                    <p className="mt-1 text-xs text-[#657573]">{displayValue(row.contact)} · {displayValue(row.subject)}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#425553]">{displayValue(row.message)}</p>
                  </div>
                  <select value={String(row.status)} disabled={saving} onChange={(event) => void updateMessageStatus(row, event.target.value)} aria-label={`Update message from ${String(row.name)}`} className="h-fit rounded-lg border border-[#e6ece8] bg-white px-2.5 py-2 text-xs">
                    <option value="new">New</option><option value="read">Read</option><option value="resolved">Resolved</option>
                  </select>
                </article>
              ))}
            </div>
          ) : <p className="p-12 text-center text-sm text-[#82928d]">No contact messages yet.</p>
        ) : resource === "settings" ? (
          <p className="p-7 text-sm text-[#657573]">{data.settings ? "Settings saved in the form above." : "Save the form above to add clinic settings."}</p>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-[#fafbf9] text-[10px] uppercase tracking-[0.1em] text-[#82928d]">
                <tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-semibold first:pl-5">{column.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</th>)}<th className="px-4 py-3 font-semibold">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((row, index) => (
                  <tr key={String(row.id ?? index)} className="border-t border-[#edf1ee]">
                    {columns.map((column) => <td key={column} className={`max-w-[280px] px-4 py-4 text-[#657573] ${column === "message" || column === "biography" ? "truncate" : ""} first:pl-5`}>{column === "weekday" ? weekdays[Number(row[column])]?.label ?? displayValue(row[column]) : displayValue(row[column])}</td>)}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {definition.statusKey && <button type="button" disabled={saving} onClick={() => void toggleActive(row)} className="rounded-lg border border-[#e6ece8] px-2.5 py-2 font-semibold text-[#176b68] disabled:opacity-50">{Boolean(row[definition.statusKey]) ? "Archive" : "Restore"}</button>}
                        {resource !== "users" && <button type="button" onClick={() => { setEditing(row); setFormOpen(true); }} aria-label={`Edit ${String(row.name ?? row.title ?? row.date ?? "record")}`} className="grid size-8 place-items-center rounded-lg border border-[#e6ece8] text-[#657573] hover:text-[#176b68]"><Pencil size={14} /></button>}
                        {definition.removable && <button type="button" disabled={saving} onClick={() => void remove(row)} aria-label="Remove record" className="grid size-8 place-items-center rounded-lg border border-[#e6ece8] text-[#657573] hover:text-red-600"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-12 text-center text-sm text-[#82928d]">No records yet. Add one using the form above.</p>}
      </section>
    </div>
  );
}
