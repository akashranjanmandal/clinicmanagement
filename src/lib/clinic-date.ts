import { db } from "@/lib/db";
import { clinicSettings } from "@/lib/db/schema";

/** Today's date (YYYY-MM-DD) in the clinic's own timezone. */
export async function clinicToday() {
  let timeZone = "Asia/Kolkata";
  if (db) {
    const [settings] = await db.select({ timezone: clinicSettings.timezone }).from(clinicSettings).limit(1);
    if (settings?.timezone) timeZone = settings.timezone;
  }
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
}
