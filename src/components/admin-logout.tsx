"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogout() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} className="adm-btn adm-btn-danger mt-3 w-full">
      <LogOut size={20} /> Sign out
    </button>
  );
}
