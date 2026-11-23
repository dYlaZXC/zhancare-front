"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  FileText,
  Download,
  Eye,
  Filter,
  Search,
  Clock,
  Activity,
  Stethoscope,
  FlaskConical,
  Pill,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MedicalRecord {
  id: number;
  title: string;
  date: string;
  dateObj: Date;
  notes: string;
  file: string;
  category: "diagnosis" | "test" | "prescription" | "checkup";
  doctor: string;
  status?: "completed" | "pending" | "follow-up";
}

const mockHistory: MedicalRecord[] = [
  {
    id: 1,
    title: "Грипп",
    date: "12 марта 2024",
    dateObj: new Date("2024-03-12"),
    notes: "Легкое течение, назначен парацетамол и отдых. Рекомендуется обильное питье и постельный режим.",
    file: "gripp-recommendation.pdf",
    category: "diagnosis",
    doctor: "Др. Иванов А.С.",
    status: "completed",
  },
  {
    id: 2,
    title: "Общий анализ крови",
    date: "5 февраля 2024",
    dateObj: new Date("2024-02-05"),
    notes: "Все показатели в норме. Гемоглобин 145 г/л, лейкоциты 6.2×10⁹/л. Повторный анализ через 6 месяцев.",
    file: "blood-test-2024.pdf",
    category: "test",
    doctor: "Др. Петрова М.И.",
    status: "completed",
  },
  {
    id: 3,
    title: "Назначение антибиотиков",
    date: "28 января 2024",
    dateObj: new Date("2024-01-28"),
    notes: "Амоксициллин 500мг, 3 раза в день, курс 7 дней. Принимать после еды.",
    file: "prescription-jan-2024.pdf",
    category: "prescription",
    doctor: "Др. Иванов А.С.",
    status: "completed",
  },
  {
    id: 4,
    title: "Ежегодная проверка",
    date: "10 января 2024",
    dateObj: new Date("2024-01-10"),
    notes: "Общее состояние здоровья хорошее. Артериальное давление 120/80, пульс 72 уд/мин.",
    file: "annual-checkup-2024.pdf",
    category: "checkup",
    doctor: "Др. Сидорова Е.В.",
    status: "completed",
  },
  {
    id: 5,
    title: "Контрольный осмотр",
    date: "5 апреля 2024",
    dateObj: new Date("2024-04-05"),
    notes: "Запланирован контрольный осмотр после лечения гриппа.",
    file: "",
    category: "checkup",
    doctor: "Др. Иванов А.С.",
    status: "follow-up",
  },
];

const categoryConfig = {
  diagnosis: {
    label: "Диагноз",
    icon: Stethoscope,
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
  },
  test: {
    label: "Анализ",
    icon: FlaskConical,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
  },
  prescription: {
    label: "Рецепт",
    icon: Pill,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
  },
  checkup: {
    label: "Осмотр",
    icon: FileCheck,
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
  },
};

const statusConfig = {
  completed: { label: "Завершено", color: "bg-green-100 text-green-700" },
  pending: { label: "В обработке", color: "bg-yellow-100 text-yellow-700" },
  "follow-up": { label: "Требуется осмотр", color: "bg-orange-100 text-orange-700" },
};

const MedicalHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search records
  const filteredHistory = useMemo(() => {
    let filtered = mockHistory;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Search in title, notes, and doctor
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query) ||
          item.doctor.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-screen">
          {/* Main content area */}
          <div className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
            {/* Premium Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3772ff] to-[#2956bf] shadow-lg shadow-[#3772ff]/20">
                  <Activity className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#001E80]">
                    Медицинская история
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 mt-1">
                    История заболеваний и анализов за последние визиты
                  </p>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по названию, заметкам или врачу..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-all duration-200"
                >
                  <Filter className="w-4 h-4" />
                  Фильтры
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Category Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedCategory === "all"
                            ? "bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white shadow-lg"
                            : "bg-white border-2 border-gray-300 text-gray-700 hover:border-[#3772ff]"
                        }`}
                      >
                        Все записи
                      </button>
                      {Object.entries(categoryConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedCategory === key
                                ? `${config.bgColor} ${config.textColor} border-2 ${config.borderColor} shadow-md`
                                : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Найдено записей: <span className="font-semibold text-[#3772ff]">{filteredHistory.length}</span>
              </div>
            </motion.div>

            {/* Medical Records Timeline */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredHistory.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Записи не найдены
                    </h3>
                    <p className="text-gray-600">
                      Попробуйте изменить параметры поиска или фильтры
                    </p>
                  </motion.div>
                ) : (
                  filteredHistory.map((item, index) => {
                    const config = categoryConfig[item.category];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-[#3772ff] transition-all duration-200 overflow-hidden group"
                      >
                        {/* Category Header */}
                        <div className={`px-6 py-3 ${config.bgColor} border-b ${config.borderColor}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.color}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <span className={`text-sm font-semibold ${config.textColor}`}>
                                {config.label}
                              </span>
                            </div>
                            {item.status && (
                              <span
                                className={`text-xs font-medium px-3 py-1 rounded-full ${
                                  statusConfig[item.status].color
                                }`}
                              >
                                {statusConfig[item.status].label}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          {/* Title and Date */}
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                              {item.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                <span>{item.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                <span>{item.doctor}</span>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                            {item.notes}
                          </p>

                          {/* File Download */}
                          {item.file && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                              <a
                                href={`/files/${item.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#3772ff]/5 text-[#3772ff] border border-[#3772ff]/20 hover:bg-[#3772ff]/10 transition-all duration-200"
                              >
                                <Eye className="w-4 h-4" />
                                Просмотреть
                              </a>
                              <a
                                href={`/files/${item.file}`}
                                download
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all duration-200"
                              >
                                <Download className="w-4 h-4" />
                                Скачать
                              </a>
                              <span className="inline-flex items-center gap-2 px-3 py-2 text-xs text-gray-600">
                                <FileText className="w-4 h-4" />
                                {item.file}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar - Statistics */}
          <div className="w-full lg:w-80 xl:w-96 bg-gray-50 lg:bg-transparent p-3 sm:p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Статистика</h3>

              {/* Total Records */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всего записей</p>
                    <p className="text-2xl font-bold text-[#3772ff]">{mockHistory.length}</p>
                  </div>
                  <Clock className="w-10 h-10 text-[#3772ff]/20" />
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">По категориям</h4>
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const count = mockHistory.filter((item) => item.category === key).length;
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${config.bgColor}`}>
                          <Icon className={`w-3 h-3 ${config.textColor}`} />
                        </div>
                        <span className="text-sm text-gray-700">{config.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Совет</h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Используйте поиск и фильтры для быстрого доступа к нужным медицинским записям.
                  Все документы можно скачать для личного архива.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
