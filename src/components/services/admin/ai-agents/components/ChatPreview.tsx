"use client";

import { Bot, Send, Sparkles } from "lucide-react";
import type { FormState } from "../types/aiAgentTypes";

/* ── Live preview ──────────────────────────────────────── */

function getContrastColor(hex: string): string {
  const h = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 135 ? '#1a1a1a' : '#ffffff';
}

export function ChatPreview({ form }: { form: FormState }) {
  const color = form.primary_color || "#8b5cf6";
  const onColor = getContrastColor(color);
  const name = form.agent_name || "AI Ассистент";
  const welcome =
    form.welcome_message ||
    "Здравствуйте! Я ваш персональный AI ассистент. Расскажите о ваших симптомах, и я постараюсь помочь.";

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-100" style={{ minHeight: 340 }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: color }}>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          {form.logo_url ? (
            <img
              src={form.logo_url}
              alt=""
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
              }}
            />
          ) : (
            <Bot className="w-4 h-4" style={{ color: onColor }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-none truncate" style={{ color: onColor }}>{name}</p>
          <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: onColor, opacity: 0.7 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
            Онлайн
          </p>
        </div>
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: onColor, opacity: 0.5 }} />
      </div>

      {/* Messages */}
      <div className="flex-1 bg-gray-50 px-4 py-4 space-y-3">
        {/* AI bubble */}
        <div className="flex gap-2.5 items-end">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: color }}
          >
            <Bot className="w-3.5 h-3.5" style={{ color: onColor }} />
          </div>
          <div
            className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-700 leading-relaxed shadow-sm"
            style={{ background: "#fff", border: "1px solid #f0f0f0" }}
          >
            {welcome.length > 120 ? welcome.slice(0, 120) + "…" : welcome}
          </div>
        </div>

        {/* User bubble */}
        <div className="flex justify-end">
          <div
            className="max-w-[70%] px-3.5 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm"
            style={{ background: color, color: onColor }}
          >
            У меня болит голова и температура 38°
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex gap-2.5 items-end">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: color }}
          >
            <Bot className="w-3.5 h-3.5" style={{ color: onColor }} />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: color, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-400">
          Напишите симптомы…
        </div>
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ background: color }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
