import { describe, expect, it } from 'vitest';
import {
  formatClinicDate,
  formatClinicTime,
  formatDualTime,
  getUtcOffsetLabel,
  getUtcOffsetMinutes,
} from './clinicTime';

describe('formatClinicTime / formatClinicDate', () => {
  const instant = '2027-06-15T10:00:00Z';

  it('renders the same instant differently for Asia/Almaty (+5) vs Europe/Istanbul (+3)', () => {
    expect(formatClinicTime(instant, 'Asia/Almaty')).toBe('15:00');
    expect(formatClinicTime(instant, 'Europe/Istanbul')).toBe('13:00');
  });

  it('formats a bare UTC-offset string without throwing, matching its IANA equivalent', () => {
    expect(formatClinicTime(instant, '+05:00')).toBe('15:00');
    expect(formatClinicTime(instant, '+03:00')).toBe('13:00');
  });

  it('parses both a Z-suffixed instant and an explicit-offset instant identically', () => {
    const zForm = formatClinicTime('2027-06-15T10:00:00Z', 'Asia/Almaty');
    const offsetForm = formatClinicTime('2027-06-15T15:00:00+05:00', 'Asia/Almaty');
    expect(zForm).toBe(offsetForm);
    expect(zForm).toBe('15:00');
  });

  it('falls back to Asia/Almaty for an unrecognized timezone instead of throwing', () => {
    expect(() => formatClinicTime(instant, 'Not/AZone')).not.toThrow();
    expect(formatClinicTime(instant, 'Not/AZone')).toBe('15:00');
  });

  it('falls back to Asia/Almaty when no timezone is given at all', () => {
    expect(formatClinicTime(instant, undefined)).toBe('15:00');
    expect(formatClinicTime(instant, null)).toBe('15:00');
  });
});

describe('getUtcOffsetMinutes / getUtcOffsetLabel', () => {
  it('computes a bare offset directly, without involving Intl at all', () => {
    const date = new Date('2027-06-15T10:00:00Z');
    expect(getUtcOffsetMinutes('+05:00', date)).toBe(300);
    expect(getUtcOffsetMinutes('-04:00', date)).toBe(-240);
    expect(getUtcOffsetLabel('+03:00', date)).toBe('UTC+3');
  });

  it('rejects an out-of-range offset that merely matches the HH:MM shape', () => {
    // "+25:99" isn't a real offset — falls back to Asia/Almaty (UTC+5),
    // not clamped or half-accepted.
    const date = new Date('2027-06-15T10:00:00Z');
    expect(getUtcOffsetMinutes('+25:99', date)).toBe(300);
  });

  it("tracks Europe/London's DST transition — correct for the booking's own date, not today", () => {
    const winter = new Date('2027-01-15T12:00:00Z');
    const summer = new Date('2027-07-15T12:00:00Z');
    expect(getUtcOffsetMinutes('Europe/London', winter)).toBe(0);
    expect(getUtcOffsetMinutes('Europe/London', summer)).toBe(60);
    expect(formatClinicTime(winter.toISOString(), 'Europe/London')).toBe('12:00');
    expect(formatClinicTime(summer.toISOString(), 'Europe/London')).toBe('13:00');
  });

  it('treats two different IANA zones with the same real offset as equal', () => {
    const date = new Date('2027-06-15T10:00:00Z');
    expect(getUtcOffsetMinutes('Asia/Almaty', date)).toBe(getUtcOffsetMinutes('Asia/Tashkent', date));
  });
});

describe('formatDualTime', () => {
  it('shows no meaningful difference when viewer and clinic share the same real offset (different IANA names)', () => {
    const result = formatDualTime('2027-06-15T10:00:00Z', 'Asia/Almaty', 'Asia/Tashkent');
    expect(result.sameTimezone).toBe(true);
    expect(result.datesDiffer).toBe(false);
    expect(result.clinicTime).toBe(result.viewerTime);
  });

  it('flags a genuinely different offset between viewer and clinic', () => {
    const result = formatDualTime('2027-06-15T10:00:00Z', 'Asia/Almaty', 'Europe/Istanbul');
    expect(result.sameTimezone).toBe(false);
    expect(result.clinicTime).toBe('15:00');
    expect(result.viewerTime).toBe('13:00');
  });

  it('flags a midnight rollover between viewer and clinic local dates', () => {
    // 20:00 UTC: Almaty (+5) is already into the next calendar day (01:00),
    // London in winter (+0) is still on the same day (20:00).
    const result = formatDualTime('2027-01-16T20:00:00Z', 'Asia/Almaty', 'Europe/London');
    expect(result.datesDiffer).toBe(true);
    expect(result.clinicTime).toBe('01:00');
    expect(result.viewerTime).toBe('20:00');
    expect(result.clinicDate).toContain('17');
    expect(result.viewerDate).toContain('16');
  });

  it('never throws for a garbage clinic timezone, and falls back to Asia/Almaty', () => {
    expect(() => formatDualTime('2027-06-15T10:00:00Z', 'garbage', 'Europe/Istanbul')).not.toThrow();
    const result = formatDualTime('2027-06-15T10:00:00Z', 'garbage', 'Europe/Istanbul');
    expect(result.clinicTime).toBe('15:00');
  });
});

describe('formatClinicDate', () => {
  it('formats a full calendar date in the clinic zone', () => {
    expect(formatClinicDate('2027-06-15T20:00:00Z', 'Asia/Almaty')).toBe('16.06.2027');
  });
});
