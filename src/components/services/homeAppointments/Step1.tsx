"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Search, CheckCircle, X } from "lucide-react";
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
  onChangeAddress: (val: string) => void;
  onChangeSymptoms: (val: string) => void;
  onNext: () => void;
  loading?: boolean;
}

const Step1: React.FC<Step1Props> = ({
  address,
  symptoms,
  onChangeAddress,
  onChangeSymptoms,
  onNext,
  loading = false,
}) => {
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [mapCenter, setMapCenter] = useState<[number, number]>([43.238293, 76.889709]); // Almaty default

  // Request user's current location
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setMapCenter([coords.lat, coords.lng]);
          setLocationPermission("granted");

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
    onChangeAddress(selectedAddress);
  };

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

        <div className="relative">
          <input
            type="text"
            placeholder="Введите адрес, где вас нужно принять"
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
            required
            className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

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

      {/* Symptoms Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm hover:border-[#3772ff] transition-colors duration-200">
        <label className="block text-base font-semibold text-gray-800 mb-3">
          Симптомы <span className="text-gray-400 text-sm font-normal">(необязательно)</span>
        </label>
        <textarea
          placeholder="Опишите ваши симптомы для более точного подбора специалиста"
          rows={4}
          value={symptoms}
          onChange={(e) => onChangeSymptoms(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-sm resize-none focus:outline-none focus:ring-4 focus:ring-[#3772ff]/20 focus:border-[#3772ff] transition-all duration-200"
        />
        <p className="mt-2 text-xs text-gray-500">
          Это поможет врачу подготовиться к визиту
        </p>
      </div>

      {/* Next Button */}
      <div className="pt-2">
        <button
          onClick={onNext}
          disabled={!address.trim() || loading}
          className={`w-full px-6 py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 shadow-lg ${
            loading || !address.trim()
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
