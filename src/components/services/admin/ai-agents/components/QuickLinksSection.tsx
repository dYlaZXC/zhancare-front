"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, GripVertical, Link, Plus as PlusIcon, Trash2 } from "lucide-react";
import type { QuickLink } from "../types/aiAgentTypes";

/* ── Quick Links section ────────────────────────────────── */

export function QuickLinksSection({
  links,
  baseUrl,
  onChange,
}: {
  links: QuickLink[];
  baseUrl: string | null;
  onChange: (links: QuickLink[]) => void;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const addLink = () =>
    onChange([...links, { label: "", message: "" }]);

  const updateLink = (idx: number, field: keyof QuickLink, value: string) => {
    const next = links.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    onChange(next);
  };

  const removeLink = (idx: number) =>
    onChange(links.filter((_, i) => i !== idx));

  const copyLink = (idx: number, message: string) => {
    if (!baseUrl || !message) return;
    const url = window.location.origin + baseUrl + "?q=" + encodeURIComponent(message);
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#10b98115" }}>
            <Link className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Быстрые ссылки</p>
            <p className="text-xs text-gray-400">Ссылки с авто-сообщением — пациент открывает и ИИ сразу отвечает</p>
          </div>
        </div>
        <button
          onClick={addLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Добавить
        </button>
      </div>

      {/* Links list */}
      <div className="px-6 py-5 space-y-3">
        {links.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Link className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Нет быстрых ссылок</p>
            <p className="text-xs text-gray-300 max-w-xs">
              Добавьте ссылку — пациент переходит по ней и ИИ сразу получает ваш вопрос
            </p>
            <button
              onClick={addLink}
              className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Создать первую ссылку
            </button>
          </div>
        ) : (
          links.map((link, idx) => {
            const linkUrl = baseUrl && link.message
              ? window.location.origin + baseUrl + "?q=" + encodeURIComponent(link.message)
              : null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="group flex gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <GripVertical className="w-4 h-4 text-gray-200 mt-2.5 flex-shrink-0 cursor-grab" />

                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Label */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Название ссылки</span>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(idx, "label", e.target.value)}
                      placeholder="Например: О специалистах"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/8 transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Авто-сообщение</span>
                    <textarea
                      rows={2}
                      value={link.message}
                      onChange={(e) => updateLink(idx, "message", e.target.value)}
                      placeholder="Расскажи о врачах и специалистах клиники"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/8 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Generated URL */}
                  {linkUrl && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 space-y-2">
                      <p className="font-mono text-[10px] text-emerald-700 break-all leading-relaxed">{linkUrl}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyLink(idx, link.message)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 transition-all"
                        >
                          {copiedIdx === idx ? (
                            <><Check className="w-3 h-3 text-emerald-600" /> Скопировано</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Копировать</>
                          )}
                        </button>
                        <a
                          href={baseUrl + "?q=" + encodeURIComponent(link.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> Открыть
                        </a>
                      </div>
                    </div>
                  )}
                  {link.message && !baseUrl && (
                    <p className="text-[10px] text-amber-500">Сначала задайте URL Slug агента</p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeLink(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
