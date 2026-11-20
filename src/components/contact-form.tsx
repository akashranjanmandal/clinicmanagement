"use client";

import { useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useSingleFlight } from "@/lib/use-single-flight";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const once = useSingleFlight();

  function submit(formData: FormData) {
    return once(() => send(formData));
  }

  async function send(formData: FormData) {
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Message could not be sent.");
      setState("sent");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-[22px] bg-[#e5f4ef] p-7">
        <span className="grid size-10 place-items-center rounded-full bg-white text-[#176b68]"><Check size={18} /></span>
        <h2 className="mt-5 text-xl font-semibold">Thanks for reaching out.</h2>
        <p className="mt-2 text-base leading-6 text-[#4a5a58]">Our team has received your message and will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form action={submit} aria-busy={state === "sending"} className="rounded-[24px] border border-[#e6ece8] bg-white p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">Send us a note</h2>
      <p className="mt-2 text-base text-[#4a5a58]">We usually respond within one working day.</p>
      <div className="mt-6 grid gap-4">
        <label className="text-base font-bold text-[#2f3f3d]">Your name
          <input name="name" required minLength={2} maxLength={100} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
        </label>
        <label className="text-base font-bold text-[#2f3f3d]">Phone or email
          <input name="contact" required minLength={5} maxLength={254} className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
        </label>
        <label className="text-base font-bold text-[#2f3f3d]">Subject
          <input name="subject" required minLength={2} maxLength={120} className="mt-2 w-full rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
        </label>
        <label className="text-base font-bold text-[#2f3f3d]">How can we help?
          <textarea name="message" required minLength={10} maxLength={2000} rows={4} className="mt-2 w-full resize-y rounded-xl border border-[#dfe8e2] bg-[#fafbf9] px-4 py-3.5 text-base font-normal outline-none focus:border-[#176b68]" />
        </label>
      </div>
      <p className="mt-4 text-sm leading-5 text-[#5f6f6c]">
        Please don&apos;t include urgent or sensitive medical information. For urgent care, call your local emergency service.
      </p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#176b68] px-5 py-4 text-base font-bold text-white disabled:opacity-60 hover:bg-[#115350]">
        {state === "sending" ? <><LoaderCircle size={16} className="animate-spin" /> Sending…</> : <>Send message <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
