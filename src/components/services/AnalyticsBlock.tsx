// components/AnalyticsBlock.tsx
"use client";

import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalConsultations: number;
  totalAppointments: number;
  mostFrequentDoctor: string;
  mostCommonStatus: string;
  statusCounts: { name: string; value: number }[];
  doctorVisitCounts: { doctor: string; visits: number }[];
}

const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

const AnalyticsBlock: React.FC<{ data: AnalyticsData }> = ({ data }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md">
    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">📊 Аналитика</h3>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard title="Консультации" value={data.totalConsultations} />
      <StatCard title="Домашние визиты" value={data.totalAppointments} />
      <StatCard title="Активный доктор" value={data.mostFrequentDoctor} />
      <StatCard title="Статус" value={data.mostCommonStatus} />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 p-4 rounded-xl">
        <h4 className="font-semibold text-slate-700 mb-2">Статусы визитов</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data.statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {data.statusCounts.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h4 className="font-semibold text-slate-700 mb-2">Визиты по докторам</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.doctorVisitCounts}>
            <XAxis dataKey="doctor" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-gray-100 p-4 rounded-xl text-center shadow-inner">
    <h4 className="text-xs text-gray-500">{title}</h4>
    <p className="text-lg font-bold text-slate-800">{value}</p>
  </div>
);

export default AnalyticsBlock;
