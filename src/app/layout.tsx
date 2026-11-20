import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getClinicSettings } from "@/lib/clinic-data";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getClinicSettings().catch(() => null);
  const name = settings?.name?.trim() || "Our Clinic";
  const description = `${name}: meet our doctors, explore our services and book an appointment online.`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: `${name} | Book an appointment`, template: `%s | ${name}` },
    description,
    openGraph: { type: "website", siteName: name, title: `${name} | Book an appointment`, description },
    twitter: { card: "summary", title: `${name} | Book an appointment`, description },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getClinicSettings().catch(() => null);
  const site = {
    name: settings?.name?.trim() || "Your Clinic",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address: settings?.address ?? "",
    hours: settings?.workingHours ?? "",
    whatsapp: settings?.whatsapp ?? "",
  };
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SiteHeader site={site} />
        <main>{children}</main>
        <SiteFooter site={site} />
      </body>
    </html>
  );
}
