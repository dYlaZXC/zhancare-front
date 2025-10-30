"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Clock,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    planned: number;
  };
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  delay: number;
}

const StatCard = ({ title, value, icon, gradient, borderColor, iconColor, textColor, delay }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`${gradient} rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 border ${borderColor} shadow-sm hover:shadow-md transition-shadow w-full min-w-0`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm lg:text-base font-medium ${textColor} mb-1 truncate`}>
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textColor.replace('700', '900')} tabular-nums`}>
            {value}
          </p>
        </div>
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards: Omit<StatCardProps, 'delay'>[] = [
    {
      title: "Всего",
      value: stats.total,
      icon: <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-50",
      borderColor: "border-blue-200/50",
      iconColor: "text-blue-600",
      textColor: "text-blue-700"
    },
    {
      title: "Ожидают",
      value: stats.pending,
      icon: <Clock className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-orange-50 to-yellow-50",
      borderColor: "border-orange-200/50",
      iconColor: "text-orange-600",
      textColor: "text-orange-700"
    },
    {
      title: "Активные",
      value: stats.ongoing,
      icon: <Activity className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200/50",
      iconColor: "text-green-600",
      textColor: "text-green-700"
    },
    {
      title: "Завершено",
      value: stats.completed,
      icon: <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-emerald-50 to-teal-50",
      borderColor: "border-emerald-200/50",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700"
    },
    {
      title: "Отменено",
      value: stats.cancelled,
      icon: <XCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-gray-50 to-slate-50",
      borderColor: "border-gray-200/50",
      iconColor: "text-gray-600",
      textColor: "text-gray-700"
    },
    {
      title: "Запланировано",
      value: stats.planned,
      icon: <Calendar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />,
      gradient: "bg-gradient-to-br from-purple-50 to-violet-50",
      borderColor: "border-purple-200/50",
      iconColor: "text-purple-600",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile: Stack vertically */}
      <div className="grid grid-cols-1 gap-3 sm:hidden w-full">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} delay={index * 0.05} />
        ))}
      </div>

      {/* Tablet: 2 columns */}
      <div className="hidden sm:grid md:hidden grid-cols-2 gap-3 w-full">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} delay={index * 0.05} />
        ))}
      </div>

      {/* Desktop small: 3 columns */}
      <div className="hidden md:grid lg:hidden grid-cols-3 gap-4 w-full">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} delay={index * 0.05} />
        ))}
      </div>

      {/* Desktop large: 6 columns */}
      <div className="hidden lg:grid grid-cols-6 gap-4 xl:gap-5 w-full">
        {cards.map((card, index) => (
          <StatCard key={card.title} {...card} delay={index * 0.05} />
        ))}
      </div>
    </div>
  );
};
