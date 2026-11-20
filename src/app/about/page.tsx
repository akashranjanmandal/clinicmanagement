import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, HeartHandshake, Leaf, ShieldCheck } from "lucide-react";
import { clinic } from "@/lib/clinic-content";

export const metadata: Metadata = {
  title: "About our clinic",
  description: "Discover the people, values, and thoughtful approach behind your clinic.",
};

const values = [
  { icon: HeartHandshake, title: "Listen first", body: "We begin with your story, not a checklist. Your concerns deserve time and attention." },
  { icon: ShieldCheck, title: "Be clear", body: "We explain what we know, what we recommend, and why—so you can make informed choices." },
  { icon: Leaf, title: "Care for the long run", body: "Small, sustainable steps can make a meaningful difference to your health over time." },
];

export default function AboutPage() {
  return (
    <>
      <section className="page-wrap py-20 md:py-28">
        <p className="eyebrow">A little about us</p>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.05fr_0.75fr] md:items-end">
          <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.98] tracking-[-0.075em]">
            Healthcare should feel like <span className="font-medium italic text-[#176b68]">care.</span>
          </h1>
          <p className="max-w-lg pb-2 text-base leading-8 text-[#657573]">
            We created this clinic to bring expert medicine a little closer to home—and to make
            every visit feel more human, more considered, and more connected.
          </p>
        </div>
        <div
          role="img"
          aria-label="Welcoming, light-filled clinic care space"
          className="mt-12 h-[360px] rounded-[30px] bg-cover bg-center sm:h-[500px]"
          style={{ backgroundImage: "linear-gradient(90deg, rgba(32,51,50,.08), transparent), url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1800&q=88')" }}
        />
      </section>
      <section className="bg-white py-20 md:py-24">
        <div className="page-wrap grid gap-12 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow">Why we&apos;re here</p>
            <h2 className="section-title mt-4">Good medicine, with room for humanity.</h2>
          </div>
          <div className="max-w-2xl space-y-5 text-[15px] leading-8 text-[#657573]">
            <p>
              At {clinic.name}, we believe excellent care is both clinically thoughtful and deeply
              personal. Our doctors bring their expertise to a team that shares context, follows
              through, and makes it easier to navigate the next step.
            </p>
            <p>
              From a routine check-up to a more complex health question, you deserve to feel
              informed and supported. We&apos;re here to help you stay well, recover with confidence,
              and feel at home along the way.
            </p>
          </div>
        </div>
      </section>
      <section className="page-wrap py-20 md:py-24">
        <p className="eyebrow">What guides us</p>
        <h2 className="section-title mt-4">A few things we believe.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {values.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-[22px] border border-[#e6ece8] bg-white p-7">
              <span className="grid size-11 place-items-center rounded-[15px] bg-[#e5f4ef] text-[#176b68]">
                <Icon size={20} />
              </span>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#657573]">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="page-wrap pb-20">
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-[#e5f4ef] p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <p className="eyebrow">Come see us</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">We&apos;re here when you need us.</h2>
          </div>
          <Link href="/appointments/book" className="inline-flex items-center gap-2 rounded-full bg-[#176b68] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#115350]">
            Book a visit <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
