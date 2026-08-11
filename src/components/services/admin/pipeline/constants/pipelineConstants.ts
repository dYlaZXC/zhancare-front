// ─── Stage config ─────────────────────────────────────────────────────────────

export const STAGES = [
  { key: "lead",            label: "База клиник",           color: "#64748b", gradient: "from-slate-500 to-slate-600" },
  { key: "contacted",       label: "Написали",              color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  { key: "responded",       label: "Ответили",              color: "#8b5cf6", gradient: "from-violet-500 to-violet-600" },
  { key: "demo",            label: "Провели демо",          color: "#f59e0b", gradient: "from-amber-400 to-amber-500" },
  { key: "negotiating",     label: "Переговоры",            color: "#f97316", gradient: "from-orange-500 to-orange-600" },
  { key: "contract_review", label: "Согласовывают договор", color: "#ec4899", gradient: "from-pink-500 to-pink-600" },
  { key: "contract_signed", label: "Подписали договор",     color: "#06b6d4", gradient: "from-cyan-500 to-cyan-600" },
  { key: "invoiced",        label: "Оплачивает счёт",       color: "#10b981", gradient: "from-emerald-500 to-emerald-600" },
  { key: "paid",            label: "Оплатил",               color: "#22c55e", gradient: "from-green-500 to-green-600" },
  { key: "lost",            label: "Отказ",                 color: "#ef4444", gradient: "from-red-500 to-red-600" },
];

export const PRIORITY_CONFIG = {
  A: { label: "A", dot: "#ef4444", bg: "bg-red-50",    text: "text-red-600",    ring: "ring-red-200",    full: "A — высокий" },
  B: { label: "B", dot: "#f59e0b", bg: "bg-amber-50",  text: "text-amber-600",  ring: "ring-amber-200",  full: "B — средний" },
  C: { label: "C", dot: "#94a3b8", bg: "bg-slate-50",  text: "text-slate-500",  ring: "ring-slate-200",  full: "C — низкий"  },
};

// ─── Map config ───────────────────────────────────────────────────────────────

export const MAP_TILES = {
  dark:      { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",        attr: "© CartoDB"  },
  light:     { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",       attr: "© CartoDB"  },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "© Esri" },
};

export const STAGE_COLOR_MAP: Record<string, string> = {
  lead:"#64748b",contacted:"#3b82f6",responded:"#8b5cf6",demo:"#f59e0b",
  negotiating:"#f97316",contract_review:"#ec4899",contract_signed:"#06b6d4",
  invoiced:"#10b981",paid:"#22c55e",lost:"#ef4444",
};
