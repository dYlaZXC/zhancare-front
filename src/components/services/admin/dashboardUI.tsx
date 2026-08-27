"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// ─── Shared design tokens for admin analytics-style pages ─────────────────────
// Used by ReportsView and SuperAdminDashboard so both stay visually identical.

export const BRAND = "linear-gradient(135deg, #12263a 0%, #1e263e 40%, #3772ff 100%)";
export const BLUE = "#3772ff";
export const COLORS = ["#3772ff", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899"];

export function Delta({ val }: { val: number | null | undefined }) {
  if (val == null) return <span className="text-gray-400 text-xs font-medium">—</span>;
  const pos = val >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${pos ? "text-emerald-500" : "text-red-500"}`}>
      {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(val)}%
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full bg-blue-500 inline-block flex-shrink-0" />
      {children}
    </h2>
  );
}

export const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export function KPICard({ label, value, sub, icon: Icon, change, color = BLUE }: {
  label: string; value: string; sub?: string;
  icon: any; change?: number | null; color?: string;
}) {
  return (
    <div className="rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: `${color}15` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <Icon className="w-8 h-8 flex-shrink-0" style={{ color }} />
      </div>
      {change !== undefined && <div className="mt-2"><Delta val={change} /></div>}
    </div>
  );
}
