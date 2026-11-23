"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Phone, Search, Loader2, CheckCircle2, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/utils/api";

const CLINIC_STEP_TEXT = {
  ru: {
    chooseClinic: "Выберите клинику", chooseClinicHint: "Заявка будет направлена медсёстрам выбранной клиники",
    searchPlaceholder: "Поиск по названию или адресу...",
    loading: "Загрузка клиник...",
    noneAvailable: "Пока ни одна клиника не подключила услугу «Вызов на дом»",
    noneAvailableHint: "Попробуйте другой способ консультации или зайдите позже",
    noMatches: "Ничего не найдено по этому запросу",
    loadError: "Не удалось загрузить список клиник",
    back: "Назад", continueBtn: "Продолжить →",
  },
  kz: {
    chooseClinic: "Клиниканы таңдаңыз", chooseClinicHint: "Өтінім таңдалған клиниканың медбикелеріне жіберіледі",
    searchPlaceholder: "Атауы немесе мекенжайы бойынша іздеу...",
    loading: "Клиникалар жүктелуде...",
    noneAvailable: "Әзірге ешбір клиника «Үйге шақыру» қызметін қоспаған",
    noneAvailableHint: "Басқа консультация түрін таңдап көріңіз немесе кейінірек кіріңіз",
    noMatches: "Бұл сұрау бойынша ештеңе табылмады",
    loadError: "Клиникалар тізімін жүктеу мүмкін болмады",
    back: "Артқа", continueBtn: "Жалғастыру →",
  },
  en: {
    chooseClinic: "Choose a clinic", chooseClinicHint: "The request will go to the chosen clinic's nurses",
    searchPlaceholder: "Search by name or address...",
    loading: "Loading clinics...",
    noneAvailable: "No clinic has enabled the home-visit service yet",
    noneAvailableHint: "Try another consultation type or check back later",
    noMatches: "Nothing found for this search",
    loadError: "Could not load the clinic list",
    back: "Back", continueBtn: "Continue →",
  },
  uz: {
    chooseClinic: "Klinikani tanlang", chooseClinicHint: "Ariza tanlangan klinika hamshiralariga yuboriladi",
    searchPlaceholder: "Nomi yoki manzili bo'yicha qidirish...",
    loading: "Klinikalar yuklanmoqda...",
    noneAvailable: "Hozircha hech bir klinika «Uyga chaqirish» xizmatini yoqmagan",
    noneAvailableHint: "Boshqa konsultatsiya turini tanlab ko'ring yoki keyinroq kiring",
    noMatches: "Bu so'rov bo'yicha hech narsa topilmadi",
    loadError: "Klinikalar ro'yxatini yuklab bo'lmadi",
    back: "Orqaga", continueBtn: "Davom etish →",
  },
};

interface Clinic {
  id: number;
  name: string;
  address: string | null;
  city_name: string | null;
  phones: string[] | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Clinic[];
}

interface ClinicStepProps {
  clinicId: number | null;
  onSelectClinic: (clinicId: number, clinicName: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
}

const ClinicStep: React.FC<ClinicStepProps> = ({ clinicId, onSelectClinic, onNext, onBack, loading = false }) => {
  const { language: uiLanguage } = useLanguage();
  const tt = CLINIC_STEP_TEXT[uiLanguage as keyof typeof CLINIC_STEP_TEXT] ?? CLINIC_STEP_TEXT.ru;

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      setFetchError(false);
      try {
        const res = await api.get<PaginatedResponse>("/clinics/", {
          params: { home_visits_enabled: true, page_size: 100 },
        });
        if (!cancelled) setClinics(res.data?.results || []);
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = search.trim()
    ? clinics.filter((c) =>
        `${c.name} ${c.address || ""}`.toLowerCase().includes(search.trim().toLowerCase())
      )
    : clinics;

  return (
    <motion.div
      key="clinic-step"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
        <label className="block text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#3772ff]" />
          {tt.chooseClinic} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-4">{tt.chooseClinicHint}</p>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder={tt.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {fetching && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> {tt.loading}
          </div>
        )}

        {!fetching && fetchError && (
          <div className="flex items-center gap-2 py-6 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {tt.loadError}
          </div>
        )}

        {!fetching && !fetchError && clinics.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-10 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400 mb-1" />
            <p className="text-sm font-medium text-gray-700">{tt.noneAvailable}</p>
            <p className="text-xs text-gray-400">{tt.noneAvailableHint}</p>
          </div>
        )}

        {!fetching && !fetchError && clinics.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">{tt.noMatches}</p>
        )}

        {!fetching && !fetchError && filtered.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((clinic) => {
              const selected = clinicId === clinic.id;
              return (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => onSelectClinic(clinic.id, clinic.name)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    selected
                      ? "border-[#3772ff] bg-[#3772ff]/5"
                      : "border-gray-200 hover:border-[#3772ff]/40 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selected ? "bg-[#3772ff] text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{clinic.name}</p>
                    {clinic.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {clinic.address}
                      </p>
                    )}
                    {clinic.phones && clinic.phones.length > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 flex-shrink-0" /> {clinic.phones[0]}
                      </p>
                    )}
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-[#3772ff] flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> {tt.back}
        </button>
        <button
          onClick={onNext}
          disabled={!clinicId || loading}
          className={`flex-1 px-6 py-3 rounded-xl font-bold text-white text-base transition-all duration-200 shadow-lg ${
            !clinicId || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:shadow-xl hover:shadow-[#3772ff]/30 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {tt.continueBtn}
        </button>
      </div>
    </motion.div>
  );
};

export default ClinicStep;
