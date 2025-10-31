"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";

interface YandexMapProps {
  onAddressSelect: (address: string, coords: [number, number]) => void;
  initialAddress?: string;
  center?: [number, number];
  zoom?: number;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

const YandexMap: React.FC<YandexMapProps> = ({
  onAddressSelect,
  initialAddress,
  center = [43.238293, 76.889709], // Almaty, Kazakhstan by default
  zoom = 12,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;

    const initMap = () => {
      if (!window.ymaps || !mapRef.current) return;

      window.ymaps.ready(() => {
        // Create map instance
        const map = new window.ymaps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          controls: ["zoomControl", "geolocationControl", "searchControl"],
        });

        mapInstanceRef.current = map;

        // Create initial placemark
        const placemark = new window.ymaps.Placemark(
          center,
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

        // Handle placemark drag end
        placemark.events.add("dragend", () => {
          const coords = placemark.geometry.getCoordinates();
          getAddress(coords);
        });

        // Handle map click
        map.events.add("click", (e: any) => {
          const coords = e.get("coords");
          placemark.geometry.setCoordinates(coords);
          getAddress(coords);
        });

        // Get address from coordinates
        const getAddress = (coords: number[]) => {
          window.ymaps.geocode(coords).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            const address = firstGeoObject.getAddressLine();

            placemark.properties.set({
              balloonContent: address,
              iconCaption: address.split(",")[0],
            });

            onAddressSelect(address, [coords[0], coords[1]]);
          });
        };

        // If initial address provided, geocode it
        if (initialAddress) {
          window.ymaps.geocode(initialAddress).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
              const coords = firstGeoObject.geometry.getCoordinates();
              map.setCenter(coords, zoom);
              placemark.geometry.setCoordinates(coords);
              placemark.properties.set({
                iconCaption: initialAddress.split(",")[0],
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
      }
    };
  }, [scriptLoaded, center, zoom, initialAddress, onAddressSelect]);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU"
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
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs md:text-sm">
          <p className="text-gray-700 font-medium">
            💡 <strong>Совет:</strong> Кликните на карту или перетащите метку для выбора адреса
          </p>
        </div>
      </div>
    </>
  );
};

export default YandexMap;
