"use client";

import { FileText, Activity, AsteriskSquare } from "lucide-react";
import type { FormSection } from "./types";

const EXAMPLE_PATIENT = "Иванов Иван Иванович";
const EXAMPLE_DOCTOR = "Петров П.П.";

// Realistic filler text per section, not an empty dashed box — the point is
// to show the admin what a FILLED-IN document looks like (matching the
// real generated PDF's density), the way templates/pdf/consultation.html
// renders a doctor's actual notes.
function exampleContent(section: FormSection): string {
  if (section.type === "diagnostics_referral") {
    return "Общий анализ крови, УЗИ брюшной полости — направлены по результатам осмотра.";
  }
  // Real default text (if set) is exactly what a new sheet will actually
  // show — more accurate for the admin to see than a synthesized example.
  if (section.default_text?.trim()) {
    return section.default_text.trim();
  }
  if (section.ai_hint?.trim()) {
    return `Пример: ${section.ai_hint.trim()}`;
  }
  return `Пример текста, который врач впишет в раздел «${section.label.trim() || "этот раздел"}» во время приёма.`;
}

/**
 * A permanently-visible, read-only "as you type" sketch of the resulting
 * consultation PDF — sits beside the section editor (TemplateEditor) so an
 * admin sees the actual document while building the template, not just a
 * list of field names. Deliberately styled to match
 * templates/pdf/consultation.html (the real WeasyPrint template every
 * consultation PDF is rendered from) almost 1:1 — same serif body, same
 * header/title/info-row/section layout, same blue vs. amber accent for a
 * diagnostics-referral section — so this is a preview of the real document,
 * not a simplified stand-in for it.
 *
 * Deliberately NOT interactive — no typing, no AI test, no PDF download.
 * That heavier "act as the doctor and try it" sandbox stays exactly where it
 * already lives, in TemplatePreview's own modal (still opened by the
 * "Предпросмотр" button) — this is just the live structural glance.
 */
export function TemplateLivePreview({ name, sections }: { name: string; sections: FormSection[] }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU");
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="sticky top-6">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
        <FileText className="w-3.5 h-3.5" />
        Предпросмотр листа
      </div>

      {/* The "page" */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-8 py-7 font-serif text-[#1a1a1a] max-h-[75vh] overflow-y-auto">
          {/* Header row — logo/clinic + date/time, like the PDF's own header-row */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e2e8f5]">
            <div className="text-[11px] font-bold text-[#1e3a5f] font-sans">ZhanCare.Ai</div>
            <div className="text-[9px] text-[#64748b] font-sans">
              Дата: <strong className="text-[#1e3a5f]">{dateStr}</strong>
              <span className="inline-block w-3" />
              Время: <strong className="text-[#1e3a5f]">{timeStr}</strong>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h1 className="text-base font-extrabold uppercase tracking-wide text-[#1e3a5f] break-words">
              {name.trim() || "Название шаблона"}
            </h1>
            <div className="w-10 h-[1.5px] bg-[#3772ff] mx-auto mt-1.5" />
            <p className="text-[9px] text-[#94a3b8] mt-1.5 font-sans">Медицинское заключение</p>
          </div>

          {/* Patient / doctor info row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#f5f8ff] border-l-2 border-[#3772ff] px-3 py-2">
              <div className="text-[8px] font-bold uppercase tracking-wide text-[#64748b] font-sans mb-0.5">Пациент</div>
              <div className="text-sm font-semibold text-[#1e3a5f] truncate">{EXAMPLE_PATIENT}</div>
            </div>
            <div className="bg-[#f5f8ff] border-l-2 border-[#3772ff] px-3 py-2">
              <div className="text-[8px] font-bold uppercase tracking-wide text-[#64748b] font-sans mb-0.5">Лечащий врач</div>
              <div className="text-sm font-semibold text-[#1e3a5f] truncate">{EXAMPLE_DOCTOR}</div>
            </div>
          </div>

          {/* Sections */}
          {sections.length === 0 ? (
            <p className="text-sm text-gray-300 italic text-center py-8 font-sans">
              Добавьте секцию, чтобы увидеть предпросмотр
            </p>
          ) : (
            <div className="space-y-2.5">
              {sections.map((section, i) => {
                const isDiag = section.type === "diagnostics_referral";
                return (
                  <div
                    key={section.key || i}
                    className={`px-3.5 py-2.5 border-l-2 ${isDiag ? "border-[#d97706] bg-[#fffbeb]" : "border-[#3772ff] bg-[#fafbfe]"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {isDiag ? (
                        <Activity className="w-3 h-3 text-[#d97706] flex-shrink-0" />
                      ) : (
                        <FileText className="w-3 h-3 text-[#3772ff] flex-shrink-0" />
                      )}
                      <h3 className={`text-[9px] font-bold uppercase tracking-wide font-sans break-words ${isDiag ? "text-[#92400e]" : "text-[#1e3a5f]"}`}>
                        {section.label.trim() || `Секция ${i + 1}`}
                      </h3>
                      {section.required && (
                        <span className="flex items-center gap-0.5 text-[8px] font-bold text-rose-500 uppercase tracking-wide font-sans flex-shrink-0">
                          <AsteriskSquare className="w-2 h-2" /> обязательно
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-gray-700 leading-relaxed text-justify break-words">
                      {exampleContent(section)}
                    </p>
                    {section.ai_hint && (
                      <p className="mt-1 text-[9px] text-gray-400 font-sans flex items-start gap-1">
                        <span className="text-sky-400 flex-shrink-0">✦</span>
                        <span className="break-words">ИИ ориентируется на: «{section.ai_hint}»</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer — matches the PDF's own footer-table (meta + doctor/signature) */}
          <div className="mt-5 pt-3 border-t border-[#e2e8f5] flex items-end justify-between gap-3">
            <div className="text-[8px] text-[#94a3b8] font-sans">
              <p>Документ сформирован: {dateStr} {timeStr}</p>
              <p>© ZhanCare.Ai {now.getFullYear()}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-[#475569] font-sans">
                Лечащий врач: <strong className="text-[#1e3a5f]">{EXAMPLE_DOCTOR}</strong>
              </p>
              <p className="text-[8px] text-[#94a3b8] border-t border-gray-300 mt-1 pt-1 font-sans">Подпись / М.П.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
