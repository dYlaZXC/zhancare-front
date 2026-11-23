"use client";

import type { ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData, PlanItemStatus } from "./types";
import { formatMoney, STATUS_LABELS } from "./types";

const COLORS = {
  planned: "#6da7ec",
  paid: "#1c5cab",
  collection: "#eb6834",
  debt: "#2a78d6",
  completed: "#0ca30c",
  no_show: "#d03b3b",
  cancelled: "#9ca3af",
  grid: "#e5e7eb",
  axis: "#6b7280",
};

const STATUS_ORDER: PlanItemStatus[] = ["planned", "completed", "no_show", "cancelled"];

const MONTH_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

function monthShort(key: string) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return `${MONTH_SHORT[m - 1]} ${String(y).slice(2)}`;
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}к`;
  return String(Math.round(value));
}

function num(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? (n as number) : 0;
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-sm text-gray-400">{message}</div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: tone }}>{value}</p>
    </div>
  );
}

export function OverviewCharts({ data }: { data: DashboardData }) {
  const { overview, by_month: byMonth, by_status: byStatus, top_debtors: debtors } = data;
  const hasPeriodData = overview.items_total > 0;

  if (!hasPeriodData) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 shadow-sm text-center text-gray-400">
        Нет данных за выбранный период
      </div>
    );
  }

  const monthlyRows = byMonth.map(row => ({
    month: monthShort(row.month),
    planned: num(row.sum_planned),
    paid: num(row.sum_paid),
    collection: num(row.collection_pct),
  }));

  const donutRows = STATUS_ORDER
    .map(status => ({ status, name: STATUS_LABELS[status], value: byStatus[status] ?? 0 }))
    .filter(row => row.value > 0);

  const debtorRows = debtors.map(d => ({ name: d.patient_name, owed: num(d.sum_owed) }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Общая стоимость" value={formatMoney(overview.sum_planned)} tone="#1e263e" />
        <KpiTile label="Оплачено" value={formatMoney(overview.sum_paid)} tone="#0ca30c" />
        <KpiTile label="Задолженность" value={formatMoney(overview.sum_owed)} tone="#d03b3b" />
        <KpiTile label="% сбора" value={`${overview.collection_pct}%`} tone="#2a78d6" />
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        {overview.total_patients} пациентов · {overview.total_plans} планов · {overview.items_total} услуг · {overview.with_debt} с задолженностью
      </p>

      <Card title="Динамика плана лечения и оплат">
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }} barGap={2} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={COLORS.grid} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLORS.axis }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={compactMoney} tick={{ fontSize: 12, fill: COLORS.axis }} axisLine={false} tickLine={false} width={56} />
              <Tooltip formatter={(value) => formatMoney(num(value as number))} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Запланировано" dataKey="planned" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
              <Bar name="Оплачено" dataKey="paid" fill={COLORS.paid} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">% оплаты по месяцам</p>
          <div style={{ height: 90 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRows} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={COLORS.grid} />
                <XAxis dataKey="month" hide />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: COLORS.axis }} axisLine={false} tickLine={false} width={56} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="collection" stroke={COLORS.collection} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Статусы услуг">
          {donutRows.length === 0 ? (
            <EmptyState message="Нет данных за выбранный период" />
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative" style={{ width: 200, height: 200, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutRows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                      {donutRows.map(row => (
                        <Cell key={row.status} fill={COLORS[row.status]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} услуг`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-gray-800">{overview.items_total}</p>
                  <p className="text-xs text-gray-400">услуг</p>
                </div>
              </div>
              <ul className="space-y-2 flex-1 min-w-0">
                {donutRows.map(row => (
                  <li key={row.status} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[row.status] }} />
                    <span className="text-gray-600 truncate">{row.name}</span>
                    <span className="ml-auto font-semibold text-gray-800">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="Пациенты с наибольшей задолженностью">
          {debtorRows.length === 0 ? (
            <EmptyState message="Задолженностей нет" />
          ) : (
            <div style={{ height: Math.max(180, debtorRows.length * 38 + 20) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={debtorRows} layout="vertical" margin={{ top: 4, right: 120, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={COLORS.grid} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 12, fill: COLORS.axis }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatMoney(num(value as number))} />
                  <Bar dataKey="owed" fill={COLORS.debt} radius={[0, 4, 4, 0]} barSize={14}>
                    <LabelList dataKey="owed" position="right" formatter={(v: unknown) => formatMoney(num(v as number))} style={{ fontSize: 12, fill: COLORS.axis }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default OverviewCharts;
