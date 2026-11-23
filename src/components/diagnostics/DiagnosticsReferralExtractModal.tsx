"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Loader2, ChevronRight, CheckCircle2,
  AlertCircle, FileText, Trash2,
} from "lucide-react";
import { api } from "@/utils/api";

export interface ExtractedReferralResult {
  id: number;
  service_name: string;
  original_text?: string | null;
}

interface ReviewItem {
  key: string;
  name: string;
  sourceFragment: string;
  included: boolean;
}

interface DiagnosticsReferralExtractModalProps {
  sourceType: "consultation" | "clinic_appointment";
  sourceId: number;
  /** Matches the host page's own color scheme — video-call is dark, offline is light. */
  theme?: "dark" | "light";
  onConfirm: (created: ExtractedReferralResult[]) => void;
  onClose: () => void;
}

const DARK = {
  overlay: "bg-black/70 backdrop-blur-sm",
  panelBg: "#1a2035",
  panelBorder: "#283353",
  headerGradient: "linear-gradient(135deg, #1e2d50, #2956bf)",
  inputBg: "#202942",
  inputBorder: "#283353",
  textPrimary: "text-white/90",
  textSecondary: "text-white/40",
  textMuted: "text-white/30",
  placeholder: "placeholder-white/20",
  itemBg: "#202942",
  itemBorder: "#283353",
  cancelText: "text-white/50 hover:text-white/70",
};

const LIGHT = {
  overlay: "bg-black/40 backdrop-blur-sm",
  panelBg: "#ffffff",
  panelBorder: "#e5e7eb",
  headerGradient: "linear-gradient(135deg, #0891b2, #0e7490)",
  inputBg: "#ffffff",
  inputBorder: "#e5e7eb",
  textPrimary: "text-gray-800",
  textSecondary: "text-gray-400",
  textMuted: "text-gray-400",
  placeholder: "placeholder-gray-400",
  itemBg: "#f9fafb",
  itemBorder: "#e5e7eb",
  cancelText: "text-gray-500 hover:text-gray-700",
};

export default function DiagnosticsReferralExtractModal({
  sourceType, sourceId, theme = "dark", onConfirm, onClose,
}: DiagnosticsReferralExtractModalProps) {
  const c = theme === "dark" ? DARK : LIGHT;
  const [step, setStep] = useState<"input" | "review">("input");
  const [text, setText] = useState("");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const includedCount = items.filter(i => i.included && i.name.trim()).length;

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/chat/extract-diagnostics-referrals/", {
        source_type: sourceType,
        source_id: sourceId,
        text,
      });
      if (data.error) throw new Error(data.error);
      const rawItems: { name: string; source_fragment?: string }[] = data.items || [];
      if (rawItems.length === 0) {
        setError("Не удалось выделить ни одного исследования в тексте — попробуйте описать подробнее.");
        return;
      }
      setItems(rawItems.map((it, i) => ({
        key: `${i}-${it.name}`,
        name: it.name,
        sourceFragment: it.source_fragment || "",
        included: true,
      })));
      setStep("review");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Не удалось проанализировать текст");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const toCreate = items.filter(i => i.included && i.name.trim());
    if (toCreate.length === 0) return;
    setConfirming(true);
    setError(null);
    try {
      const requestId = crypto.randomUUID();
      const { data } = await api.post("/diagnostics/appointments/bulk-create-referrals/", {
        source_type: sourceType,
        source_id: sourceId,
        source: "ai",
        request_id: requestId,
        items: toCreate.map(i => ({ name: i.name.trim(), original_text: i.sourceFragment || undefined })),
      });
      onConfirm(data.appointments || []);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Не удалось создать направления");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${c.overlay}`}
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative flex flex-col overflow-hidden shadow-2xl w-full max-w-xl max-h-[85vh] rounded-2xl"
          style={{ background: c.panelBg, border: `1px solid ${c.panelBorder}` }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ background: c.headerGradient }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Извлечь направления с помощью AI</p>
                <p className="text-white/70 text-[11px]">
                  {step === "input" ? "Опишите, что нужно пройти пациенту" : `Выбрано ${includedCount} из ${items.length}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: c.panelBorder }}>
            {["Описание", "Проверка и подтверждение"].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className={`w-3 h-3 ${c.textMuted}`} />}
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                  (i === 0 && step === "input") || (i === 1 && step === "review")
                    ? "bg-cyan-600 text-white"
                    : c.textMuted
                }`}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {step === "input" ? (
              <div className="p-5 space-y-4">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Например: Сдать общий анализ крови, ферритин и проверить щитовидку"
                  rows={8}
                  className={`w-full px-4 py-3 rounded-xl text-sm ${c.textPrimary} ${c.placeholder} resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50`}
                  style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}` }}
                />
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 space-y-2.5">
                <p className={`text-xs mb-1 ${c.textSecondary}`}>Проверьте и отредактируйте названия при необходимости</p>
                {items.map((item, idx) => (
                  <div
                    key={item.key}
                    className="rounded-xl overflow-hidden"
                    style={{ background: c.itemBg, border: `1px solid ${c.itemBorder}`, opacity: item.included ? 1 : 0.45 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={item.included}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, included: e.target.checked } : it))}
                        className="w-4 h-4 flex-shrink-0 accent-cyan-500"
                      />
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                        className={`flex-1 min-w-0 bg-transparent text-sm font-medium focus:outline-none ${c.textPrimary}`}
                      />
                      <button
                        onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                        className={`p-1 rounded-lg flex-shrink-0 ${c.textMuted} hover:text-red-400 transition-colors`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {item.sourceFragment && (
                      <div className="flex items-start gap-1.5 px-3 pb-2.5 pl-9">
                        <FileText className={`w-3 h-3 mt-0.5 flex-shrink-0 ${c.textMuted}`} />
                        <p className={`text-[11px] italic ${c.textSecondary}`}>«{item.sourceFragment}»</p>
                      </div>
                    )}
                  </div>
                ))}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: c.panelBorder }}>
            {step === "input" ? (
              <>
                <button onClick={onClose} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.cancelText}`}>
                  Отмена
                </button>
                <button
                  onClick={handleExtract}
                  disabled={!text.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #0891b2, #06b6d4)" }}
                >
                  {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Извлекаю...</>) : (<><Sparkles className="w-4 h-4" /> Извлечь</>)}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep("input")} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${c.cancelText}`}>
                  ← Назад
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={includedCount === 0 || confirming}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                >
                  {confirming ? (<><Loader2 className="w-4 h-4 animate-spin" /> Создаю...</>) : (<><CheckCircle2 className="w-4 h-4" /> Подтвердить ({includedCount})</>)}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
