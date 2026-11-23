"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2, Navigation, Clock, MapPin, AlertCircle } from "lucide-react";

const YANDEX_KEY = "1f1bdb59-89d5-4568-b73d-b705aba93104";

interface NurseRouteMapProps {
  patientAddress: string;
  patientLat?: number | null;
  patientLng?: number | null;
  /** When provided, auto-builds route from this position (patient view — no geolocation needed) */
  nurseStartLat?: number | null;
  nurseStartLng?: number | null;
  onRouteReady?: (info: { distance: string; duration: string; nurseLat: number; nurseLng: number }) => void;
}

const NurseRouteMap: React.FC<NurseRouteMapProps> = ({
  patientAddress,
  patientLat,
  patientLng,
  nurseStartLat,
  nurseStartLng,
  onRouteReady,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [nurseCoords, setNurseCoords] = useState<[number, number] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; time: string } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const readOnly = !!(nurseStartLat && nurseStartLng);

  // If ymaps already loaded from prior render
  useEffect(() => {
    if (typeof window !== "undefined" && window.ymaps) {
      setScriptLoaded(true);
    }
  }, []);

  // Init base map once script is ready
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;

    const init = () => {
      if (!window.ymaps || !mapRef.current) return;
      window.ymaps.ready(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
        }
        const map = new window.ymaps.Map(mapRef.current, {
          center: patientLat && patientLng
            ? [patientLat, patientLng]
            : [43.238293, 76.889709],
          zoom: 13,
          controls: ["zoomControl"],
        });
        mapInstanceRef.current = map;
        setMapReady(true);

        // Drop patient pin immediately
        const pin = new window.ymaps.Placemark(
          patientLat && patientLng ? [patientLat, patientLng] : [43.238293, 76.889709],
          { iconCaption: "Пациент", balloonContent: patientAddress },
          { preset: "islands#redDotIconWithCaption" }
        );
        map.geoObjects.add(pin);

        // Geocode patient address if no coords
        if (!patientLat || !patientLng) {
          window.ymaps.geocode(patientAddress, { results: 1 }).then((res: any) => {
            const obj = res.geoObjects.get(0);
            if (obj) {
              const coords = obj.geometry.getCoordinates();
              pin.geometry.setCoordinates(coords);
              map.setCenter(coords, 14);
            }
          });
        }

        // Auto-build route if nurse start coords provided (patient view)
        if (nurseStartLat && nurseStartLng) {
          buildRoute([nurseStartLat, nurseStartLng], map);
        }
      });
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  const buildRoute = (nursePt: [number, number], mapOverride?: any) => {
    const map = mapOverride || mapInstanceRef.current;
    if (!map || !window.ymaps) return;

    map.geoObjects.removeAll();
    setRouteInfo(null);
    setRouteError(null);

    const destination = patientLat && patientLng
      ? [patientLat, patientLng]
      : patientAddress;

    const decodeHtml = (s: string) => s.replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");

    window.ymaps.route(
      [nursePt, destination],
      { routingMode: "auto" }
    ).then((route: any) => {
      map.geoObjects.add(route);

      const distance = decodeHtml(route.getHumanLength());
      const time = decodeHtml(route.getHumanTime());
      setRouteInfo({ distance, time });
      onRouteReady?.({ distance, duration: time, nurseLat: nursePt[0], nurseLng: nursePt[1] });

      try {
        const bounds = route.getBounds();
        if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
      } catch { /* ignore */ }

      const nurseCaption = readOnly ? "Медсестра" : "Вы";
      const nurseMark = new window.ymaps.Placemark(
        nursePt,
        { iconCaption: nurseCaption, balloonContent: nurseCaption },
        { preset: "islands#blueDotIconWithCaption" }
      );
      const patientPt = patientLat && patientLng ? [patientLat, patientLng] : null;
      const patientMark = new window.ymaps.Placemark(
        patientPt || nursePt,
        { iconCaption: "Пациент", balloonContent: patientAddress },
        { preset: "islands#redDotIconWithCaption" }
      );
      map.geoObjects.add(nurseMark);
      map.geoObjects.add(patientMark);
    }).catch(() => {
      setRouteError("Не удалось построить маршрут. Проверьте адрес.");
    });
  };

  const handleLocate = () => {
    setLocating(true);
    setRouteError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setNurseCoords(coords);
        setLocating(false);
        buildRoute(coords);
      },
      () => {
        setLocating(false);
        setRouteError("Не удалось получить ваше местоположение. Разрешите доступ к геолокации.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <Script
        src={`https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_KEY}&lang=ru_RU`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="flex flex-col h-full">
        {/* Route info bar — only shown in nurse mode (not patient/readOnly) */}
        {!readOnly && (
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 flex-shrink-0">
            {!nurseCoords ? (
              <button
                onClick={handleLocate}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#3772ff] to-[#2956bf] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:translate-y-0"
              >
                {locating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Определяем позицию...</>
                ) : (
                  <><Navigation className="w-4 h-4" /> Построить маршрут</>
                )}
              </button>
            ) : routeInfo ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-800">{routeInfo.distance}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-800">{routeInfo.time}</span>
                </div>
                <button
                  onClick={handleLocate}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
                >
                  Обновить
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Строим маршрут...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {routeError && !readOnly && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {routeError}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {(!scriptLoaded || !mapReady) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[#3772ff] animate-spin" />
                <p className="text-sm text-gray-500">Загрузка карты...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>
    </>
  );
};

export default NurseRouteMap;
