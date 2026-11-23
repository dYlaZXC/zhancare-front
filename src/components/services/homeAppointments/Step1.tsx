"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Search, CheckCircle, X, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";

const STEP1_TEXT = {
  ru: {
    loadingMap: "Загрузка карты...",
    receptionAddress: "Адрес приёма", startTypingAddress: "Начните вводить адрес (улица, дом)...",
    startTypingHint: "Начните вводить адрес для получения подсказок",
    locationReceived: "Местоположение получено", lookingOnMap: "Ищем вас на карте...", useMyLocation: "Использовать моё местоположение",
    hideMap: "Скрыть карту", chooseOnMap: "Выбрать на карте",
    addressClarification: "Уточнение адреса",
    apartment: "Квартира", apartmentPlaceholder: "кв. 45",
    entrance: "Подъезд", entrancePlaceholder: "1",
    intercom: "Домофон", intercomPlaceholder: "1234#",
    addressComment: "Комментарий к адресу", optional: "(необязательно)",
    addressCommentPlaceholder: "Например: 2-й этаж, квартира справа от лифта...",
    dateTimeOfVisit: "Дата и время заявки/визита",
    nurseArrivesAt: "Медсестра прибудет в указанное время (±15 минут)",
    symptoms: "Симптомы", symptomsPlaceholder: "Опишите ваши симптомы для медсестры",
    symptomsHint: "Это поможет медсестре подготовиться к визиту",
    loadingBtn: "Загрузка...", continueBtn: "Продолжить →",
  },
  kz: {
    loadingMap: "Карта жүктелуде...",
    receptionAddress: "Қабылдау мекенжайы", startTypingAddress: "Мекенжайды теруді бастаңыз (көше, үй)...",
    startTypingHint: "Ұсыныстарды алу үшін мекенжайды теруді бастаңыз",
    locationReceived: "Орналасқан жер алынды", lookingOnMap: "Сізді картадан іздеудеміз...", useMyLocation: "Менің орналасқан жерімді пайдалану",
    hideMap: "Картаны жасыру", chooseOnMap: "Картадан таңдау",
    addressClarification: "Мекенжайды нақтылау",
    apartment: "Пәтер", apartmentPlaceholder: "пәт. 45",
    entrance: "Кіреберіс", entrancePlaceholder: "1",
    intercom: "Домофон", intercomPlaceholder: "1234#",
    addressComment: "Мекенжайға түсініктеме", optional: "(міндетті емес)",
    addressCommentPlaceholder: "Мысалы: 2-қабат, лифттен оң жақтағы пәтер...",
    dateTimeOfVisit: "Өтінім/визит күні мен уақыты",
    nurseArrivesAt: "Медбике көрсетілген уақытта келеді (±15 минут)",
    symptoms: "Симптомдар", symptomsPlaceholder: "Медбикеге арналған симптомдарыңызды сипаттаңыз",
    symptomsHint: "Бұл медбикеге визитке дайындалуға көмектеседі",
    loadingBtn: "Жүктелуде...", continueBtn: "Жалғастыру →",
  },
  en: {
    loadingMap: "Loading map...",
    receptionAddress: "Visit address", startTypingAddress: "Start typing the address (street, house)...",
    startTypingHint: "Start typing the address to get suggestions",
    locationReceived: "Location received", lookingOnMap: "Looking for you on the map...", useMyLocation: "Use my location",
    hideMap: "Hide map", chooseOnMap: "Choose on map",
    addressClarification: "Address details",
    apartment: "Apartment", apartmentPlaceholder: "apt. 45",
    entrance: "Entrance", entrancePlaceholder: "1",
    intercom: "Intercom", intercomPlaceholder: "1234#",
    addressComment: "Address comment", optional: "(optional)",
    addressCommentPlaceholder: "Example: 2nd floor, apartment to the right of the elevator...",
    dateTimeOfVisit: "Request/visit date and time",
    nurseArrivesAt: "The nurse will arrive at the specified time (±15 minutes)",
    symptoms: "Symptoms", symptomsPlaceholder: "Describe your symptoms for the nurse",
    symptomsHint: "This will help the nurse prepare for the visit",
    loadingBtn: "Loading...", continueBtn: "Continue →",
  },
  uz: {
    loadingMap: "Xarita yuklanmoqda...",
    receptionAddress: "Qabul manzili", startTypingAddress: "Manzilni kiritishni boshlang (ko'cha, uy)...",
    startTypingHint: "Tavsiyalarni olish uchun manzilni kiritishni boshlang",
    locationReceived: "Joylashuv aniqlandi", lookingOnMap: "Sizni xaritada qidirmoqdamiz...", useMyLocation: "Mening joylashuvimdan foydalanish",
    hideMap: "Xaritani yashirish", chooseOnMap: "Xaritadan tanlash",
    addressClarification: "Manzilni aniqlashtirish",
    apartment: "Kvartira", apartmentPlaceholder: "kv. 45",
    entrance: "Kirish", entrancePlaceholder: "1",
    intercom: "Domofon", intercomPlaceholder: "1234#",
    addressComment: "Manzilga izoh", optional: "(ixtiyoriy)",
    addressCommentPlaceholder: "Masalan: 2-qavat, lift o'ng tomonidagi kvartira...",
    dateTimeOfVisit: "Ariza/tashrif sanasi va vaqti",
    nurseArrivesAt: "Hamshira ko'rsatilgan vaqtda keladi (±15 daqiqa)",
    symptoms: "Simptomlar", symptomsPlaceholder: "Hamshira uchun simptomlaringizni tasvirlang",
    symptomsHint: "Bu hamshiraga tashrifga tayyorgarlik ko'rishga yordam beradi",
    loadingBtn: "Yuklanmoqda...", continueBtn: "Davom etish →",
  },
};

// Dynamically import YandexMap to avoid SSR issues
const YandexMap = dynamic(() => import("@/components/maps/YandexMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 md:h-80 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-[#3772ff] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm">Загрузка карты...</p>
      </div>
    </div>
  ),
});

interface Step1Props {
  address: string;
  apartment: string;
  entrance: string;
  intercom: string;
  addressComment: string;
  symptoms: string;
  appointmentTime: string;
  onChangeAddress: (val: string) => void;
  onChangeApartment: (val: string) => void;
  onChangeEntrance: (val: string) => void;
  onChangeIntercom: (val: string) => void;
  onChangeAddressComment: (val: string) => void;
  onChangeSymptoms: (val: string) => void;
  onChangeTime: (val: string) => void;
  onChangeCoordinates: (lat: number | null, lng: number | null) => void;
  onNext: () => void;
  loading?: boolean;
}

interface YandexSuggestion {
  title: {
    text: string;
  };
  subtitle?: {
    text: string;
  };
  address?: {
    formatted_address: string;
  };
  coords?: [number, number];
}

// Yandex API Keys
const YANDEX_GEOSUGGEST_KEY = "c5dd4ece-8085-4dd1-8040-119aa0a6e64a"; // Geosuggest API
const YANDEX_GEOCODER_KEY = "1f1bdb59-89d5-4568-b73d-b705aba93104"; // JavaScript API and Geocoder HTTP API
const YANDEX_JSAPI_KEY = "1f1bdb59-89d5-4568-b73d-b705aba93104"; // JavaScript API

// Default location (Almaty)
const DEFAULT_CENTER: [number, number] = [43.238293, 76.889709];

const Step1: React.FC<Step1Props> = ({
  address,
  apartment,
  entrance,
  intercom,
  addressComment,
  symptoms,
  appointmentTime,
  onChangeAddress,
  onChangeApartment,
  onChangeEntrance,
  onChangeIntercom,
  onChangeAddressComment,
  onChangeSymptoms,
  onChangeTime,
  onChangeCoordinates,
  onNext,
  loading = false,
}) => {
  const { language: uiLanguage } = useLanguage();
  const tt = STEP1_TEXT[uiLanguage as keyof typeof STEP1_TEXT] ?? STEP1_TEXT.ru;
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [locating, setLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Address autocomplete states
  const [suggestions, setSuggestions] = useState<YandexSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false); // Track if user is selecting from suggestions

  // Fetch address suggestions using Yandex Geosuggest API
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const [lat, lon] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : mapCenter;

      const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${YANDEX_GEOSUGGEST_KEY}&text=${encodeURIComponent(query)}&ll=${lon},${lat}&types=house,street,locality&results=10&lang=ru_RU&print_address=1`;

      const response = await fetch(url);
      const data = await response.json();

      console.log("Yandex Geosuggest Response:", data); // Debug log

      const formattedSuggestions: YandexSuggestion[] = await Promise.all(
        (data.results || []).map(async (result: any) => {
          // Get the full address text
          const addressText = result.title?.text || result.subtitle?.text || "";

          // Geocode to get coordinates
          const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${encodeURIComponent(addressText)}&format=json&lang=ru_RU`;

          try {
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();

            const geoObject = geocodeData.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
            if (geoObject) {
              const pos = geoObject.Point.pos.split(" ");
              const coords: [number, number] = [parseFloat(pos[1]), parseFloat(pos[0])];

              return {
                title: result.title || { text: addressText },
                subtitle: result.subtitle,
                address: result.address,
                coords: coords
              };
            }
          } catch (err) {
            console.error("Geocode error:", err);
          }

          return {
            title: result.title || { text: addressText },
            subtitle: result.subtitle,
            address: result.address
          };
        })
      );

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounce address input - ONLY re-fetch when address changes, NOT when map moves
  useEffect(() => {
    // Skip if user just selected from suggestions
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (address) {
        fetchAddressSuggestions(address);
      } else {
        // Clear suggestions if address is empty
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Remove userLocation and mapCenter from dependencies to prevent re-fetching

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: YandexSuggestion) => {
    // Mark that we're selecting to prevent re-fetching
    isSelectingRef.current = true;

    const selectedAddress = suggestion.address?.formatted_address || suggestion.title.text;
    onChangeAddress(selectedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    setFocusedSuggestionIndex(-1);

    // Use coordinates from suggestion (already fetched)
    if (suggestion.coords) {
      setMapCenter(suggestion.coords);
      setUserLocation({ lat: suggestion.coords[0], lng: suggestion.coords[1] });
      onChangeCoordinates(suggestion.coords[0], suggestion.coords[1]);
      setShowMap(true); // Auto-show map when address is selected
    } else {
      onChangeCoordinates(null, null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[focusedSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Request user's current location and reverse geocode
  const requestLocation = async () => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setMapCenter([coords.lat, coords.lng]);
          setLocationPermission("granted");
          onChangeCoordinates(coords.lat, coords.lng);

          // Reverse geocode to get address using Yandex Geocoder API
          try {
            const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_GEOCODER_KEY}&geocode=${coords.lng},${coords.lat}&format=json&lang=ru_RU&kind=house&results=1`;

            const response = await fetch(geocodeUrl);
            const data = await response.json();

            const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
            if (geoObject) {
              isSelectingRef.current = true;
              const detectedAddress = geoObject.metaDataProperty.GeocoderMetaData.text;
              onChangeAddress(detectedAddress);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
          }

          setLocating(false);
          setShowMap(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationPermission("denied");
          setLocating(false);
        }
      );
    }
  };

  // Handle address selection from map
  const handleMapAddressSelect = (selectedAddress: string, coords: [number, number]) => {
    // Mark that we're setting address programmatically
    isSelectingRef.current = true;
    onChangeAddress(selectedAddress);
    onChangeCoordinates(coords[0], coords[1]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Address Input Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#3772ff]" />
          {tt.receptionAddress} <span className="text-red-500">*</span>
        </label>

        {/* Address Input with Autocomplete */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={tt.startTypingAddress}
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            required
            className="w-full px-4 py-3 pl-10 pr-10 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          {/* Loading Indicator */}
          {loadingSuggestions && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3772ff] animate-spin" />
          )}

          {/* Clear Button */}
          {address && !loadingSuggestions && (
            <button
              type="button"
              onClick={() => {
                onChangeAddress("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
              >
                <div className="p-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 ${
                        focusedSuggestionIndex === index
                          ? "bg-[#3772ff] text-white"
                          : "hover:bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          focusedSuggestionIndex === index ? "text-white" : "text-[#3772ff]"
                        }`} />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${
                            focusedSuggestionIndex === index ? "text-white" : "text-gray-900"
                          }`}>
                            {suggestion.title.text}
                          </div>
                          {suggestion.subtitle?.text && (
                            <div className={`text-xs mt-0.5 ${
                              focusedSuggestionIndex === index ? "text-white/80" : "text-gray-500"
                            }`}>
                              {suggestion.subtitle.text}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {tt.startTypingHint}
        </p>

        {/* Location Helper Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {locationPermission !== "denied" && (
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationPermission === "granted" || locating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                locationPermission === "granted"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : locating
                  ? "bg-[#3772ff]/10 text-[#3772ff] border border-[#3772ff]/30 cursor-wait"
                  : "bg-[#3772ff]/5 text-[#3772ff] border border-[#3772ff]/20 hover:bg-[#3772ff]/10"
              }`}
            >
              {locationPermission === "granted" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {tt.locationReceived}
                </>
              ) : locating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tt.lookingOnMap}
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  {tt.useMyLocation}
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-all duration-200"
          >
            <MapPin className="w-4 h-4" />
            {showMap ? tt.hideMap : tt.chooseOnMap}
          </button>
        </div>

        {/* Yandex Map */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="relative w-full h-64 md:h-80 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300 shadow-lg">
                <YandexMap
                  onAddressSelect={handleMapAddressSelect}
                  initialAddress={address}
                  center={mapCenter}
                  zoom={userLocation ? 15 : 12}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-address details */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{tt.addressClarification}</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tt.apartment}</label>
              <input
                type="text"
                placeholder={tt.apartmentPlaceholder}
                value={apartment}
                onChange={(e) => onChangeApartment(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tt.entrance}</label>
              <input
                type="text"
                placeholder={tt.entrancePlaceholder}
                value={entrance}
                onChange={(e) => onChangeEntrance(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{tt.intercom}</label>
              <input
                type="text"
                placeholder={tt.intercomPlaceholder}
                value={intercom}
                onChange={(e) => onChangeIntercom(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              {tt.addressComment} <span className="text-gray-400 font-normal">{tt.optional}</span>
            </label>
            <input
              type="text"
              placeholder={tt.addressCommentPlaceholder}
              value={addressComment}
              onChange={(e) => onChangeAddressComment(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Date and Time Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#3772ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {tt.dateTimeOfVisit}<span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={appointmentTime}
          onChange={(e) => onChangeTime(e.target.value)}
          min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
          required
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
        />
        <p className="mt-2 text-xs text-gray-500">
          {tt.nurseArrivesAt}
        </p>
      </div>

      {/* Symptoms Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3">
          {tt.symptoms} <span className="text-gray-400 text-sm font-normal">{tt.optional}</span>
        </label>
        <textarea
          placeholder={tt.symptomsPlaceholder}
          rows={4}
          value={symptoms}
          onChange={(e) => onChangeSymptoms(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm resize-none focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
        />
        <p className="mt-2 text-xs text-gray-500">
          {tt.symptomsHint}
        </p>
      </div>

      {/* Next Button */}
      <div className="pt-2">
        <button
          onClick={onNext}
          disabled={!address.trim() || !appointmentTime || loading}
          className={`w-full px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-lg ${
            loading || !address.trim() || !appointmentTime
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:shadow-xl hover:shadow-[#3772ff]/30 hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {loading ? tt.loadingBtn : tt.continueBtn}
        </button>
      </div>
    </motion.div>
  );
};

export default Step1;
