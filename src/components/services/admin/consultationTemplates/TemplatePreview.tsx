"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { AnimatePresence } from "framer-motion";
import {
  X, User, FileText, Activity, Search, Plus, Sparkles, AsteriskSquare, FileDown, Loader2,
} from "lucide-react";
import { api } from "@/utils/api";
import AIConsultationReview from "@/app/video-call/doctor/components/AIConsultationReview";
import type { FormSection } from "./types";

const EXAMPLE_CATALOG = [
  { name: "Общий анализ крови", category_label: "Лабораторная диагностика", price: 3500 },
  { name: "УЗИ брюшной полости", category_label: "Инструментальная диагностика", price: 8000 },
  { name: "МРТ головного мозга", category_label: "Инструментальная диагностика", price: 25000 },
];

const TEST_PATIENT_NAME = "Иван Иванов";

// A ready-made example so the admin can just hit "Анализировать" — realistic
// enough to exercise complaints/history/exam/diagnosis/treatment-shaped
// sections regardless of what they actually named their own sections.
const TEST_DESCRIPTION = "Пациент Иван Иванов, 38 лет, мужчина, обратился с жалобами на боль в правом подреберье после приёма жирной пищи, тошноту, горечь во рту. Боль возникает эпизодически в течение последних двух недель. При пальпации живот мягкий, болезненный в правом подреберье, симптом Кера положительный. Предварительный диагноз — хронический холецистит. Рекомендовано УЗИ брюшной полости, диета с исключением жирной и жареной пищи, но-шпа при болевом синдроме, повторный приём через 2 недели.";

// A doctor always has a real signature by the time they generate a PDF for
// real — generateMedicalPdf just embeds whatever's passed as an <img>, so for
// this example-only PDF we hand it a drawn placeholder instead of leaving an
// empty src (which would render as a broken-image icon).
const PLACEHOLDER_SIGNATURE = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="50"><text x="0" y="35" font-family="cursive" font-size="22" fill="#1e3a5f" font-style="italic">Пример подписи</text></svg>`
);

export function TemplatePreview({ sections, onClose }: { sections: FormSection[]; onClose: () => void }) {
  // Local-only — lets the admin click around and type to get a feel for it,
  // nothing here is saved or sent anywhere.
  const [values, setValues] = useState<Record<string, string>>({});
  const [showCatalog, setShowCatalog] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);

  // Same non-destructive merge as the real doctor pages: a non-empty AI value
  // fills/replaces a field, an empty one never overwrites something the admin
  // already typed while testing.
  const handleAIApply = (fields: Record<string, string>) => {
    setValues((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(fields)) {
        if (value && value.trim()) next[key] = value;
      }
      return next;
    });
  };

  // Renders through the exact same WeasyPrint template real consultation PDFs
  // use (see consultations/pdf_utils.py) instead of a separate client-side
  // renderer — same fonts, same clinic branding, same icons, guaranteed
  // consistent with what a real generated document looks like.
  const handleDownloadExamplePdf = async () => {
    setGeneratingPdf(true);
    try {
      const formData: Record<string, unknown> = {};
      for (const section of sections) {
        if (section.type === "diagnostics_referral") {
          formData[section.key] = {
            referrals: EXAMPLE_CATALOG,
            comment: values[section.key] || "Пример комментария врача к результатам обследования.",
          };
        } else {
          formData[section.key] = values[section.key] || `Пример текста для секции «${section.label || section.key}».`;
        }
      }

      const response = await api.post(
        "/consultation-templates/preview-pdf/",
        {
          sections,
          form_data: formData,
          patient_name: TEST_PATIENT_NAME,
          doctor_name: "Иванов И.И.",
          signature: PLACEHOLDER_SIGNATURE,
        },
        { responseType: "blob" }
      );
      const blob = response.data as Blob;
      const disposition = response.headers["content-disposition"] as string | undefined;
      const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : "preview.pdf";

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Не удалось сформировать пример PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="bg-gray-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Предпросмотр консультационного листа</h2>
            <p className="text-xs text-gray-400 mt-0.5">Так это увидит врач — можно попробовать заполнить, ничего не сохранится</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mock patient header, matching the real doctor pages */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              И
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{TEST_PATIENT_NAME}</p>
              <p className="text-xs text-gray-400">02 сент., 14:00 — тестовый пациент</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAIReview(true)}
            disabled={sections.filter((s) => (s.type || "text") === "text").length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-40 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #2956bf, #3772ff)" }}
            title="Проверить, как ИИ заполнит текстовые секции по этому шаблону"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ИИ Анализ
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">Добавьте хотя бы одну секцию, чтобы увидеть предпросмотр</div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-200">
              {sections.map((section) => (
                <div key={section.key} className="bg-white">
                  <div className="flex items-center gap-2.5 px-6 py-3 border-b border-gray-100 bg-sky-50/60">
                    {section.type === "diagnostics_referral" ? (
                      <Activity className="w-4 h-4 text-cyan-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-500" />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{section.label || "(без названия)"}</span>
                    {section.required && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-500 uppercase tracking-wide">
                        <AsteriskSquare className="w-3 h-3" /> обязательно
                      </span>
                    )}
                  </div>

                  {section.type === "diagnostics_referral" ? (
                    <div className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => setShowCatalog((v) => !v)}
                        className="mb-2 flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Направление
                      </button>
                      {showCatalog && (
                        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <div className="w-full pl-8 pr-3 py-2 rounded-lg text-xs bg-white border border-gray-200 text-gray-400">
                              Поиск услуги...
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {EXAMPLE_CATALOG.map((service) => (
                              <div key={service.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white text-xs text-gray-700">
                                {service.name}
                                <Plus className="w-3.5 h-3.5 text-gray-300" />
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-2">Пример — реальный список услуг клиники подставится автоматически</p>
                        </div>
                      )}
                      <textarea
                        value={values[section.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [section.key]: e.target.value }))}
                        placeholder={section.placeholder || "Обследования, анализы, результаты..."}
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 transition-all"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={values[section.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [section.key]: e.target.value }))}
                      placeholder={section.placeholder || `${section.label || "Заполните этот раздел"}...`}
                      rows={3}
                      className="w-full px-6 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none border-none focus:outline-none focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                  )}

                  {section.ai_hint && (
                    <div className="px-6 pb-3 flex items-start gap-1.5 text-[11px] text-gray-400">
                      <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>ИИ ориентируется на: «{section.ai_hint}»</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-gray-400">PDF сформируется с тестовыми данными — так будет выглядеть настоящий отчёт</p>
          <button
            type="button"
            onClick={handleDownloadExamplePdf}
            disabled={generatingPdf || sections.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex-shrink-0"
          >
            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generatingPdf ? "Формируется..." : "Скачать пример PDF"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAIReview && (
          <AIConsultationReview
            previewMode
            templateSections={sections}
            patientName={TEST_PATIENT_NAME}
            initialDescription={TEST_DESCRIPTION}
            onApply={handleAIApply}
            onClose={() => setShowAIReview(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
