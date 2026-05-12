"use client";

import React, { useState, useEffect } from "react";
import { ImageIcon, Check, X } from "lucide-react";

const BANNERS = Array.from({ length: 7 }, (_, i) => `/profile-banners/banner${i + 1}.jpg`);
const STORAGE_KEY = (userId: number) => `profile_banner_${userId}`;

interface BannerPickerProps {
  userId: number;
  onBannerChange: (url: string | null) => void;
}

export function useBanner(userId: number | undefined) {
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const saved = localStorage.getItem(STORAGE_KEY(userId));
    setBanner(saved || null);
  }, [userId]);

  const saveBanner = (url: string | null) => {
    if (!userId) return;
    if (url) localStorage.setItem(STORAGE_KEY(userId), url);
    else localStorage.removeItem(STORAGE_KEY(userId));
    setBanner(url);
  };

  return { banner, saveBanner };
}

const BannerPicker: React.FC<BannerPickerProps> = ({ userId, onBannerChange }) => {
  const [open, setOpen] = useState(false);
  const { banner, saveBanner } = useBanner(userId);

  const select = (url: string) => {
    saveBanner(url);
    onBannerChange(url);
    setOpen(false);
  };

  const reset = () => {
    saveBanner(null);
    onBannerChange(null);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/20 hover:bg-white/10 transition-all"
        style={{ background: "rgba(255,255,255,0.12)" }}
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Баннер
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">Выберите баннер</h3>
                <p className="text-xs text-gray-400 mt-0.5">Фон для вашего профиля</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* No banner option */}
              <button
                onClick={reset}
                className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${!banner ? "border-blue-500 shadow-lg shadow-blue-200" : "border-gray-200 hover:border-gray-400"}`}
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-gray-500">По умолчанию</span>
                </div>
                {!banner && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>

              {BANNERS.map((url) => (
                <button
                  key={url}
                  onClick={() => select(url)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${banner === url ? "border-blue-500 shadow-lg shadow-blue-200" : "border-gray-200 hover:border-gray-400"}`}
                >
                  <img src={url} alt="banner" className="w-full h-full object-cover" />
                  {banner === url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerPicker;
