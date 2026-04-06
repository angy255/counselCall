export function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

export function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  const outHours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const outMins = (normalized % 60).toString().padStart(2, "0");
  return `${outHours}:${outMins}`;
}

export function isWithinRange(
  startTime: string,
  endTime: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  return startTime >= rangeStart && endTime <= rangeEnd;
}

export function toDateOnly(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString().slice(0, 10);
}
