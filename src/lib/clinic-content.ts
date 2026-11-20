export const clinic = {
  name: "Your Clinic",
  tagline: "Care that fits your schedule.",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  hours: [
    { days: "Monday – Friday", time: "8:00 am – 8:00 pm" },
    { days: "Saturday", time: "9:00 am – 4:00 pm" },
    { days: "Sunday", time: "Closed" },
  ],
};

export type DoctorCardData = {
  name: string;
  slug: string;
  qualification: string;
  specialization: string;
  experienceYears: number;
  imageUrl: string | null;
  departmentName: string;
  biography: string;
  id?: string;
  departmentId?: string;
  consultationFee?: number | null;
};
