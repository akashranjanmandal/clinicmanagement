import { MessageCircle } from "lucide-react";
import { clinic } from "@/lib/clinic-content";

export function WhatsAppButton() {
  if (!clinic.whatsapp) return null;
  return (
    <a
      href={`https://wa.me/${clinic.whatsapp}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with the clinic on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#176b68] text-white shadow-[0_12px_30px_-10px_rgba(17,83,80,0.65)] transition-transform hover:scale-105"
    >
      <MessageCircle size={23} />
    </a>
  );
}
