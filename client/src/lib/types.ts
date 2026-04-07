export type Role = "CLIENT" | "ATTORNEY";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AttorneyProfile = {
  bio: string;
  practiceAreas: string[];
  hourlyRate: number;
  photoUrl: string | null;
  stripeOnboardingComplete?: boolean;
};

export type AttorneyListItem = {
  id: string;
  name: string;
  email: string;
  attorneyProfile: AttorneyProfile | null;
};

export type AvailabilityEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type BlockedDate = {
  id: string;
  date: string;
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
  };
};

export type Booking = {
  id: string;
  clientId: string;
  attorneyId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  notes: string | null;
  paymentIntentId?: string | null;
  amountInCents?: number | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  attorney?: {
    id: string;
    name: string;
    email: string;
    attorneyProfile?: {
      photoUrl: string | null;
      hourlyRate: number;
      practiceAreas: string[];
    } | null;
  };
};
