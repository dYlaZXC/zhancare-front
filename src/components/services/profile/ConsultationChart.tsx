"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface ConsultationChartProps {
  data: ChartDataPoint[];
}

const ConsultationChart: React.FC<ConsultationChartProps> = ({ data }) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
        <FontAwesomeIcon icon={faChartLine} /> Динамика консультаций
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsultationChart;
