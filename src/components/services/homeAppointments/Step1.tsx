"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Search, CheckCircle, X, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

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
  symptoms: string;
  appointmentTime: string;
  onChangeAddress: (val: string) => void;
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
  symptoms,
  appointmentTime,
  onChangeAddress,
  onChangeSymptoms,
  onChangeTime,
  onChangeCoordinates,
  onNext,
  loading = false,
}) => {
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied">("prompt");
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
              // Mark that we're setting address programmatically
              isSelectingRef.current = true;

              const detectedAddress = geoObject.metaDataProperty.GeocoderMetaData.text;
              onChangeAddress(detectedAddress);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
          }

          // Automatically show map when location is granted
          setShowMap(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationPermission("denied");
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
          Адрес приёма <span className="text-red-500">*</span>
        </label>

        {/* Address Input with Autocomplete */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Начните вводить адрес (улица, дом)..."
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
          Начните вводить адрес для получения подсказок
        </p>

        {/* Location Helper Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {locationPermission !== "denied" && (
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationPermission === "granted"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                locationPermission === "granted"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-[#3772ff]/5 text-[#3772ff] border border-[#3772ff]/20 hover:bg-[#3772ff]/10"
              }`}
            >
              {locationPermission === "granted" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Местоположение получено
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Использовать моё местоположение
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
            {showMap ? "Скрыть карту" : "Выбрать на карте"}
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
      </div>

      {/* Date and Time Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#3772ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Дата и время визита <span className="text-red-500">*</span>
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
          Медсестра прибудет в указанное время (±15 минут)
        </p>
      </div>

      {/* Symptoms Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3">
          Симптомы <span className="text-gray-400 text-sm font-normal">(необязательно)</span>
        </label>
        <textarea
          placeholder="Опишите ваши симптомы для медсестры"
          rows={4}
          value={symptoms}
          onChange={(e) => onChangeSymptoms(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm resize-none focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
        />
        <p className="mt-2 text-xs text-gray-500">
          Это поможет медсестре подготовиться к визиту
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
          {loading ? "Загрузка..." : "Продолжить →"}
        </button>
      </div>
    </motion.div>
  );
};

export default Step1;
