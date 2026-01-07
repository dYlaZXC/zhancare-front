"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faVideo,
  faCalendar,
  faStar,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faClock,
  faMoneyBill,
  faUserMd,
} from "@fortawesome/free-solid-svg-icons";

export default function DoctorAnalytics() {
  // Mock data - replace with real API calls later
  const stats = {
    totalPatients: 156,
    patientsChange: 12,
    totalConsultations: 324,
    consultationsChange: 8,
    avgRating: 4.8,
    ratingChange: 0.2,
    revenue: 450000,
    revenueChange: 15,
  };

  const monthlyData = [
    { month: "Янв", consultations: 45, revenue: 67500 },
    { month: "Фев", consultations: 52, revenue: 78000 },
    { month: "Мар", consultations: 48, revenue: 72000 },
    { month: "Апр", consultations: 61, revenue: 91500 },
    { month: "Май", consultations: 58, revenue: 87000 },
    { month: "Июн", consultations: 60, revenue: 90000 },
  ];

  const recentActivity = [
    { type: "consultation", patient: "Иван И.", time: "2 часа назад", status: "completed" },
    { type: "appointment", patient: "Мария К.", time: "5 часов назад", status: "scheduled" },
    { type: "consultation", patient: "Петр С.", time: "1 день назад", status: "completed" },
    { type: "review", patient: "Анна Л.", time: "2 дня назад", rating: 5 },
  ];

  const upcomingAppointments = [
    { patient: "Сергей М.", time: "Сегодня, 14:00", type: "Видео консультация" },
    { patient: "Елена П.", time: "Сегодня, 16:30", type: "Вызов на дом" },
    { patient: "Дмитрий К.", time: "Завтра, 10:00", type: "Видео консультация" },
  ];

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl shadow-2xl p-8 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2956bf 100%)' }}
      >
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FontAwesomeIcon icon={faChartLine} className="text-2xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Аналитика</h1>
            <p className="text-blue-100">Обзор вашей деятельности</p>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total Patients */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300" style={{ borderColor: '#ebf1ff', borderWidth: '1px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ebf1ff' }}>
              <FontAwesomeIcon icon={faUsers} className="text-xl" style={{ color: '#3772ff' }} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${stats.patientsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={stats.patientsChange >= 0 ? faArrowUp : faArrowDown} className="text-xs" />
              {Math.abs(stats.patientsChange)}%
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Всего пациентов</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
          <p className="text-xs text-gray-500 mt-2">За последний месяц</p>
        </div>

        {/* Total Consultations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300" style={{ borderColor: '#e1eaff', borderWidth: '1px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e1eaff' }}>
              <FontAwesomeIcon icon={faVideo} className="text-xl" style={{ color: '#3267e6' }} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${stats.consultationsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={stats.consultationsChange >= 0 ? faArrowUp : faArrowDown} className="text-xs" />
              {Math.abs(stats.consultationsChange)}%
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Консультаций</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalConsultations}</p>
          <p className="text-xs text-gray-500 mt-2">За всё время</p>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-yellow-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faStar} className="text-yellow-600 text-xl" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${stats.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={stats.ratingChange >= 0 ? faArrowUp : faArrowDown} className="text-xs" />
              {Math.abs(stats.ratingChange)}
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Средний рейтинг</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.avgRating}</p>
          <p className="text-xs text-gray-500 mt-2">Из 5.0 звёзд</p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faMoneyBill} className="text-green-600 text-xl" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={stats.revenueChange >= 0 ? faArrowUp : faArrowDown} className="text-xs" />
              {Math.abs(stats.revenueChange)}%
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Доход</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.revenue.toLocaleString()}₸</p>
          <p className="text-xs text-gray-500 mt-2">За последний месяц</p>
        </div>
      </motion.div>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Динамика по месяцам</h3>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Последние 6 месяцев</option>
              <option>Последний год</option>
              <option>Всё время</option>
            </select>
          </div>

          {/* Simple Bar Chart */}
          <div className="space-y-4">
            {monthlyData.map((data, index) => {
              const maxConsultations = Math.max(...monthlyData.map(d => d.consultations));
              const percentage = (data.consultations / maxConsultations) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{data.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-600 font-semibold">{data.consultations} консультаций</span>
                      <span className="text-green-600 font-semibold">{data.revenue.toLocaleString()}₸</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Предстоящие приёмы</h3>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <FontAwesomeIcon icon={faUserMd} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{appointment.patient}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <FontAwesomeIcon icon={faClock} className="text-xs" />
                      {appointment.time}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {appointment.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Последняя активность</h3>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activity.type === 'consultation' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                <FontAwesomeIcon icon={
                  activity.type === 'consultation' ? faVideo :
                  activity.type === 'appointment' ? faCalendar :
                  faStar
                } />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {activity.type === 'consultation' ? 'Видео консультация' :
                   activity.type === 'appointment' ? 'Вызов на дом' :
                   'Новый отзыв'}
                </p>
                <p className="text-sm text-gray-600">{activity.patient}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{activity.time}</p>
                {activity.status && (
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.status === 'completed' ? 'Завершено' : 'Запланировано'}
                  </span>
                )}
                {activity.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(activity.rating)].map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-xs" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
