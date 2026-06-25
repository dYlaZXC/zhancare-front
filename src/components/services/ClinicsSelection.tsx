"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Star,
  Search,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Info,
  ExternalLink,
  Navigation,
  Sparkles,
  Bot,
  History,
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { phoneEntryToString } from "@/utils/phoneFormat";
import PatientConsultationsTable from "./consultations/PatientConsultationsTable";

interface Clinic {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  city_name: string | null;
  district_name: string | null;
  rating: number | null;
  review_count: number | null;
  working_hours: string | null;
  phones: string[] | null;
  categories: string[] | null;
  latitude: number | null;
  longitude: number | null;
  gis2_url: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Clinic[];
}

interface ClinicsSelectionProps {
  onSelectClinic: (clinicId: number, skipAI?: boolean) => void;
  onSkip?: () => void;
}

const ClinicsSelection: React.FC<ClinicsSelectionProps> = ({ onSelectClinic, onSkip }) => {
  const { token } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cities, setCities] = useState<{ id: number; name_ru: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [detailClinic, setDetailClinic] = useState<Clinic | null>(null);
  const [showConsultationMethodModal, setShowConsultationMethodModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinics' | 'history'>('clinics');

  // Helper function to parse and format working hours
  const parseWorkingHours = (hours: string | null) => {
    if (!hours) return null;

    // Split by semicolon and filter empty entries
    const entries = hours.split(';').map(entry => entry.trim()).filter(Boolean);

    // Parse into day-time pairs
    const parsed = entries.map(entry => {
      const colonIndex = entry.indexOf(':');
      if (colonIndex === -1) return { day: entry, time: '' };

      const day = entry.substring(0, colonIndex).trim();
      const time = entry.substring(colonIndex + 1).trim();
      return { day, time };
    });

    return parsed;
  };

  // Helper function to group days with same hours
  const groupWorkingHours = (hours: string | null) => {
    const parsed = parseWorkingHours(hours);
    if (!parsed) return null;

    // Group days by time
    const grouped: { days: string[]; time: string }[] = [];

    parsed.forEach(({ day, time }) => {
      const existing = grouped.find(g => g.time === time);
      if (existing) {
        existing.days.push(day);
      } else {
        grouped.push({ days: [day], time });
      }
    });

    // Format the grouped entries
    return grouped.map(({ days, time }) => ({
      days: days.join(', '),
      time
    }));
  };

  // Location state for "Near me" feature
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(50); // km

  // AI Search state
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiCategories, setAiCategories] = useState<string[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const pageSize = 12;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch clinics when filters change
  useEffect(() => {
    fetchClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, selectedCity, selectedCategory, userLocation, searchRadius]);

  useEffect(() => {
    fetchCities();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('page_size', String(pageSize));

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      if (selectedCity !== "all") {
        params.append('city_name', selectedCity);
      }
      if (selectedCategory !== "all") {
        params.append('category', selectedCategory);
      }

      // Add user location for distance-based sorting
      if (userLocation) {
        params.append('lat', String(userLocation.lat));
        params.append('lng', String(userLocation.lng));
        params.append('radius', String(searchRadius));
      }

      const response = await api.get<PaginatedResponse>(`/clinics/?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setClinics(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setHasNext(!!response.data.next);
      setHasPrevious(!!response.data.previous);
    } catch (error) {
      console.error("Error fetching clinics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get("/clinics/cities/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCities(response.data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/clinics/categories/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSelectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
  };

  const handleShowConsultationMethodModal = () => {
    setShowConsultationMethodModal(true);
  };

  const handleConfirmSelection = (skipAI: boolean = false) => {
    if (selectedClinic) {
      onSelectClinic(selectedClinic.id, skipAI);
      setShowConsultationMethodModal(false);
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleNearMe = () => {
    if (userLocation) {
      // If already using location, disable it
      setUserLocation(null);
      setLocationError(null);
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Геолокация не поддерживается вашим браузером");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setCurrentPage(1);
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Доступ к геолокации запрещён");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Информация о местоположении недоступна");
            break;
          case error.TIMEOUT:
            setLocationError("Превышено время ожидания");
            break;
          default:
            setLocationError("Не удалось определить местоположение");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  };

  // AI Search function
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiExplanation(null);
    setAiCategories([]);

    try {
      const response = await api.post(
        "/clinics/ai-search/",
        {
          query: aiQuery,
          city_name: selectedCity !== "all" ? selectedCity : "",
          lat: userLocation?.lat,
          lng: userLocation?.lng,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.data.success) {
        setClinics(response.data.clinics || []);
        setTotalCount(response.data.total_found || 0);
        setAiExplanation(response.data.explanation);
        setAiCategories(response.data.matched_categories || []);
        setHasNext(false);
        setHasPrevious(false);
      }
    } catch (error) {
      console.error("AI search error:", error);
      setAiExplanation("Произошла ошибка при AI-поиске. Попробуйте ещё раз.");
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiSearch = () => {
    setAiSearchMode(false);
    setAiQuery("");
    setAiExplanation(null);
    setAiCategories([]);
    fetchClinics();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={!hasPrevious}
          className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pages.map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && setCurrentPage(page)}
            disabled={page === '...'}
            className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
              page === currentPage
                ? 'bg-blue-600 text-white shadow-lg'
                : page === '...'
                ? 'cursor-default'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={!hasNext}
          className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header Section - Compact */}
      <div className="relative bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white overflow-hidden rounded-3xl mx-4 md:mx-6 mt-4 md:mt-6">
        <div className="relative w-full px-4 md:px-6 py-4 md:py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            {/* Top row - Title and Skip button */}
            <div className="flex items-start justify-between gap-3">
              {/* Left side - Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">
                    Медицинские клиники
                  </h1>
                  <p className="text-xs md:text-sm text-white/80 truncate">
                    Выберите клинику для предоставления медицинских услуг
                  </p>
                </div>
              </div>

              {/* Skip button */}
              {onSkip && (
                <button
                  onClick={onSkip}
                  className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all text-sm md:text-base flex-shrink-0"
                >
                  <span className="hidden sm:inline">Пропустить</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bottom row - Stats */}
            <div className="flex items-center gap-4 md:gap-6 text-sm">
              {[
                { icon: Building2, value: totalCount, label: "клиник" },
                { icon: MapPin, value: cities.length, label: "городов" },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 md:gap-2">
                  <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/70" />
                  <span className="font-bold">{stat.value}</span>
                  <span className="text-xs md:text-sm text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full px-4 md:px-6 pt-4 md:pt-6">
        <div className="bg-white rounded-2xl shadow-lg p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('clinics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all flex-1 ${
                activeTab === 'clinics'
                  ? "bg-[#3772ff] text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Клиники</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all flex-1 ${
                activeTab === 'history'
                  ? "bg-[#3772ff] text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              <History className="w-4 h-4" />
              <span>История консультаций</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'clinics' ? (
        <>
          {/* Search and Filters */}
          <div className="w-full px-4 md:px-6 py-4 md:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          {/* Search Mode Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setAiSearchMode(false); clearAiSearch(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                !aiSearchMode
                  ? "bg-[#3772ff] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Обычный поиск</span>
            </button>
            <button
              onClick={() => setAiSearchMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                aiSearchMode
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI поиск</span>
            </button>
          </div>

          {/* AI Search Mode */}
          {aiSearchMode ? (
            <div className="space-y-3">
              <div className="relative">
                <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                <input
                  type="text"
                  placeholder="Опишите что вам нужно... например: 'стоматология с хорошими отзывами' или 'где сделать МРТ'"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAiSearch}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {aiLoading ? "Ищу..." : "Найти с AI"}
                </button>
                {aiExplanation && (
                  <button
                    onClick={clearAiSearch}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по названию или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Near Me Button */}
            <button
              onClick={handleNearMe}
              disabled={locationLoading}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                userLocation
                  ? "bg-[#3772ff] text-white"
                  : "bg-[#ebf1ff] text-[#2956bf] hover:bg-[#3772ff] hover:text-white"
              } ${locationLoading ? "opacity-70 cursor-wait" : ""}`}
            >
              {locationLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className={`w-5 h-5 ${userLocation ? "fill-current" : ""}`} />
              )}
              {userLocation ? "Рядом" : "Рядом со мной"}
            </button>

            {/* City Filter */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="appearance-none w-full md:w-48 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-10"
              >
                <option value="all">Все города</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name_ru}>
                    {city.name_ru}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="appearance-none w-full md:w-48 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-10"
                >
                  <option value="all">Все категории</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            )}
            </div>
          )}
        </div>

        {/* AI Explanation Block */}
        {aiExplanation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-purple-900 mb-1">AI рекомендация</p>
                <p className="text-sm text-purple-700">{aiExplanation}</p>
                {aiCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {aiCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Location Error Message */}
        {locationError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <X className="w-5 h-5 flex-shrink-0" />
            <span>{locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Results Count & Pagination Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-gray-600">
              Найдено клиник: <span className="font-semibold text-gray-900">{totalCount}</span>
              {totalPages > 1 && (
                <span className="text-gray-400 ml-2">
                  (страница {currentPage} из {totalPages})
                </span>
              )}
            </p>
            {userLocation && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#ebf1ff] text-[#2956bf] text-sm rounded-full">
                <Navigation className="w-3 h-3" />
                В радиусе {searchRadius} км
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="w-full px-6 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 text-lg">Загрузка клиник...</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentPage}-${selectedCity}-${selectedCategory}-${debouncedSearch}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              >
                {clinics.map((clinic, index) => (
                  <motion.div
                    key={clinic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelectClinic(clinic)}
                    className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 cursor-pointer ${
                      selectedClinic?.id === clinic.id
                        ? "border-[#3772ff] ring-2 ring-[#3772ff]/30"
                        : "border-transparent hover:border-[#c1d3ff]"
                    }`}
                  >
                    {/* Rating Badge */}
                    {clinic.rating && clinic.rating >= 4.5 && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Топ
                      </div>
                    )}

                    {/* Header with gradient */}
                    <div className="relative h-32 bg-gradient-to-br from-[#3772ff] to-[#2956bf] overflow-hidden rounded-t-2xl">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-white/30" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {clinic.city_name || "Город не указан"}
                            {clinic.district_name && `, ${clinic.district_name}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[#1b1b1b] mb-2 group-hover:text-[#3772ff] transition-colors line-clamp-2">
                        {clinic.name}
                      </h3>

                      {clinic.address && (
                        <p className="text-sm text-[#b8b8b8] mb-3 line-clamp-1">
                          {clinic.address}
                        </p>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                clinic.rating && i < Math.floor(clinic.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {clinic.rating && (
                          <span className="text-sm font-semibold text-[#1b1b1b]">
                            {clinic.rating.toFixed(1)}
                          </span>
                        )}
                        {clinic.review_count && (
                          <span className="text-sm text-[#b8b8b8]">
                            ({clinic.review_count} отзывов)
                          </span>
                        )}
                      </div>

                      {/* Working Hours */}
                      {clinic.working_hours && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#1b1b1b] mb-2">
                            <Clock className="w-4 h-4 text-[#3772ff]" />
                            <span>Часы работы:</span>
                          </div>
                          <div className="space-y-1 text-xs text-[#1b1b1b] ml-6">
                            {groupWorkingHours(clinic.working_hours)?.slice(0, 2).map((entry, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="font-medium min-w-[60px]">{entry.days}:</span>
                                <span className="text-[#b8b8b8]">{entry.time}</span>
                              </div>
                            ))}
                            {groupWorkingHours(clinic.working_hours) && groupWorkingHours(clinic.working_hours)!.length > 2 && (
                              <div className="text-[#3772ff] font-medium">
                                +еще {groupWorkingHours(clinic.working_hours)!.length - 2}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      {clinic.categories && clinic.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {clinic.categories.slice(0, 3).map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#ebf1ff] text-[#2956bf] text-xs rounded-full"
                            >
                              {cat}
                            </span>
                          ))}
                          {clinic.categories.length > 3 && (
                            <span className="px-2 py-1 bg-[#e8e8e8] text-[#1b1b1b] text-xs rounded-full">
                              +{clinic.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailClinic(clinic);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 bg-[#e8e8e8] text-[#1b1b1b] hover:bg-[#dddddd]"
                        >
                          <Info className="w-4 h-4" />
                          Подробнее
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClinic(clinic);
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                            selectedClinic?.id === clinic.id
                              ? "bg-[#3772ff] text-white"
                              : "bg-[#ebf1ff] text-[#2956bf] hover:bg-[#3772ff] hover:text-white"
                          }`}
                        >
                          {selectedClinic?.id === clinic.id ? (
                            <>
                              <Star className="w-4 h-4" />
                              Выбрано
                            </>
                          ) : (
                            <>
                              Выбрать
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {!loading && clinics.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {userLocation ? (
              <>
                <p className="text-gray-500 text-lg mb-2">
                  Клиники не найдены в радиусе {searchRadius} км
                </p>
                <p className="text-gray-400 mb-4">
                  Попробуйте увеличить радиус поиска или отключить фильтр &ldquo;Рядом со мной&rdquo;
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchRadius(searchRadius + 50);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-[#ebf1ff] text-[#2956bf] rounded-xl font-medium hover:bg-[#3772ff] hover:text-white transition-all"
                  >
                    Искать в {searchRadius + 50} км
                  </button>
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setSearchRadius(50);
                    }}
                    className="px-4 py-2 bg-[#e8e8e8] text-[#1b1b1b] rounded-xl font-medium hover:bg-[#dddddd] transition-all"
                  >
                    Показать все клиники
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-lg mb-2">Клиники не найдены</p>
                <p className="text-gray-400">Попробуйте изменить параметры поиска</p>
              </>
            )}
          </div>
        )}
      </div>
        </>
      ) : (
        /* History Tab */
        <div className="w-full px-4 md:px-6">
          <PatientConsultationsTable />
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailClinic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDetailClinic(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-40 bg-gradient-to-br from-[#3772ff] to-[#2956bf] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="w-20 h-20 text-white/20" />
                </div>
                <button
                  onClick={() => setDetailClinic(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <h2 className="text-xl font-bold line-clamp-2">{detailClinic.name}</h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Location */}
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-[#3772ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1b1b1b]">
                      {detailClinic.city_name || "Город не указан"}
                      {detailClinic.district_name && `, ${detailClinic.district_name}`}
                    </p>
                    {detailClinic.address && (
                      <p className="text-sm text-[#b8b8b8]">{detailClinic.address}</p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {detailClinic.rating && (
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 text-yellow-400 fill-current flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1b1b1b]">{detailClinic.rating.toFixed(1)}</span>
                      {detailClinic.review_count && (
                        <span className="text-sm text-[#b8b8b8]">({detailClinic.review_count} отзывов)</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Working Hours */}
                {detailClinic.working_hours && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-5 h-5 text-[#3772ff] flex-shrink-0" />
                      <h3 className="font-semibold text-[#1b1b1b]">Часы работы</h3>
                    </div>
                    <div className="space-y-2 ml-8">
                      {groupWorkingHours(detailClinic.working_hours)?.map((entry, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <span className="font-medium text-[#1b1b1b] min-w-[80px]">{entry.days}:</span>
                          <span className="text-[#b8b8b8]">{entry.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open on Map Button */}
                {(detailClinic.gis2_url || (detailClinic.latitude && detailClinic.longitude)) && (
                  <div className="mb-4">
                    <a
                      href={
                        detailClinic.gis2_url ||
                        `https://2gis.kz/geo/${detailClinic.longitude},${detailClinic.latitude}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ebf1ff] text-[#2956bf] rounded-xl font-medium hover:bg-[#3772ff] hover:text-white transition-all duration-300"
                    >
                      <MapPin className="w-4 h-4" />
                      Открыть на карте
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Description */}
                {detailClinic.description && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-[#1b1b1b] mb-2">Описание</h3>
                    <p className="text-sm text-[#1b1b1b] leading-relaxed">{detailClinic.description}</p>
                  </div>
                )}

                {/* Categories */}
                {detailClinic.categories && detailClinic.categories.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-[#1b1b1b] mb-2">Категории</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailClinic.categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[#ebf1ff] text-[#2956bf] text-sm rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => {
                    handleSelectClinic(detailClinic);
                    setDetailClinic(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                >
                  Выбрать эту клинику
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedClinic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedClinic(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-[#ebf1ff] to-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#c1d3ff]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with clinic info */}
              <div className="bg-white px-6 py-5 border-b border-[#ebf1ff]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3772ff] to-[#2956bf] flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-[#b8b8b8] mb-1">Клиника</p>
                      <h3 className="text-lg font-bold text-[#1b1b1b] leading-tight">
                        {selectedClinic.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClinic(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#b8b8b8] hover:bg-[#ebf1ff] hover:text-[#3772ff] transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-sm text-[#1b1b1b]">
                  <MapPin className="w-4 h-4 text-[#3772ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">
                      {selectedClinic.city_name || "Город не указан"}
                      {selectedClinic.district_name && `, ${selectedClinic.district_name}`}
                    </span>
                    {selectedClinic.address && (
                      <p className="text-[#b8b8b8] text-xs mt-0.5">{selectedClinic.address}</p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {selectedClinic.rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-[#1b1b1b]">
                      {selectedClinic.rating.toFixed(1)}
                    </span>
                    {selectedClinic.review_count && (
                      <span className="text-xs text-[#b8b8b8]">
                        ({selectedClinic.review_count})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Content - Question */}
              <div className="px-6 py-6">
                <h2 className="text-2xl font-bold text-[#1b1b1b] text-center mb-2">
                  Как вы хотите получить помощь?
                </h2>
                <p className="text-sm text-[#b8b8b8] text-center mb-6">
                  Мы подберём врача и всё организуем за вас
                </p>

                {/* Action Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {/* Online Consultation */}
                  <button
                    onClick={handleShowConsultationMethodModal}
                    className="group bg-white hover:bg-[#ebf1ff] border-2 border-[#c1d3ff] hover:border-[#3772ff] rounded-2xl p-4 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#ebf1ff] group-hover:bg-[#3772ff] flex items-center justify-center mx-auto mb-2 transition-colors">
                      <svg className="w-6 h-6 text-[#3772ff] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#1b1b1b] mb-1">Онлайн-консультация</p>
                    <p className="text-[10px] text-[#b8b8b8] leading-tight">Связь с врачом по видео</p>
                  </button>

                  {/* In Clinic */}
                  <button
                    onClick={() => setSelectedClinic(null)}
                    className="group bg-white hover:bg-[#ebf1ff] border-2 border-[#e8e8e8] hover:border-[#c1d3ff] rounded-2xl p-4 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#e8e8e8] group-hover:bg-[#ebf1ff] flex items-center justify-center mx-auto mb-2 transition-colors">
                      <Building2 className="w-6 h-6 text-[#b8b8b8] group-hover:text-[#3772ff] transition-colors" />
                    </div>
                    <p className="text-xs font-bold text-[#1b1b1b] mb-1">Приём в клинике</p>
                    <p className="text-[10px] text-[#b8b8b8] leading-tight">Очная запись к врачу</p>
                  </button>

                  {/* Tests and Examinations */}
                  <button
                    onClick={() => setSelectedClinic(null)}
                    className="group bg-white hover:bg-[#ebf1ff] border-2 border-[#e8e8e8] hover:border-[#c1d3ff] rounded-2xl p-4 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#e8e8e8] group-hover:bg-[#ebf1ff] flex items-center justify-center mx-auto mb-2 transition-colors">
                      <svg className="w-6 h-6 text-[#b8b8b8] group-hover:text-[#3772ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold text-[#1b1b1b] mb-1">Анализы и обследования</p>
                    <p className="text-[10px] text-[#b8b8b8] leading-tight">Подбор проф. и инструм. услуг</p>
                  </button>
                </div>

                {/* Additional info */}
                {selectedClinic.working_hours && (
                  <div className="bg-[#ebf1ff]/50 rounded-xl p-3 border border-[#c1d3ff]/30 mb-4">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-[#3772ff] flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-[#1b1b1b] mb-1">Часы работы:</p>
                        {groupWorkingHours(selectedClinic.working_hours)?.slice(0, 2).map((entry, idx) => (
                          <div key={idx} className="text-[#1b1b1b]">
                            <span className="font-medium">{entry.days}:</span>{' '}
                            <span className="text-[#b8b8b8]">{entry.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Call Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedClinic.phones && selectedClinic.phones.length > 0) {
                        window.location.href = `tel:${phoneEntryToString(selectedClinic.phones[0])}`;
                      }
                    }}
                    disabled={!selectedClinic.phones || selectedClinic.phones.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#e8e8e8] hover:border-[#3772ff] hover:bg-[#ebf1ff] text-[#1b1b1b] hover:text-[#3772ff] rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Позвонить</span>
                  </button>

                  {/* Open on Map Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = selectedClinic.gis2_url ||
                        (selectedClinic.latitude && selectedClinic.longitude
                          ? `https://2gis.kz/geo/${selectedClinic.longitude},${selectedClinic.latitude}`
                          : null);
                      if (url) window.open(url, '_blank');
                    }}
                    disabled={!selectedClinic.gis2_url && !(selectedClinic.latitude && selectedClinic.longitude)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#e8e8e8] hover:border-[#3772ff] hover:bg-[#ebf1ff] text-[#1b1b1b] hover:text-[#3772ff] rounded-xl text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Открыть на карте</span>
                  </button>

                  {/* About Clinic Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailClinic(selectedClinic);
                      setSelectedClinic(null);
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border border-[#e8e8e8] hover:border-[#3772ff] hover:bg-[#ebf1ff] text-[#1b1b1b] hover:text-[#3772ff] rounded-xl text-xs font-medium transition-all"
                  >
                    <Info className="w-4 h-4" />
                    <span>О клинике</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consultation Method Choice Modal */}
      <AnimatePresence>
        {showConsultationMethodModal && selectedClinic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowConsultationMethodModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowConsultationMethodModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ebf1ff] to-[#c1d3ff] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#3772ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1b1b1b] mb-2">
                  Онлайн-консультация
                </h3>
                <p className="text-sm text-[#b8b8b8]">
                  Выберите способ подбора врача
                </p>
              </div>

              {/* Choice Buttons */}
              <div className="space-y-3">
                {/* AI Recommendation */}
                <button
                  onClick={() => handleConfirmSelection(false)}
                  className="w-full group bg-gradient-to-br from-[#ebf1ff] to-white hover:from-[#c1d3ff] hover:to-[#ebf1ff] border-2 border-[#c1d3ff] hover:border-[#3772ff] rounded-2xl p-5 transition-all duration-300 hover:shadow-lg text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3772ff] flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1b1b1b] mb-1 flex items-center gap-2">
                        Подобрать врача автоматически
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3772ff] text-white">
                          AI
                        </span>
                      </p>
                      <p className="text-xs text-[#b8b8b8] leading-relaxed">
                        Опишите симптомы, и наш ИИ подберёт подходящего врача
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#3772ff] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </button>

                {/* Manual Selection */}
                <button
                  onClick={() => handleConfirmSelection(true)}
                  className="w-full group bg-white hover:bg-[#ebf1ff] border-2 border-[#e8e8e8] hover:border-[#c1d3ff] rounded-2xl p-5 transition-all duration-300 hover:shadow-md text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#e8e8e8] group-hover:bg-[#c1d3ff] flex items-center justify-center flex-shrink-0 transition-colors">
                      <svg className="w-6 h-6 text-[#b8b8b8] group-hover:text-[#3772ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#1b1b1b] mb-1">
                        Выбрать врача вручную
                      </p>
                      <p className="text-xs text-[#b8b8b8] leading-relaxed">
                        Просмотрите всех доступных врачей и выберите самостоятельно
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#b8b8b8] group-hover:text-[#3772ff] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClinicsSelection;
