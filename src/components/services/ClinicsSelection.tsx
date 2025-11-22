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
} from "lucide-react";
import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

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
  onSelectClinic: (clinicId: number) => void;
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
  }, [currentPage, debouncedSearch, selectedCity, selectedCategory, userLocation, searchRadius]);

  useEffect(() => {
    fetchCities();
    fetchCategories();
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

  const handleConfirmSelection = () => {
    if (selectedClinic) {
      onSelectClinic(selectedClinic.id);
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
    <div className="min-h-screen bg-[#ebf1ff]">
      {/* Header Section - Compact */}
      <div className="relative bg-gradient-to-r from-[#3772ff] to-[#2956bf] text-white overflow-hidden">
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
                    Выберите клинику для видео-консультации
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
                    <div className="relative h-32 bg-gradient-to-br from-[#3772ff] to-[#2956bf] overflow-hidden">
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
                        <div className="flex items-center gap-2 text-sm text-[#1b1b1b] mb-3">
                          <Clock className="w-4 h-4 text-[#3772ff]" />
                          <span className="truncate">{clinic.working_hours}</span>
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
                  Попробуйте увеличить радиус поиска или отключить фильтр "Рядом со мной"
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
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-[#3772ff] flex-shrink-0" />
                    <span className="text-[#1b1b1b]">{detailClinic.working_hours}</span>
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

      {/* Fixed Bottom Action Bar */}
      <AnimatePresence>
        {selectedClinic && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-50"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3772ff] to-[#2956bf] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {selectedClinic.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedClinic.city_name}
                    {selectedClinic.address && `, ${selectedClinic.address}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedClinic(null)}
                  className="px-4 py-3 bg-[#e8e8e8] text-[#1b1b1b] rounded-xl font-medium hover:bg-[#dddddd] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="px-6 py-3 bg-gradient-to-r from-[#3772ff] to-[#5B8DEF] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  Продолжить
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClinicsSelection;
