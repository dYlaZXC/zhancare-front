"use client";

import type { ReactNode, ElementType } from "react";
import { ExternalLink } from "lucide-react";

/* ── Small helpers ─────────────────────────────────────── */

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
      {children}
    </span>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  icon: Icon,
  monospace,
  hint,
  hintHref,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: ElementType;
  monospace?: boolean;
  hint?: string;
  hintHref?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-purple-500 transition-colors pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all duration-200 hover:border-gray-300 ${monospace ? "font-mono" : ""}`}
        />
      </div>
      {hint && (
        hintHref ? (
          <a
            href={hintHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-700 hover:underline pl-1 transition-colors w-fit"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {hint}
          </a>
        ) : (
          <p className="text-[11px] text-gray-400 pl-1">{hint}</p>
        )
      )}
    </div>
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  monospace,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  monospace?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all duration-200 hover:border-gray-300 resize-none leading-relaxed ${monospace ? "font-mono text-xs" : ""}`}
      />
      {hint && <p className="text-[11px] text-gray-400 pl-1">{hint}</p>}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ElementType;
  color: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}
