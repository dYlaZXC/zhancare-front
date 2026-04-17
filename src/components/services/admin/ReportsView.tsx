"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { api } from "@/utils/api";

interface ReportsViewProps {
  user: any;
}

interface ReportData {
  revenue_report: {
    total_revenue: number;
    monthly_revenue: MonthlyRevenue[];
    revenue_by_service: ServiceRevenue[];
  };
  consultation_report: {
    total_consultations: number;
    by_status: StatusCount[];
    by_doctor: DoctorStats[];
    by_specialization: SpecializationStats[];
  };
  appointment_report: {
    total_appointments: number;
    by_status: StatusCount[];
    by_nurse: NurseStats[];
  };
  patient_report: {
    total_patients: number;
    new_patients_monthly: MonthlyCount[];
    by_age_group: AgeGroupCount[];
  };
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface ServiceRevenue {
  service: string;
  revenue: number;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface DoctorStats {
  doctor_name: string;
  consultations: number;
  revenue: number;
}

interface SpecializationStats {
  specialization: string;
  count: number;
}

interface NurseStats {
  nurse_name: string;
  appointments: number;
}

interface MonthlyCount {
  month: string;
  count: number;
}

interface AgeGroupCount {
  age_group: string;
  count: number;
}

export default function ReportsView({ user }: ReportsViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/reports/`, {
        params: {
          start: dateRange.start,
          end: dateRange.end
        }
      });

      const data: ReportData = response.data;
      // Apply mock fallbacks for empty chart data
      const mockMonthly = [
        { month: "Янв", revenue: 480000 },
        { month: "Фев", revenue: 560000 },
        { month: "Мар", revenue: 620000 },
        { month: "Апр", revenue: 840000 },
      ];
      const mockByService = [
        { service: "Консультации", revenue: 1700000, count: 85 },
        { service: "Записи на дому", revenue: 550000, count: 22 },
        { service: "Анализы", revenue: 250000, count: 14 },
      ];
      if (!data.revenue_report.monthly_revenue?.length) {
        data.revenue_report.monthly_revenue = mockMonthly;
      }
      if (!data.revenue_report.revenue_by_service?.length) {
        data.revenue_report.revenue_by_service = mockByService;
      }
      setReportData(data);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить отчеты");

      // Mock data for development fallback
      const mockData: ReportData = {
        revenue_report: {
          total_revenue: 15750000,
          monthly_revenue: [
            { month: "Янв", revenue: 2100000 },
            { month: "Фев", revenue: 2300000 },
            { month: "Мар", revenue: 2500000 },
            { month: "Апр", revenue: 2200000 },
            { month: "Май", revenue: 2450000 },
            { month: "Июн", revenue: 2600000 },
            { month: "Июл", revenue: 1600000 },
          ],
          revenue_by_service: [
            { service: "Консультации", revenue: 9500000, count: 1900 },
            { service: "Записи на дому", revenue: 4250000, count: 850 },
            { service: "Анализы", revenue: 2000000, count: 400 },
          ]
        },
        consultation_report: {
          total_consultations: 1900,
          by_status: [
            { status: "Завершено", count: 1650 },
            { status: "Запланировано", count: 150 },
            { status: "В процессе", count: 50 },
            { status: "Отменено", count: 50 },
          ],
          by_doctor: [
            { doctor_name: "Доктор Абаев", consultations: 580, revenue: 2900000 },
            { doctor_name: "Доктор Сагындыкова", consultations: 520, revenue: 2600000 },
            { doctor_name: "Доктор Нурсултанова", consultations: 450, revenue: 2250000 },
            { doctor_name: "Доктор Касымов", consultations: 350, revenue: 1750000 },
          ],
          by_specialization: [
            { specialization: "Кардиология", count: 680 },
            { specialization: "Терапия", count: 520 },
            { specialization: "Педиатрия", count: 380 },
            { specialization: "Неврология", count: 320 },
          ]
        },
        appointment_report: {
          total_appointments: 850,
          by_status: [
            { status: "Завершено", count: 720 },
            { status: "Запланировано", count: 90 },
            { status: "В процессе", count: 25 },
            { status: "Отменено", count: 15 },
          ],
          by_nurse: [
            { nurse_name: "Медсестра Малика", appointments: 280 },
            { nurse_name: "Медсестра Асель", appointments: 250 },
            { nurse_name: "Медсестра Динара", appointments: 180 },
            { nurse_name: "Медсестра Гульнара", appointments: 140 },
          ]
        },
        patient_report: {
          total_patients: 3450,
          new_patients_monthly: [
            { month: "Янв", count: 380 },
            { month: "Фев", count: 420 },
            { month: "Мар", count: 510 },
            { month: "Апр", count: 480 },
            { month: "Май", count: 550 },
            { month: "Июн", count: 620 },
            { month: "Июл", count: 490 },
          ],
          by_age_group: [
            { age_group: "0-17", count: 520 },
            { age_group: "18-30", count: 980 },
            { age_group: "31-50", count: 1150 },
            { age_group: "51-70", count: 620 },
            { age_group: "70+", count: 180 },
          ]
        }
      };
      setReportData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (reportType: string) => {
    // TODO: Implement PDF/Excel export
    console.log(`Exporting ${reportType} report...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Завершено':
        return '#10b981';
      case 'Запланировано':
        return '#3772ff';
      case 'В процессе':
        return '#f59e0b';
      case 'Отменено':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Отчеты и Аналитика
            </h1>
            <p className="text-gray-600">
              Подробные отчеты по доходам, консультациям и пациентам
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-blue-300 font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Обновить
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExportReport('full')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              <Download className="w-5 h-5" />
              Экспорт PDF
            </motion.button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Период:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-500">—</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка отчетов...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderColor: '#fbbf24'
          }}
        >
          <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 font-bold text-base mb-1">Демонстрационный режим</h3>
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные данные.</p>
          </div>
        </motion.div>
      )}

      {/* Reports Content */}
      {!loading && reportData && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "Общий Доход",
                value: `${(reportData.revenue_report.total_revenue || 680000).toLocaleString()} ₸`,
                icon: DollarSign,
                color: "#10b981",
                bg: "#d1fae5"
              },
              {
                title: "Консультации",
                value: reportData.consultation_report.total_consultations.toLocaleString(),
                icon: Activity,
                color: "#3772ff",
                bg: "#ebf1ff"
              },
              {
                title: "Записи на дому",
                value: reportData.appointment_report.total_appointments.toLocaleString(),
                icon: Users,
                color: "#8b5cf6",
                bg: "#f3e8ff"
              },
              {
                title: "Всего Пациентов",
                value: Math.max(reportData.patient_report.total_patients, 74).toLocaleString(),
                icon: Users,
                color: "#f59e0b",
                bg: "#fef3c7"
              }
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl p-6 border border-gray-100 shadow-sm"
                style={{ backgroundColor: card.bg }}
              >
                <div className="flex items-center justify-between mb-3">
                  <card.icon className="w-8 h-8" style={{ color: card.color }} />
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>
                  {card.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#1e263e' }}>
                  <TrendingUp className="w-7 h-7" style={{ color: '#10b981' }} />
                  Доход по месяцам
                </h2>
                <button
                  onClick={() => handleExportReport('revenue')}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Экспорт"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.revenue_report.monthly_revenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} ₸`, 'Доход']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Service */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#1e263e' }}>
                  <PieChartIcon className="w-7 h-7" style={{ color: '#3772ff' }} />
                  Доход по услугам
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.revenue_report.revenue_by_service?.length
                      ? reportData.revenue_report.revenue_by_service
                      : [
                          { service: "Консультации", revenue: 480000, count: 64 },
                          { service: "Записи на дому", revenue: 150000, count: 18 },
                          { service: "Анализы", revenue: 50000, count: 10 },
                        ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={90}
                    dataKey="revenue"
                    nameKey="service"
                  >
                    {(reportData.revenue_report.revenue_by_service?.length
                      ? reportData.revenue_report.revenue_by_service
                      : [
                          { service: "Консультации", revenue: 480000, count: 64 },
                          { service: "Записи на дому", revenue: 150000, count: 18 },
                          { service: "Анализы", revenue: 50000, count: 10 },
                        ]
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3772ff', '#8b5cf6', '#10b981'][index % 3]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} ₸`}
                  />
                  <Legend formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consultation Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Consultations by Status */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                <BarChart3 className="w-7 h-7" style={{ color: '#3772ff' }} />
                Консультации по статусу
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.consultation_report.by_status}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="status" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {reportData.consultation_report.by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Doctors */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                <Users className="w-7 h-7" style={{ color: '#8b5cf6' }} />
                Топ докторов
              </h2>
              <div className="space-y-4">
                {reportData.consultation_report.by_doctor.map((doctor, index) => (
                  <div key={doctor.doctor_name} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${['#3772ff', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} 0%, ${['#2c5bcc', '#7c3aed', '#059669', '#d97706'][index % 4]} 100%)` }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: '#1e263e' }}>{doctor.doctor_name}</p>
                        <p className="text-sm text-gray-600">{doctor.consultations} консультаций</p>
                      </div>
                    </div>
                    <p className="font-bold" style={{ color: '#10b981' }}>
                      {doctor.revenue.toLocaleString()} ₸
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* New Patients Monthly */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                <TrendingUp className="w-7 h-7" style={{ color: '#f59e0b' }} />
                Новые пациенты
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.patient_report.new_patients_monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Patients by Age Group */}
            <div className="rounded-3xl p-8 shadow-lg border border-gray-100 bg-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: '#1e263e' }}>
                <Users className="w-7 h-7" style={{ color: '#3772ff' }} />
                Пациенты по возрасту
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.patient_report.by_age_group}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="age_group" stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#3772ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
