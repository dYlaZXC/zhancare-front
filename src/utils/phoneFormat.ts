/**
 * Shared phone number formatting utilities.
 *
 * Display format : +7 (701) 234-56-78
 * Storage format : +77012345678  (E.164)
 */

/** Format raw input into display mask +7 (XXX) XXX-XX-XX */
export function formatPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Normalize leading 8 → 7 (Kazakh local dialing)
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);

  // Cap at 11 digits
  digits = digits.slice(0, 11);

  let out = "+" + digits[0];
  if (digits.length > 1)  out += " (" + digits.slice(1, 4);
  if (digits.length >= 4) out += ") " + digits.slice(4, 7);
  if (digits.length >= 7) out += "-" + digits.slice(7, 9);
  if (digits.length >= 9) out += "-" + digits.slice(9, 11);
  return out;
}

/** Convert any phone string to E.164 +7XXXXXXXXXX for DB storage */
export function toE164(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) digits = "7" + digits.slice(1);
  if (digits.length === 10) digits = "7" + digits;
  return digits ? "+" + digits : "";
}

/** True if phone (any format) is a complete valid number */
export function isPhoneComplete(phone: string): boolean {
  return phone.replace(/\D/g, "").length === 11;
}
