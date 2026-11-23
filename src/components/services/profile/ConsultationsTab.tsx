"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Video, Stethoscope, Calendar } from "lucide-react";
import { useProfileData } from "./useProfileData";

export const ConsultationsTab = () => {
  const { consultations, loading } = useProfileData();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(consultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentConsultations = consultations.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => setCurrentPage(page);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(p => p - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(p => p + 1);

  const getInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

  const avatarColors = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-violet-600",
    "from-emerald-500 to-emerald-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-cyan-500 to-cyan-600",
  ];

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-48" />
        </div>
        <div className="divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-28" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Video className="w-8 h-8 text-blue-400" />
        </div>
        <p className="font-semibold text-gray-800">Нет консультаций</p>
        <p className="text-sm text-gray-400 mt-1">Когда у вас будут онлайн-консультации, они появятся здесь</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Video className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">Онлайн консультации</h4>
          <p className="text-xs text-gray-400">{consultations.length} записей</p>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {currentConsultations.map((consultation, idx) => {
          const color = avatarColors[(startIndex + idx) % avatarColors.length];
          const date = new Date(consultation.created_at);
          const dateStr = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
          const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

          return (
            <div
              key={consultation.id}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors group"
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm`}>
                {getInitials(consultation.doctor_first_name, consultation.doctor_last_name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {consultation.doctor_first_name} {consultation.doctor_last_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Stethoscope className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">
                    {consultation.doctor_specialty || "Врач общей практики"}
                  </p>
                </div>
              </div>

              {/* Badge */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium flex-shrink-0">
                <Video className="w-3 h-3" />
                Онлайн
              </span>

              {/* Date */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-gray-700">{dateStr}</p>
                <p className="text-xs text-gray-400">{timeStr}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Показано <span className="font-medium text-gray-700">{startIndex + 1}–{Math.min(startIndex + itemsPerPage, consultations.length)}</span> из <span className="font-medium text-gray-700">{consultations.length}</span> консультаций
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const show = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              const isEllipsis = !show && (page === currentPage - 2 || page === currentPage + 2);

              if (isEllipsis) return <span key={page} className="text-xs text-gray-400 px-1">…</span>;
              if (!show) return null;

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                    page === currentPage
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
