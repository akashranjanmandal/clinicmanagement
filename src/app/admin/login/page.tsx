"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-wrap grid min-h-[72vh] max-w-[500px] place-items-center py-16">
      <div className="w-full rounded-[26px] border border-[#e6ece8] bg-white p-7 shadow-[0_24px_70px_-42px_rgba(23,65,58,0.3)] sm:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#657573] hover:text-[#176b68]"><ArrowLeft size={14} /> Back to clinic site</Link>
        <span className="mt-8 grid size-12 place-items-center rounded-[16px] bg-[#e5f4ef] text-[#176b68]"><LockKeyhole size={20} /></span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.06em]">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#657573]">Sign in with your clinic administrator account.</p>
        <form action={submit} className="mt-7 grid gap-4">
          <label className="text-xs font-bold text-[#425553]">Email
            <input name="email" type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-sm font-normal outline-none focus:border-[#176b68]" />
          </label>
          <label className="text-xs font-bold text-[#425553]">Password
            <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-sm font-normal outline-none focus:border-[#176b68]" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-4 text-sm font-bold text-white disabled:opacity-60 hover:bg-[#115350]">
            {busy ? <><LoaderCircle size={16} className="animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>
      </div>
    </section>
  );
}
