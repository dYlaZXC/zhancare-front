/** Russian pluralization for "час" (1 час / 2-4 часа / 5+ часов). Only ever
 * called with h from 1 to 3 in this range, but handles the general case. */
function hourWord(h: number): string {
  const mod10 = h % 10;
  const mod100 = h % 100;
  if (mod10 === 1 && mod100 !== 11) return 'час';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'часа';
  return 'часов';
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} минут`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} ${hourWord(h)}`;
  if (m === 30) return `${h}.5 часа`;
  return `${h} ${hourWord(h)} ${m} мин`;
}

/**
 * Shared "Продолжительность" dropdown options — used by every place an
 * admin can pick/override a booking's duration (AddEventModal's
 * DateTimeSection, AssignConsultationModal's quick-book flow from
 * "Свободные врачи"/"График врачей"). Kept in one place so the two pickers
 * can't silently drift apart on what durations are offered.
 *
 * 5-minute steps from 5 minutes up to 3 hours — coarser 15/30/45-minute
 * presets weren't enough once the field became admin-editable (a real
 * consultation can run 20 or 50 minutes just as easily as 30 or 45). The
 * dropdown already has its own search box, so a longer list here is a
 * non-issue to navigate.
 */
export const DURATION_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const mins = (i + 1) * 5;
  return { id: mins, label: formatDuration(mins) };
});

/** Minutes between two "HH:MM" strings, handling an overnight span (end <= start). */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e <= s) e += 24 * 60;
  return e - s;
}

/** "HH:MM" string `minutes` after `start` (wraps past midnight). */
export function addMinutes(start: string, minutes: number): string {
  const [sh, sm] = start.split(':').map(Number);
  const total = (sh * 60 + sm + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
