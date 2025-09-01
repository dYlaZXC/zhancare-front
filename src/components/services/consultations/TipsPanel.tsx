"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, ClipboardPaste, X, ExternalLink } from "lucide-react";
import Image from "next/image";
import Logo7 from "@/assets/omron.png";
import Logo8 from "@/assets/respublica.png";

interface RecommendedDoctor {
  id: number;
  name: string;
  doctor_type: string;
  reason: string;
}

interface AIErrorData {
  specialty: string;
  reason: string;
  raw: string;
}

interface AdBanner {
  id: string;
  imagePath: string | any; // Allow both string paths and imported images
  title: string;
  description?: string;
  url?: string;
  alt: string;
}

interface Props {
  step: number;
  onInsertExample?: () => void;
  recommendedDoctor?: RecommendedDoctor;
  aiErrorData?: AIErrorData;
  fallbackUsed?: boolean;
  adBanners?: AdBanner[]; // New prop for ad banners
}

const TipsPanel: React.FC<Props> = ({
  step,
  onInsertExample,
  recommendedDoctor,
  aiErrorData,
  fallbackUsed,
  adBanners = [
    // Default banners using your imported images
    {
      id: "omron",
      imagePath: Logo7,
      title: "OMRON",
      description: "Медицинское оборудование для дома",
      url: "https://www.omron-healthcare.kz/",
      alt: "OMRON medical equipment"
    },
    {
      id: "respublica",
      imagePath: Logo8,
      title: "Respublica",
      description: "Голосуй за справедливый Казахстан",
      url: "https://respublica-partiyasy.kz/",
      alt: "Respublica pharmacy chain"
    }
  ], // Default banners with your logos
}) => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [closedAds, setClosedAds] = useState<Set<string>>(new Set());

  const closePopup = () => setPopupVisible(false);
  const openPopup = () => setPopupVisible(true);

  const getFullAnalysisText = (): string => {
    if (step === 2) {
      if (fallbackUsed && recommendedDoctor && aiErrorData) {
        return `AI не нашёл врача по направлению «${aiErrorData.specialty}», поэтому предложен врач: ${recommendedDoctor.name} (${recommendedDoctor.doctor_type}).
Причина: ${recommendedDoctor.reason}

Пояснение: ${aiErrorData.reason}`;
      } else if (recommendedDoctor) {
        return `AI рекомендовал врача: ${recommendedDoctor.name} (${recommendedDoctor.doctor_type}).
Пояснение: ${recommendedDoctor.reason}`;
      } else if (aiErrorData) {
        return `AI порекомендовал направление «${aiErrorData.specialty}», но подходящий врач не найден.
Пояснение: ${aiErrorData.reason}`;
      }
    }

    if (step === 1) {
      return "Анализируем введённые симптомы...";
    }

    if (step === 3) {
      return "Готовим безопасное соединение с врачом...";
    }

    return "";
  };

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      setPopupVisible(true);
    }
  }, [step]);

  // Typing animation for full response
  useEffect(() => {
    const fullText = getFullAnalysisText();
    setTypingIndex(0);
    setAiTypingText("");

    if (!fullText) return;

    const interval = setInterval(() => {
      setTypingIndex((prev) => {
        if (prev >= fullText.length) {
          clearInterval(interval);
          return prev;
        }
        setAiTypingText(fullText.slice(0, prev + 1));
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [step, recommendedDoctor, aiErrorData, fallbackUsed]);

  // Auto-rotate ads every 10 seconds
  useEffect(() => {
    if (adBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adBanners.length);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [adBanners.length]);

  const getTipsContent = () => {
    if (step === 1) {
      return (
        <>
          <p>
            Укажите как можно больше деталей о симптомах. Это поможет AI подобрать лучшего врача.
          </p>
          <p className="text-xs text-gray-500 italic">
            Пример: У меня температура 38.5, слабость, боль в горле уже третий день.
          </p>
          {onInsertExample && (
            <button
              onClick={onInsertExample}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ClipboardPaste size={16} />
              Вставить пример
            </button>
          )}
        </>
      );
    }

    if (step === 2) {
      return (
        <p>
          AI анализирует симптомы и предлагает врача на их основе. <br />
          <span className="text-xs text-gray-500">
            При необходимости вы можете выбрать другого специалиста.
          </span>
        </p>
      );
    }

    if (step === 3) {
      return (
        <p>
          Проверяем подключение к выбранному врачу. Обычно ожидание не превышает 1–2 минут.
        </p>
      );
    }

    return null;
  };

  const handleAdClick = (ad: AdBanner) => {
    if (ad.url) {
      window.open(ad.url, '_blank');
    }
  };

  const handleCloseAd = (adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClosedAds(prev => new Set([...prev, adId]));
  };

  const visibleAds = adBanners.filter(ad => !closedAds.has(ad.id));
  const currentAd = visibleAds[currentAdIndex % visibleAds.length];

  const AdBannerComponent = ({ ad, showClose = true }: { ad: AdBanner; showClose?: boolean }) => (
    <motion.div
      key={ad.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative bg-white rounded-lg border border-gray-200 overflow-hidden group ${
        ad.url ? 'cursor-pointer hover:shadow-md transition-all duration-300' : ''
      }`}
      onClick={() => handleAdClick(ad)}
    >
      {showClose && (
        <button
          onClick={(e) => handleCloseAd(ad.id, e)}
          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X size={12} className="text-gray-600" />
        </button>
      )}
      
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="relative w-full h-full">
          <Image
            src={ad.imagePath}
            alt={ad.alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      </div>
      
      {/* Text Section */}
      <div className="p-3 bg-white">
        {ad.title && (
          <h4 className="font-bold text-sm text-gray-900 mb-1">{ad.title}</h4>
        )}
        {ad.description && (
          <p className="text-xs text-gray-600 leading-relaxed">{ad.description}</p>
        )}
      </div>
      
      {/* Hover Effect */}
      {ad.url && (
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-300" />
      )}
    </motion.div>
  );

  return (
    <>
      {/* Mobile Popup */}
      <AnimatePresence>
        {isPopupVisible && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-11/12 max-w-md p-6 rounded-xl shadow-lg space-y-3 max-h-[90vh] overflow-y-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-gray-800 font-semibold text-base">
                <Bot className="text-blue-600" size={20} />
                🤖 Помощь AI
              </div>
              <div className="text-sm text-gray-700 space-y-3">{getTipsContent()}</div>
              {step === 2 && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-md text-xs text-gray-600 whitespace-pre-line">
                  {aiTypingText}
                </div>
              )}

              {/* Mobile Ads */}
              {visibleAds.length > 0 && currentAd && (
                <div className="space-y-3">
                  <hr className="border-gray-200" />
                  <div className="text-xs text-gray-500 font-medium">Реклама</div>
                  <AdBannerComponent ad={currentAd} showClose={false} />
                  {visibleAds.length > 1 && (
                    <div className="flex justify-center gap-1">
                      {visibleAds.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentAdIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentAdIndex ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                className="text-blue-600 hover:underline text-sm mt-2"
                onClick={closePopup}
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      <div className="hidden lg:block w-full max-w-sm space-y-4">
        {/* Tips Panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 text-sm text-gray-700 sticky top-6 space-y-5">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-base">
            <Bot className="text-blue-600" size={20} />
            Помощь AI
          </div>

          <div>{getTipsContent()}</div>

          <hr className="border-gray-200" />

          {step === 2 && (
            <div className="flex items-start gap-2 text-gray-500 text-sm whitespace-pre-line">
              <Loader2 className="animate-spin text-blue-500 mt-1" size={16} />
              <span className="font-mono">{aiTypingText || "Анализ..."}</span>
            </div>
          )}
        {/* Advertisement Banners - Integrated into the same panel */}
        {visibleAds.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-medium">Реклама</div>
            <AnimatePresence mode="wait">
              {currentAd && <AdBannerComponent ad={currentAd} />}
            </AnimatePresence>
            
            {/* Ad Navigation Dots */}
            {visibleAds.length > 1 && (
              <div className="flex justify-center gap-1">
                {visibleAds.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentAdIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default TipsPanel;