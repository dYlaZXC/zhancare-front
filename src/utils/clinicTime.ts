/**
 * Renders a booking's stored UTC instant in the CLINIC's own timezone,
 * regardless of the viewing device's clock — the bug this fixes: a doctor's
 * table re-parsed a raw ISO timestamp with `toLocaleTimeString()` and no
 * explicit `timeZone`, so it rendered in the BROWSER's local zone instead of
 * the clinic's, showing a different wall-clock time than the admin's own
 * (server-computed) view of the exact same booking.
 *
 * `clinicTz` is a `Clinics.time_zone` value as the backend exposes it via
 * `clinic_timezone` — either a real IANA name ("Asia/Almaty") or a bare
 * fixed UTC-offset string ("+05:00", for legacy clinics with no IANA zone
 * assigned). The two need different handling: `Intl`'s `timeZone` option
 * only accepts real IANA keys — a bare offset throws `RangeError` — so a
 * bare offset is applied by hand (shift the instant, then format it as if
 * it were already UTC) instead of ever being passed to `Intl` as a zone.
 */

const BARE_OFFSET_RE = /^([+-])(\d{2}):(\d{2})$/;

/** Minutes east of UTC for a bare "+HH:MM"/"-HH:MM" string, or null if it
 * isn't one (not a guess — out-of-range values like "+25:99" are rejected,
 * not clamped, same validation as the backend's _clinic_timezone_label). */
function parseBareOffsetMinutes(tz: string): number | null {
  const m = BARE_OFFSET_RE.exec(tz);
  if (!m) return null;
  const [, sign, hh, mm] = m;
  const h = Number(hh);
  const min = Number(mm);
  if (min > 59) return null;
  const signed = (h * 60 + min) * (sign === '-' ? -1 : 1);
  if (signed < -12 * 60 || signed > 14 * 60) return null;
  return signed;
}

function isValidIanaZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function shiftedAsUtc(date: Date, offsetMinutes: number): Date {
  return new Date(date.getTime() + offsetMinutes * 60_000);
}

function formatInZone(iso: string, tz: string | null | undefined, options: Intl.DateTimeFormatOptions, locale = 'ru-RU'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const zone = tz || 'Asia/Almaty';
  try {
    const bareOffset = parseBareOffsetMinutes(zone);
    if (bareOffset !== null) {
      // Shift the instant by the fixed offset, then render it as UTC — this
      // is how a bare offset (no IANA identity, so no real `timeZone` value
      // to give Intl) gets formatted without ever passing it to Intl.
      return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(shiftedAsUtc(date, bareOffset));
    }
    if (isValidIanaZone(zone)) {
      return new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(date);
    }
    console.warn(`clinicTime: unrecognized timezone "${zone}" — falling back to Asia/Almaty`);
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'Asia/Almaty' }).format(date);
  } catch (err) {
    console.warn(`clinicTime: failed to format "${iso}" in "${zone}"`, err);
    return date.toLocaleString(locale);
  }
}

export function formatClinicTime(iso: string, clinicTz?: string | null, opts?: Intl.DateTimeFormatOptions, locale?: string): string {
  return formatInZone(iso, clinicTz, { hour: '2-digit', minute: '2-digit', ...opts }, locale);
}

export function formatClinicDate(iso: string, clinicTz?: string | null, opts?: Intl.DateTimeFormatOptions, locale?: string): string {
  return formatInZone(iso, clinicTz, { day: '2-digit', month: '2-digit', year: 'numeric', ...opts }, locale);
}

/** The viewing device's own IANA zone — correct to use for an ONLINE
 * consultation's "your time" line, and exactly the behavior that is a bug
 * for an offline/in-clinic booking (see module docstring). */
export function getViewerTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Asia/Almaty';
  }
}

/** Y/M/D h:m:s of `date` AS SEEN IN `tz`, reinterpreted as if those same
 * numbers were UTC — the standard trick for deriving a zone's UTC offset at
 * a specific instant (so DST is handled correctly) without parsing any
 * locale-formatted offset string. */
function zonedWallClockAsUtcMillis(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

/** UTC offset, in minutes, of `tz` AT `date` — not "now", so a DST-observing
 * zone (London winter vs summer) is correct for the booking's own moment. */
export function getUtcOffsetMinutes(tz: string | null | undefined, date: Date): number {
  const zone = tz || 'Asia/Almaty';
  const bareOffset = parseBareOffsetMinutes(zone);
  if (bareOffset !== null) return bareOffset;
  try {
    if (!isValidIanaZone(zone)) throw new Error(`not a valid IANA zone: ${zone}`);
    return Math.round((zonedWallClockAsUtcMillis(date, zone) - date.getTime()) / 60_000);
  } catch {
    // Same fallback policy as formatInZone — an unrecognized value (not a
    // real IANA zone, not a valid offset) defaults to Asia/Almaty rather
    // than silently reporting UTC+0.
    return Math.round((zonedWallClockAsUtcMillis(date, 'Asia/Almaty') - date.getTime()) / 60_000);
  }
}

export function getUtcOffsetLabel(tz: string | null | undefined, date: Date): string {
  const minutes = getUtcOffsetMinutes(tz, date);
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hh = Math.floor(abs / 60);
  const mm = abs % 60;
  return `UTC${sign}${hh}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}

export interface DualTime {
  viewerTime: string;
  viewerDate: string;
  viewerLabel: string;
  clinicTime: string;
  clinicDate: string;
  clinicLabel: string;
  /** Same UTC offset AT THE BOOKING'S OWN DATE — compared numerically, not
   * by zone name, so e.g. Asia/Almaty vs Asia/Tashkent (both UTC+5) count
   * as "same" and don't show a redundant second line. */
  sameTimezone: boolean;
  /** Calendar date differs between the two zones (a midnight-rollover
   * booking) — the caller must then show the date alongside the time on
   * BOTH lines, not just "HH:MM", or the hour-only display looks wrong. */
  datesDiffer: boolean;
}

/** Everything needed to show "your time" next to "clinic time" for an
 * ONLINE consultation. Never used for an offline/in-clinic booking — those
 * show only `formatClinicTime`/`formatClinicDate`, unconditionally, because
 * where the viewer happens to be never changes where they need to show up. */
export function formatDualTime(iso: string, clinicTz?: string | null, viewerTzOverride?: string, locale = 'ru-RU'): DualTime {
  const date = new Date(iso);
  const viewerTz = viewerTzOverride || getViewerTimezone();
  const clinic = clinicTz || 'Asia/Almaty';
  const dateOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  const viewerDate = formatInZone(iso, viewerTz, dateOpts, locale);
  const clinicDate = formatInZone(iso, clinic, dateOpts, locale);

  return {
    viewerTime: formatInZone(iso, viewerTz, timeOpts, locale),
    viewerDate,
    viewerLabel: getUtcOffsetLabel(viewerTz, date),
    clinicTime: formatInZone(iso, clinic, timeOpts, locale),
    clinicDate,
    clinicLabel: getUtcOffsetLabel(clinic, date),
    sameTimezone: getUtcOffsetMinutes(viewerTz, date) === getUtcOffsetMinutes(clinic, date),
    datesDiffer: viewerDate !== clinicDate,
  };
}
