import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Clinic Management | Book an appointment",
    template: "%s | Clinic Management",
  },
  description:
    "Choose a doctor and request an appointment with your clinic.",
  openGraph: {
    type: "website",
    siteName: "Clinic Management",
    title: "Clinic Management | Book an appointment",
    description: "Choose a doctor and request an appointment with your clinic.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clinic Management | Book an appointment",
    description: "Choose a doctor and request an appointment with your clinic.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <main>{children}</main>
      </body>
    </html>
  );
}
