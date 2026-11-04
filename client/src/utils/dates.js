// Dates and greetings for the home pages, in South African time.

const SA = "Africa/Johannesburg";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Today's date in SA as YYYY-MM-DD. */
export const todayInSA = () => new Date().toLocaleDateString("en-CA", { timeZone: SA });

/** The hour (0-23) in SA right now. */
export const hourInSA = () => Number(new Date().toLocaleString("en-ZA", { hour: "numeric", hour12: false, timeZone: SA }));

export const greeting = (hour = hourInSA()) => (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

/** "2026-11-01" -> "November 2026". */
export const monthYear = (ymd) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const ymdOf = (year, monthIndex, day) => new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);

/** The months offered by the Reports picker, newest first. */
export const reportMonths = (today = todayInSA(), count = 24) => {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const start = ymdOf(year, month - 1 - i, 1);
    return { start, label: monthYear(start) };
  });
};

/** A month's first and last dates; the current month stops at today. */
export const monthRange = (start, today = todayInSA()) => {
  const [year, month] = start.split("-").map(Number);
  const last = ymdOf(year, month, 0);
  return { start, end: last < today ? last : today };
};

/** "2026-10-05" -> "Monday, 5 October" (built by hand so it reads the same in every browser). */
export const longDate = (ymd) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
