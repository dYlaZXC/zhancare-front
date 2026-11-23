"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";

interface YandexMapProps {
  onAddressSelect: (address: string, coords: [number, number]) => void;
  initialAddress?: string;
  center?: [number, number];
  zoom?: number;
  controls?: string[];
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap: React.FC<YandexMapProps> = ({
  onAddressSelect,
  initialAddress,
  center = [43.238293, 76.889709],
  zoom = 12,
  controls = ["zoomControl", "geolocationControl", "searchControl"],
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // If ymaps was already loaded by a prior render, mark script as ready immediately
  useEffect(() => {
    if (typeof window !== "undefined" && window.ymaps) {
      setScriptLoaded(true);
    }
  }, []);

  // Keep latest callback in a ref so map init doesn't re-run when parent re-renders
  const onAddressSelectRef = useRef(onAddressSelect);
  useEffect(() => { onAddressSelectRef.current = onAddressSelect; }, [onAddressSelect]);

  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  const initialAddressRef = useRef(initialAddress);

  // Initialize map once when script becomes ready
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;

    const initMap = () => {
      if (!window.ymaps || !mapRef.current) return;

      window.ymaps.ready(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const map = new window.ymaps.Map(mapRef.current, {
          center: centerRef.current,
          zoom: zoomRef.current,
          controls,
        });

        mapInstanceRef.current = map;

        const placemark = new window.ymaps.Placemark(
          centerRef.current,
          {
            balloonContent: "Переместите метку на нужный адрес",
            iconCaption: "Ваш адрес",
          },
          {
            preset: "islands#blueDotIconWithCaption",
            draggable: true,
          }
        );

        placemarkRef.current = placemark;
        map.geoObjects.add(placemark);

        const getAddress = (coords: number[]) => {
          window.ymaps.geocode(coords).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            const addr = firstGeoObject.getAddressLine();
            placemark.properties.set({
              balloonContent: addr,
              iconCaption: addr.split(",")[0],
            });
            onAddressSelectRef.current(addr, [coords[0], coords[1]]);
          });
        };

        placemark.events.add("dragend", () => {
          getAddress(placemark.geometry.getCoordinates());
        });

        map.events.add("click", (e: any) => {
          const coords = e.get("coords");
          placemark.geometry.setCoordinates(coords);
          getAddress(coords);
        });

        if (initialAddressRef.current) {
          window.ymaps.geocode(initialAddressRef.current).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
              const coords = firstGeoObject.geometry.getCoordinates();
              map.setCenter(coords, zoomRef.current);
              placemark.geometry.setCoordinates(coords);
              placemark.properties.set({
                iconCaption: initialAddressRef.current!.split(",")[0],
              });
            }
          });
        }

        setIsLoading(false);
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded]);

  // Pan map when center prop changes (address selected from autocomplete)
  useEffect(() => {
    centerRef.current = center;
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center, zoom, { duration: 300 });
      if (placemarkRef.current) {
        placemarkRef.current.geometry.setCoordinates(center);
      }
    }
  }, [center, zoom]);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=1f1bdb59-89d5-4568-b73d-b705aba93104&lang=ru_RU"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="relative w-full h-full">
        {isLoading && scriptLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#3772ff] animate-spin" />
              <p className="text-sm text-gray-600">Загрузка карты...</p>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="w-full h-full rounded-xl"
          style={{ minHeight: "300px" }}
        />

        {/* Map instructions overlay */}
        {/* <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs md:text-sm">
          <p className="text-gray-700 font-medium">
            💡 <strong>Совет:</strong> Кликните на карту или перетащите метку для выбора адреса
          </p>
        </div> */}
      </div>
    </>
  );
};

export default YandexMap;
