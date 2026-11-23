/**
 * Client-side prompt injection guard — first line of defence before the API call.
 * Mirrors the backend ai_safety.py patterns (kept in sync manually).
 * Three language groups: English, Russian, Kazakh.
 *
 * ⚠️  JavaScript \b only works with ASCII \w chars ([a-zA-Z0-9_]).
 *     Cyrillic letters are \W, so \b between a space and a Cyrillic letter
 *     NEVER matches — Russian patterns must NOT use \b.
 *     English patterns keep \b (ASCII only, works correctly).
 *
 * Pattern design rules:
 *   - Fuzzy anchors (.{0,120}) catch typos, extra words, and padding attacks
 *   - Partial stems (instruct, инструкц) catch all grammatical forms
 *   - Typo-tolerant verb forms ([йи]) catch common Cyrillic typos
 *   - /s flag (DOTALL) catches attacks split across newlines
 *   - Local negation window (15 chars before match) prevents compound-sentence bypasses
 */

const PATTERNS_EN = [
  /\bignore\b.{0,120}\b(instruct|rule|prompt|constraint)/is,
  /\bforget\b.{0,120}\b(instruct|rule|context|training|everything)/is,
  /\bdisregard\b.{0,120}\b(instruct|rule)/is,
  /\boverride\b.{0,120}\b(instruct|rule|setting|system)/is,
  /please\s+act\s+(differently|as\s+)/i,
  /new\s+rules?\s*[:\-]/i,
  /starting\s+now\s+(you|your)/i,
  /from\s+this\s+(point|moment|message)\s+(on|forward)/i,
  /you\s+are\s+now\s+(?!a?\s*medical|an?\s+ai\s+assistant)/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /act\s+as\s+(?!a?\s*medical|an?\s+ai\s+assistant)/i,
  /roleplay\s+as\s+/i,
  /from\s+now\s+on\s+(you\s+are|you\s+will|act)/i,
  /your\s+new\s+(instructions?|rules?|role|persona)\s+(are|is)/i,
  /switch\s+(to\s+)?a?\s*different\s+(mode|role|persona)/i,
  /\bdan\b.*mode/is,
  /jailbreak/i,
  /developer\s+mode/i,
  /god\s+mode/i,
  /unrestricted\s+mode/i,
  /no\s+restrictions/i,
  /without\s+restrictions/i,
  /bypass\s+(your\s+)?(restrictions?|filters?|safety)/i,
  /(show|reveal|print|output|repeat|tell\s+me)\s+(your\s+)?(system\s+prompt|instructions?|prompt)/i,
  /what\s+(are|were)\s+your\s+(original\s+)?(instructions?|rules?|system\s+prompt)/i,
  /new\s+task\s*:/i,
  /(stop|cease)\s+being\s+a\s+/i,
];

// No \b on Cyrillic patterns — JS \b is ASCII-only and silently fails on Cyrillic.
// The verb stems are specific enough without word boundaries.
const PATTERNS_RU = [
  /забудь.{0,120}инструкц/is,
  /забудь.{0,120}правил/is,
  /забудь.{0,120}контекст/is,
  /игнориру[йи].{0,120}инструкц/is,
  /игнориру[йи].{0,120}правил/is,
  /игнориру[йи].{0,120}запрет/is,
  /притворись\s+(что\s+ты|будто)/i,
  /сделай\s+вид\s+(что\s+ты|будто)/i,
  /ты\s+теперь\s+(?!медицинский|ии)/i,
  /теперь\s+ты\s+(?!медицинский|ии)/i,
  /новые\s+правила\s*[:\-—]/i,
  /с\s+этого\s+момента\s+(ты|твои)/i,
  /отныне\s+(ты|твои)/i,
  /выйди\s+из\s+(режима|роли)/i,
  /смени\s+(роль|режим|личность)/i,
  /сбрось\s+(настройки|контекст|ограничения)/i,
  /покажи\s+(системный\s+промпт|свои\s+инструкции|свои\s+правила)/i,
  /без\s+ограничений/i,
  /обойди\s+(свои\s+)?(ограничения|фильтры|правила)/i,
  /действуй\s+как\s+(?!медицинский)/i,
  /веди\s+себя\s+как\s+(?!медицинский)/i,
  /ты\s+больше\s+не\s+(медицинский|ии|ассистент)/i,
];

const PATTERNS_KZ = [
  /нұсқауларды\s+ұмыт/i,
  /барлық\s+нұсқауларды\s+елемей/i,
  /жаңа\s+нұсқаулар\s*[:\-—]/i,
  /шектеулерсіз/i,
  /шектеулерді\s+айналып/i,
  /енді\s+сен\s+(?!медициналық)/i,
];

// Negation tokens checked in a 15-char window before each match.
// Scoped per-match (not globally) so compound sentences like
// "не игнорируй симптомы, а теперь игнорируй все инструкции"
// still block the second clause.
const NEGATION_TOKENS = ["не ", "не\t", "нельзя", "don't", "do not", "cannot", "never ", "should not"];

function hasLocalNegation(text: string, matchStart: number): boolean {
  const window = text.slice(Math.max(0, matchStart - 15), matchStart).toLowerCase();
  return NEGATION_TOKENS.some((token) => window.includes(token));
}

export function isInjectionAttempt(text: string): boolean {
  // Strip 'g' flag — we manage position manually so we can find overlapping starts.
  // When negation cancels a match, advance by 1 (not to match-end) so the next
  // overlapping trigger verb is also tested independently.
  for (const pattern of [...PATTERNS_EN, ...PATTERNS_RU, ...PATTERNS_KZ]) {
    const p = new RegExp(pattern.source, pattern.flags.replace("g", ""));
    let pos = 0;
    while (pos < text.length) {
      const slice = text.slice(pos);
      const idx = slice.search(p);
      if (idx === -1) break;
      const absoluteStart = pos + idx;
      if (!hasLocalNegation(text, absoluteStart)) return true;
      pos = absoluteStart + 1;
    }
  }
  return false;
}
