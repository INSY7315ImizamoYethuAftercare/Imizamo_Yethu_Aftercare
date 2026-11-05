// One-line plain-English takeaways for the Reports tabs, worked out from the
// same numbers the page already shows. Each returns { text, tone } where tone
// is "up" | "down" | "flat" | "none" (the banner picks the arrow and colour).

const isNum = (n) => typeof n === "number";

/** Change between two percentages, in percentage points (null if either is missing). */
export const pointsChange = (now, before) => (isNum(now) && isNum(before) ? now - before : null);

/** "▲ 3" / "▼ 2" / "= 0" for a change in points, or "–" when there is nothing to compare. */
export function changeLabel(diff) {
  if (diff === null) return "–";
  if (diff > 0) return `▲ ${diff}`;
  if (diff < 0) return `▼ ${Math.abs(diff)}`;
  return "= 0";
}

const plural = (n, one, many) => (n === 1 ? one : many);

/** A past month's final week against the week before it. */
function pastWeekInsight(now, before, month) {
  if (!isNum(now)) return { text: `No attendance was recorded in the final week of ${month}.`, tone: "none" };
  const diff = pointsChange(now, before);
  if (diff === null) return { text: `Attendance was ${now}% in the final week of ${month}, with no earlier week to compare against.`, tone: "none" };
  const points = `${Math.abs(diff)} ${plural(Math.abs(diff), "point", "points")}`;
  if (diff > 0) return { text: `Attendance finished ${month} up ${points} on the week before, at ${now}%.`, tone: "up" };
  if (diff < 0) return { text: `Attendance finished ${month} down ${points} on the week before, at ${now}%.`, tone: "down" };
  return { text: `Attendance finished ${month} steady at ${now}%, the same as the week before.`, tone: "flat" };
}

/**
 * This week's attendance against last week's. For a past month, pass its name
 * as `pastMonth` and the weeks compared are its last two.
 */
export function weekInsight(rates, pastMonth = null) {
  const now = rates?.thisWeek;
  const before = rates?.lastWeek;
  if (pastMonth) return pastWeekInsight(now, before, pastMonth);
  if (!isNum(now)) return { text: "No attendance has been recorded this week yet.", tone: "none" };
  const diff = pointsChange(now, before);
  if (diff === null) return { text: `Attendance is ${now}% this week, with no earlier week to compare against.`, tone: "none" };
  const points = `${Math.abs(diff)} ${plural(Math.abs(diff), "point", "points")}`;
  if (diff > 0) return { text: `Attendance is up ${points} on last week, at ${now}%.`, tone: "up" };
  if (diff < 0) return { text: `Attendance is down ${points} on last week, at ${now}%.`, tone: "down" };
  return { text: `Attendance is steady at ${now}%, the same as last week.`, tone: "flat" };
}

/** The week comparison plus the strongest and weakest class this week. */
export function trendsInsight(rates, classRows, pastMonth = null) {
  const base = weekInsight(rates, pastMonth);
  const ranked = (classRows ?? []).filter((c) => isNum(c.thisWeek)).sort((a, b) => b.thisWeek - a.thisWeek);
  if (ranked.length < 2) return base;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  if (best.thisWeek === worst.thisWeek) return base;
  const [leads, lowest] = pastMonth ? ["led", "was lowest"] : ["leads", "is lowest"];
  return { ...base, text: `${base.text} ${best.name} ${leads} at ${best.thisWeek}%; ${worst.name} ${lowest} at ${worst.thisWeek}%.` };
}

/** True once any attendance (present or absent) has been recorded in the period. */
export const hasAttendance = (t) => (t.presentRecords ?? 0) + (t.absentRecords ?? 0) > 0;

/** The donor headline: how many of the enrolled learners came, and how well they attended. */
export function donorInsight(t) {
  const enrolled = t.activeLearners;
  if (!enrolled) return { text: "No learners are enrolled yet.", tone: "none" };
  if (!hasAttendance(t)) {
    return { text: `${enrolled} ${plural(enrolled, "learner is", "learners are")} enrolled; no attendance has been recorded in this period yet.`, tone: "none" };
  }
  const rate = isNum(t.avgAttendance) ? `, with ${t.avgAttendance}% average attendance` : "";
  return { text: `${t.learnersAttended} of ${enrolled} enrolled ${plural(enrolled, "learner", "learners")} attended${rate}.`, tone: "none" };
}

/** The board headline: the size of the programme and who runs it. */
export function boardInsight(t) {
  return {
    text: `${t.activeLearners} active ${plural(t.activeLearners, "learner", "learners")} across ${t.classes} ${plural(t.classes, "class group", "class groups")}, looked after by ${t.teachers} active ${plural(t.teachers, "teacher", "teachers")}.`,
    tone: "none",
  };
}
