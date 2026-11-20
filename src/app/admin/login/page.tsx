"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useSingleFlight } from "@/lib/use-single-flight";

export default function AdminLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const once = useSingleFlight();

  function submit(formData: FormData) {
    return once(() => send(formData));
  }

  async function send(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not sign in. Please try again.");
      router.replace("/admin");
      router.refresh();
      return;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f3f7f5] px-4 py-10">
      <div className="adm-card w-full max-w-[520px] p-7 shadow-xl sm:p-10">
        <span className="grid size-16 place-items-center rounded-2xl bg-[#e5f4ef] text-[#0f5f5c]"><LockKeyhole size={30} aria-hidden /></span>
        <h1 className="adm-h1 mt-5">Staff sign in</h1>
        <p className="adm-sub">Enter the email and password given to you by the clinic.</p>
        <form action={submit} className="mt-7 grid gap-5">
          <label className="adm-label">Email address
            <input name="email" type="email" required autoComplete="username" autoFocus className="adm-input" placeholder="you@clinic.com" />
          </label>
          <label className="adm-label">Password
            <span className="relative block">
              <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="adm-input pr-28" />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="adm-btn adm-btn-outline adm-btn-sm absolute right-1 top-[0.55rem] !min-h-[2.4rem]">
                {show ? <EyeOff size={18} /> : <Eye size={18} />} {show ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="adm-alert adm-alert-error">{error}</p>}
          <button type="submit" disabled={busy} className="adm-btn adm-btn-primary !min-h-14 text-lg">
            {busy ? <><LoaderCircle size={20} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-base text-[#3f524f]">Forgot your password? Ask the clinic administrator to reset it.</p>
        <Link href="/" className="mt-4 inline-flex items-center gap-2 text-base font-semibold text-[#0f5f5c] underline"><ArrowLeft size={18} /> Back to the clinic website</Link>
      </div>
    </div>
  );
}
