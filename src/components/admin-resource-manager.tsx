"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatDate, formatDateTime, formatTime, slugify } from "@/lib/admin-format";

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
type FieldType = "text" | "number" | "textarea" | "select" | "time" | "date" | "email" | "url" | "password" | "checkbox" | "weekdays";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  wide?: boolean;
  help?: string;
  advanced?: boolean;
  placeholder?: string;
  emptyLabel?: string;
};
type Definition = {
  title: string;
  description: string;
  addLabel: string;
  itemName: string;
  empty: string;
  fields: Field[];
  slugFrom?: string;
  statusKey?: string;
  statusOn?: string;
  statusOff?: string;
  singleton?: boolean;
  removable?: boolean;
  noEdit?: boolean;
  cardTitle: (row: RecordRow) => string;
  details: Array<{ label: string; value: (row: RecordRow) => string }>;
};

const text = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));

const weekdays = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];
const dayName = (value: unknown) => weekdays.find((day) => day.value === String(value))?.label ?? text(value);

const timezones = [
  { value: "Asia/Kolkata", label: "India (Asia/Kolkata)" },
  { value: "Asia/Dubai", label: "Dubai (Asia/Dubai)" },
  { value: "Asia/Singapore", label: "Singapore (Asia/Singapore)" },
  { value: "Europe/London", label: "United Kingdom (Europe/London)" },
  { value: "America/New_York", label: "US Eastern (America/New_York)" },
  { value: "America/Los_Angeles", label: "US Pacific (America/Los_Angeles)" },
  { value: "Australia/Sydney", label: "Sydney (Australia/Sydney)" },
  { value: "UTC", label: "UTC" },
];

const definitions: Record<Resource, Definition> = {
  doctors: {
    title: "Doctors",
    description: "The doctors patients can book. Hidden doctors stop appearing on the website and in booking.",
    addLabel: "Add a doctor",
    itemName: "doctor",
    empty: "No doctors yet. Click “Add a doctor” to start. (Add a department first if you have not yet.)",
    slugFrom: "name",
    statusKey: "isActive",
    statusOn: "Taking appointments",
    statusOff: "Hidden",
    fields: [
      { key: "name", label: "Doctor's full name", required: true, placeholder: "Dr. Anita Sharma" },
      { key: "qualification", label: "Qualifications", required: true, placeholder: "MBBS, MD", help: "Degrees, as you want patients to see them." },
      { key: "specialization", label: "Speciality", required: true, placeholder: "Cardiology" },
      { key: "departmentId", label: "Department", type: "select", required: true, help: "Add departments under Clinic setup → Departments." },
      { key: "experienceYears", label: "Years of experience", type: "number", min: 0, max: 80, required: true },
      { key: "consultationMinutes", label: "Minutes per appointment", type: "number", min: 5, max: 240, required: true, help: "How long each patient visit lasts." },
      { key: "consultationFee", label: "Consultation fee", type: "number", min: 0, help: "Leave empty if you do not want to show a fee." },
      { key: "biography", label: "About the doctor", type: "textarea", required: true, wide: true, help: "A few sentences patients will read on the doctor's page." },
      { key: "imageUrl", label: "Photo web address", type: "url", wide: true, advanced: true, help: "Link starting with https:// to the doctor's photo." },
      { key: "displayOrder", label: "Position in the list", type: "number", min: 0, advanced: true, help: "Smaller numbers appear first." },
    ],
    cardTitle: (row) => text(row.name),
    details: [
      { label: "Speciality", value: (row) => text(row.specialization) },
      { label: "Department", value: (row) => text(row.departmentName) },
      { label: "Qualifications", value: (row) => text(row.qualification) },
      { label: "Per appointment", value: (row) => `${text(row.consultationMinutes)} minutes` },
      { label: "Fee", value: (row) => (row.consultationFee ? `₹${row.consultationFee}` : "Not shown") },
    ],
  },
  schedules: {
    title: "Doctor timings",
    description: "The days and hours each doctor sees patients. For a lunch break, add two sessions (for example 9–1 and 2–5).",
    addLabel: "Add timings",
    itemName: "timing",
    empty: "No timings yet. Patients cannot book a doctor until you add timings.",
    removable: true,
    fields: [
      { key: "doctorId", label: "Doctor", type: "select", required: true },
      { key: "weekday", label: "Days", type: "weekdays", required: true, wide: true, help: "Tick every day this doctor sits at these hours." },
      { key: "startTime", label: "Starts at", type: "time", required: true },
      { key: "endTime", label: "Ends at", type: "time", required: true },
      { key: "slotMinutes", label: "Minutes per appointment", type: "number", min: 5, max: 240, required: true, help: "Example: 30 means slots at 9:00, 9:30, 10:00…" },
    ],
    cardTitle: (row) => `${text(row.doctorName)} — ${dayName(row.weekday)}`,
    details: [
      { label: "Hours", value: (row) => `${formatTime(row.startTime)} to ${formatTime(row.endTime)}` },
      { label: "Each appointment", value: (row) => `${text(row.slotMinutes)} minutes` },
    ],
  },
  leaves: {
    title: "Doctor leave",
    description: "Block a doctor on days they are away. Patients will not be offered those days.",
    addLabel: "Add leave",
    itemName: "leave",
    empty: "No leave added. Every doctor is available on their normal timings.",
    removable: true,
    fields: [
      { key: "doctorId", label: "Doctor", type: "select", required: true },
      { key: "startDate", label: "First day away", type: "date", required: true },
      { key: "endDate", label: "Last day away", type: "date", required: true, help: "For one day, pick the same date as the first day." },
      { key: "reason", label: "Reason", wide: true, help: "Only staff can see this." },
    ],
    cardTitle: (row) => text(row.doctorName),
    details: [
      { label: "From", value: (row) => formatDate(row.startDate) },
      { label: "Until", value: (row) => formatDate(row.endDate) },
      { label: "Reason", value: (row) => text(row.reason) },
    ],
  },
  holidays: {
    title: "Clinic holidays",
    description: "Days the whole clinic is closed. Patients cannot book any doctor on these dates.",
    addLabel: "Add a holiday",
    itemName: "holiday",
    empty: "No holidays added.",
    removable: true,
    fields: [
      { key: "date", label: "Date", type: "date", required: true },
      { key: "name", label: "Holiday name", required: true, placeholder: "Diwali" },
    ],
    cardTitle: (row) => text(row.name),
    details: [{ label: "Date", value: (row) => formatDate(row.date) }],
  },
  departments: {
    title: "Departments",
    description: "Groups such as “Heart” or “Children's health”. Each doctor belongs to one department.",
    addLabel: "Add a department",
    itemName: "department",
    empty: "No departments yet. Add one before adding doctors.",
    slugFrom: "name",
    statusKey: "isActive",
    statusOn: "Active",
    statusOff: "Hidden",
    fields: [
      { key: "name", label: "Department name", required: true, placeholder: "Children's Health" },
      { key: "description", label: "Short description", type: "textarea", wide: true },
    ],
    cardTitle: (row) => text(row.name),
    details: [{ label: "About", value: (row) => text(row.description) }],
  },
  services: {
    title: "Services",
    description: "Treatments and services shown to patients on the website.",
    addLabel: "Add a service",
    itemName: "service",
    empty: "No services yet.",
    slugFrom: "title",
    statusKey: "isPublished",
    statusOn: "Shown on website",
    statusOff: "Hidden",
    fields: [
      { key: "title", label: "Service name", required: true, placeholder: "Heart screening" },
      { key: "shortDescription", label: "One-line description", type: "textarea", required: true, wide: true, help: "Shown on the services page." },
      { key: "icon", label: "Picture", type: "select", required: true, options: [
        { value: "stethoscope", label: "Stethoscope" },
        { value: "heart", label: "Heart" },
        { value: "activity", label: "Heartbeat line" },
        { value: "baby", label: "Baby" },
        { value: "scan", label: "Scan" },
      ] },
      { key: "departmentId", label: "Department", type: "select", emptyLabel: "No department" },
      { key: "description", label: "Full details", type: "textarea", wide: true, advanced: true },
      { key: "displayOrder", label: "Position in the list", type: "number", min: 0, advanced: true, help: "Smaller numbers appear first." },
    ],
    cardTitle: (row) => text(row.title),
    details: [
      { label: "Department", value: (row) => text(row.departmentName) },
      { label: "Description", value: (row) => text(row.shortDescription) },
    ],
  },
  messages: {
    title: "Patient messages",
    description: "Questions sent from the website's contact form. Call or reply, then mark the message as done.",
    addLabel: "",
    itemName: "message",
    empty: "No messages yet.",
    fields: [],
    cardTitle: (row) => text(row.name),
    details: [],
  },
  settings: {
    title: "Clinic details",
    description: "Name, phone, address and opening hours shown to patients.",
    addLabel: "",
    itemName: "settings",
    empty: "",
    singleton: true,
    fields: [
      { key: "name", label: "Clinic name", required: true },
      { key: "phone", label: "Phone number" },
      { key: "whatsapp", label: "WhatsApp number", placeholder: "919876543210", help: "Digits only, with country code (no + or spaces)." },
      { key: "email", label: "Email address", type: "email" },
      { key: "workingHours", label: "Opening hours", type: "textarea", wide: true, placeholder: "Mon–Sat 9:00 AM – 7:00 PM" },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "timezone", label: "Time zone", type: "select", required: true, options: timezones, help: "Used to work out “today” and appointment times." },
      { key: "autoConfirmAppointments", label: "Confirm new bookings automatically", type: "checkbox", wide: true, help: "If ticked, patients are confirmed instantly. If not, you confirm each request from Appointments." },
      { key: "mapsEmbedUrl", label: "Google Maps embed link", type: "url", wide: true, advanced: true, help: "Optional. Paste the embed link from Google Maps → Share → Embed a map." },
    ],
    cardTitle: (row) => text(row.name),
    details: [],
  },
  users: {
    title: "Staff logins",
    description: "People who can sign in to this admin area. Administrators can change everything; front desk staff can manage appointments.",
    addLabel: "Add a staff login",
    itemName: "login",
    empty: "No logins.",
    statusKey: "isActive",
    statusOn: "Can sign in",
    statusOff: "Sign-in blocked",
    noEdit: true,
    fields: [
      { key: "name", label: "Full name", required: true },
      { key: "email", label: "Email (used to sign in)", type: "email", required: true },
      { key: "password", label: "Password", type: "password", required: true, help: "At least 12 characters. Share it with the person privately." },
      { key: "role", label: "Access level", type: "select", required: true, options: [
        { value: "staff", label: "Front desk staff" },
        { value: "super_admin", label: "Administrator (full access)" },
      ] },
    ],
    cardTitle: (row) => text(row.name),
    details: [
      { label: "Email", value: (row) => text(row.email) },
      { label: "Access", value: (row) => (row.role === "super_admin" ? "Administrator" : "Front desk staff") },
    ],
  },
};

async function fetchResource(resource: Resource) {
  const response = await fetch(`/api/admin/resources/${resource}`, { cache: "no-store" });
  const payload = (await response.json()) as ResourceData & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Could not load this page. Please refresh.");
  return payload;
}

function PasswordInput({ name, required }: { name: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input name={name} required={required} type={show ? "text" : "password"} minLength={12} autoComplete="new-password" className="adm-input pr-28" />
      <button type="button" onClick={() => setShow((v) => !v)} className="adm-btn adm-btn-outline adm-btn-sm absolute right-1 top-[0.55rem] !min-h-[2.4rem]" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />} {show ? "Hide" : "Show"}
      </button>
    </span>
  );
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
  const formRef = useRef<HTMLFormElement>(null);
  const items = data.items ?? [];
  const options = data.options ?? {};

  async function reload() {
    try {
      setData(await fetchResource(resource));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this page. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchResource(resource)
      .then((payload) => active && setData(payload))
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Could not load this page. Please refresh."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [resource]);

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formOpen, editing]);

  const selectOptions = useMemo(
    () => ({
      departmentId: options.departments?.map((row) => ({ value: row.id, label: row.name })) ?? [],
      doctorId: options.doctors?.map((row) => ({ value: row.id, label: row.name })) ?? [],
    }),
    [options.departments, options.doctors],
  );

  async function send(method: string, body: unknown) {
    const response = await fetch(`/api/admin/resources/${resource}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    return { ok: response.ok, status: response.status, error: payload.error };
  }

  async function save(formData: FormData) {
    setSaving(true);
    setError("");
    setSuccess("");
    const values: Record<string, unknown> = {};
    const days: string[] = [];
    for (const field of definition.fields) {
      if (field.type === "weekdays") {
        days.push(...formData.getAll(field.key).map(String));
        continue;
      }
      const raw = formData.get(field.key);
      if (field.type === "checkbox") {
        values[field.key] = raw === "on";
      } else if (raw !== null) {
        const value = String(raw).trim();
        values[field.key] = field.type === "number" && value !== "" ? Number(value) : value;
      }
    }
    try {
      if (resource === "schedules" && !days.length) throw new Error("Tick at least one day.");
      const singleEdit = Boolean(editing && !definition.singleton);
      if (singleEdit) {
        if (resource === "schedules") values.weekday = Number(days[0] ?? editing?.weekday);
        const result = await send("PATCH", { id: editing?.id, data: values });
        if (!result.ok) throw new Error(result.error ?? "Could not save your changes.");
        setSuccess("Your changes are saved.");
      } else if (definition.singleton) {
        const result = await send("POST", values);
        if (!result.ok) throw new Error(result.error ?? "Could not save your changes.");
        setSuccess("Clinic details saved.");
      } else if (resource === "schedules") {
        for (const day of days) {
          const result = await send("POST", { ...values, weekday: Number(day) });
          if (!result.ok) throw new Error(result.error ?? "Could not save these timings. Check the hours — they must end after they start.");
        }
        setSuccess(`Timings added for ${days.length} day${days.length > 1 ? "s" : ""}.`);
      } else {
        const base = definition.slugFrom ? slugify(String(values[definition.slugFrom] ?? "")) : "";
        if (definition.slugFrom && !base) throw new Error("Please enter a name using letters or numbers.");
        let result = { ok: false, status: 0, error: undefined as string | undefined };
        for (let attempt = 0; attempt < 4; attempt++) {
          const payload = definition.slugFrom ? { ...values, slug: attempt ? `${base}-${attempt + 1}` : base } : values;
          result = await send("POST", payload);
          if (result.ok || result.status !== 409 || !definition.slugFrom) break;
        }
        if (!result.ok) throw new Error(result.status === 409 ? "That already exists. Please use a different name." : (result.error ?? "Could not save. Please check the details."));
        setSuccess(`The ${definition.itemName} was added.`);
      }
      setEditing(null);
      setFormOpen(false);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function patchRow(row: RecordRow, changes: Record<string, unknown>, done: string) {
    if (!row.id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await send("PATCH", { id: row.id, data: changes });
      if (!result.ok) throw new Error(result.error ?? "Could not update. Please try again.");
      setSuccess(done);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: RecordRow) {
    if (!row.id || !window.confirm(`Remove this ${definition.itemName}? This cannot be undone.`)) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await send("DELETE", { id: row.id });
      if (!result.ok) throw new Error(result.error ?? "Could not remove. Please try again.");
      setSuccess(`The ${definition.itemName} was removed.`);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: Field) {
    const source = editing ?? (definition.singleton ? data.settings : null);
    const value = source?.[field.key] ?? "";
    const optional = !field.required && field.type !== "checkbox" && field.type !== "weekdays";
    const label = (
      <>
        {field.label}
        {optional && <span className="font-normal text-[#3f524f]"> (optional)</span>}
      </>
    );
    const help = field.help ? <span className="adm-help block">{field.help}</span> : null;

    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="flex items-start gap-3 sm:col-span-2">
          <input name={field.key} type="checkbox" defaultChecked={Boolean(value)} className="mt-1 size-6 accent-[#0f5f5c]" />
          <span><span className="adm-label">{field.label}</span>{help}</span>
        </label>
      );
    }
    if (field.type === "weekdays") {
      const preset = editing ? [String(editing.weekday)] : [];
      return (
        <fieldset key={field.key} className="sm:col-span-2">
          <legend className="adm-label">{field.label}</legend>
          {help}
          <div className="mt-2 flex flex-wrap gap-2">
            {weekdays.map((day) => (
              <label key={day.value} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-[#9fb2ab] bg-white px-4 py-2 text-base font-semibold has-[:checked]:border-[#0f5f5c] has-[:checked]:bg-[#e5f4ef]">
                <input type={editing ? "radio" : "checkbox"} name={field.key} value={day.value} defaultChecked={preset.includes(day.value)} className="size-5 accent-[#0f5f5c]" /> {day.label}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    let control: React.ReactNode;
    if (field.type === "textarea") {
      control = <textarea name={field.key} required={field.required} maxLength={4000} defaultValue={String(value)} className="adm-input" placeholder={field.placeholder} />;
    } else if (field.type === "select") {
      let choices = field.options ?? (field.key === "departmentId" ? selectOptions.departmentId : field.key === "doctorId" ? selectOptions.doctorId : []);
      if (field.key === "timezone" && value && !choices.some((c) => c.value === value)) choices = [...choices, { value: String(value), label: String(value) }];
      const initial = String(value || (field.key === "role" ? "staff" : field.key === "timezone" ? "Asia/Kolkata" : field.key === "icon" ? "stethoscope" : ""));
      control = (
        <select name={field.key} required={field.required} defaultValue={initial} className="adm-input">
          {field.required ? <option value="" disabled>Choose…</option> : <option value="">{field.emptyLabel ?? "None"}</option>}
          {choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
        </select>
      );
    } else if (field.type === "password") {
      control = <PasswordInput name={field.key} required={field.required} />;
    } else {
      const initial = field.key === "slotMinutes" && !value ? 30 : field.key === "consultationMinutes" && !value ? 30 : field.key === "displayOrder" && value === "" ? 0 : value;
      control = (
        <input name={field.key} required={field.required} type={field.type ?? "text"} min={field.min} max={field.max} defaultValue={initial === null ? "" : String(initial)} placeholder={field.placeholder} className="adm-input" />
      );
    }
    return (
      <label key={field.key} className={`adm-label ${field.wide ? "sm:col-span-2" : ""}`}>
        {label}
        {help}
        {control}
      </label>
    );
  }

  const basicFields = definition.fields.filter((field) => !field.advanced);
  const advancedFields = definition.fields.filter((field) => field.advanced);
  const showForm = definition.fields.length > 0 && (definition.singleton ? !loading : formOpen);
  const heading = definition.singleton ? "Clinic details" : editing ? `Edit ${definition.itemName}` : definition.addLabel;

  return (
    <div>
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="adm-h1">{definition.title}</h1>
          <p className="adm-sub">{definition.description}</p>
        </div>
        {definition.addLabel && !formOpen && (
          <button type="button" onClick={() => { setEditing(null); setFormOpen(true); setSuccess(""); setError(""); }} className="adm-btn adm-btn-primary shrink-0">
            <Plus size={20} /> {definition.addLabel}
          </button>
        )}
      </header>

      <div aria-live="polite" className="mt-5 grid gap-3">
        {error && <p role="alert" className="adm-alert adm-alert-error">{error}</p>}
        {success && <p className="adm-alert adm-alert-ok">{success}</p>}
      </div>

      {showForm && (
        <form ref={formRef} key={editing?.id ?? "new"} action={save} className="adm-card mt-5 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold">{heading}</h2>
            {!definition.singleton && (
              <button type="button" onClick={() => { setEditing(null); setFormOpen(false); }} className="adm-btn adm-btn-outline adm-btn-sm"><X size={18} /> Close</button>
            )}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">{basicFields.map(renderField)}</div>
          {advancedFields.length > 0 && (
            <details className="mt-5 rounded-xl border-2 border-[#cfdad5] p-4">
              <summary className="cursor-pointer text-lg font-bold">More options</summary>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">{advancedFields.map(renderField)}</div>
            </details>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="adm-btn adm-btn-primary">
              {saving && <LoaderCircle size={18} className="animate-spin" />}
              {definition.singleton ? "Save clinic details" : editing ? "Save changes" : `Save ${definition.itemName}`}
            </button>
            {!definition.singleton && <button type="button" onClick={() => { setEditing(null); setFormOpen(false); }} className="adm-btn adm-btn-outline">Cancel</button>}
          </div>
        </form>
      )}

      {!definition.singleton && (
        <section className="mt-6 grid gap-4" aria-label={definition.title}>
          {loading ? (
            <p className="adm-card flex items-center justify-center gap-3 p-12 text-lg"><LoaderCircle className="animate-spin" /> Loading…</p>
          ) : resource === "messages" ? (
            items.length ? items.map((row) => {
              const status = String(row.status);
              const contact = String(row.contact ?? "");
              const link = contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, "")}`;
              return (
                <article key={String(row.id)} className={`adm-card p-5 ${status === "new" ? "!border-[#e6c766] bg-[#fffbea]" : ""}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{text(row.name)}</h2>
                    <span className={`badge ${status === "new" ? "badge-amber" : status === "read" ? "badge-blue" : "badge-green"}`}>{status === "new" ? "New" : status === "read" ? "Read" : "Done"}</span>
                    <span className="text-base text-[#3f524f]">{formatDateTime(row.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-lg"><a href={link} className="font-semibold text-[#0f5f5c] underline">{contact}</a></p>
                  <p className="mt-3 text-lg font-bold">{text(row.subject)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-lg">{text(row.message)}</p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-[#e3ebe7] pt-4">
                    {status === "new" && <button type="button" disabled={saving} onClick={() => void patchRow(row, { status: "read" }, "Marked as read.")} className="adm-btn adm-btn-outline">Mark as read</button>}
                    {status !== "resolved" && <button type="button" disabled={saving} onClick={() => void patchRow(row, { status: "resolved" }, "Marked as done.")} className="adm-btn adm-btn-primary">Mark as done</button>}
                    {status === "resolved" && <button type="button" disabled={saving} onClick={() => void patchRow(row, { status: "new" }, "Message reopened.")} className="adm-btn adm-btn-outline">Reopen</button>}
                  </div>
                </article>
              );
            }) : <p className="adm-card p-12 text-center text-lg text-[#3f524f]">{definition.empty}</p>
          ) : items.length ? (
            items.map((row, index) => {
              const on = definition.statusKey ? Boolean(row[definition.statusKey]) : true;
              return (
                <article key={String(row.id ?? index)} className={`adm-card p-5 ${!on ? "bg-[#f1f3f2]" : ""}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">{definition.cardTitle(row)}</h2>
                    {definition.statusKey && <span className={`badge ${on ? "badge-green" : "badge-grey"}`}>{on ? definition.statusOn : definition.statusOff}</span>}
                  </div>
                  <dl className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    {definition.details.map((detail) => (
                      <div key={detail.label} className="flex flex-wrap gap-x-2 text-lg">
                        <dt className="font-semibold text-[#3f524f]">{detail.label}:</dt>
                        <dd className="min-w-0 break-words">{detail.value(row)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-[#e3ebe7] pt-4">
                    {!definition.noEdit && (
                      <button type="button" onClick={() => { setEditing(row); setFormOpen(true); setSuccess(""); setError(""); }} className="adm-btn adm-btn-outline"><Pencil size={18} /> Edit</button>
                    )}
                    {definition.statusKey && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          if (on && !window.confirm(`Hide “${definition.cardTitle(row)}”? Patients will no longer see it.`)) return;
                          void patchRow(row, { [definition.statusKey!]: !on }, on ? "Hidden." : "Visible again.");
                        }}
                        className={`adm-btn ${on ? "adm-btn-danger" : "adm-btn-primary"}`}
                      >
                        {on ? (resource === "users" ? "Block sign-in" : "Hide") : (resource === "users" ? "Allow sign-in" : "Show again")}
                      </button>
                    )}
                    {definition.removable && (
                      <button type="button" disabled={saving} onClick={() => void remove(row)} className="adm-btn adm-btn-danger"><Trash2 size={18} /> Remove</button>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="adm-card p-12 text-center text-lg text-[#3f524f]">{definition.empty}</p>
          )}
        </section>
      )}
    </div>
  );
}
