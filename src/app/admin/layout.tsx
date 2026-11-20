import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin-ui">{children}</div>;
}
