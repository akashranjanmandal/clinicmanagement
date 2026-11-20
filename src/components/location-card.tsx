import { MapPin, Navigation } from "lucide-react";

/** Google Maps: shows the embedded map when an embed link is set, otherwise a "Get directions" button. */
export function LocationCard({ address, mapUrl }: { address?: string; mapUrl?: string | null }) {
  const directions = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";
  if (!mapUrl && !address) return null;
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#dbe5df] bg-white">
      {mapUrl && (
        <iframe src={mapUrl} title="Clinic location on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[300px] w-full border-0" />
      )}
      {directions && (
        <div className="flex flex-wrap items-center gap-3 p-4">
          <MapPin size={22} className="shrink-0 text-[#176b68]" aria-hidden />
          <p className="min-w-0 flex-1 whitespace-pre-line text-base font-semibold">{address}</p>
          <a href={directions} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#176b68] px-5 py-2.5 text-base font-bold text-white hover:bg-[#115350]">
            <Navigation size={18} /> Get directions
          </a>
        </div>
      )}
    </div>
  );
}
