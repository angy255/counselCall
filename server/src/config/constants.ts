export const PRACTICE_AREAS = [
  "Family Law",
  "Immigration",
  "Criminal Defense",
  "Employment",
  "Real Estate",
  "Business Law",
  "Estate Planning",
] as const;

export type PracticeArea = (typeof PRACTICE_AREAS)[number];

export const COOKIE_NAME = "token";
