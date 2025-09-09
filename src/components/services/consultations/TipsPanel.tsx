"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, ClipboardPaste, X, ExternalLink } from "lucide-react";
import Image from "next/image";
import Logo7 from "@/assets/omron.png";
import Logo8 from "@/assets/astanamua.png";
import Logo9 from "@/assets/enactus2.png";

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
    // Two rotating banners with pagination
    {
      id: "omron",
      imagePath: Logo7,
      title: "OMRON",
      description: "Медицинское оборудование для дома",
      url: "https://www.omron-healthcare.kz/",
      alt: "OMRON medical equipment"
    },
    {
      id: "astnanamua",
      imagePath: Logo8,
      title: "Astana MUA",
      description: "Медицинский университет Астана – твой путь в профессию будущего!",
      url: "https://amu.edu.kz/",
      alt: "Astana MUA"
    },
    {
      id: "enactuskz",
      imagePath: Logo9,
      title: "Enactus Kazakhstan",
      description: "Предпринимательство на благо общества",
      url: "https://enactus.kz/",
      alt: "Enactus Kazakhstan"
    }
  ], // Two rotating banners
}) => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [closedAds, setClosedAds] = useState<Set<string>>(new Set());

  const closePopup = () => setPopupVisible(false);
  const openPopup = () => setPopupVisible(true);

  const fullAnalysisText = useMemo((): string => {
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
  }, [step, recommendedDoctor, aiErrorData, fallbackUsed]);

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      setPopupVisible(true);
    }
  }, [step]);

  // Typing animation for full response
  useEffect(() => {
    setTypingIndex(0);
    setAiTypingText("");

    if (!fullAnalysisText) return;

    const interval = setInterval(() => {
      setTypingIndex((prev) => {
        if (prev >= fullAnalysisText.length) {
          clearInterval(interval);
          return prev;
        }
        setAiTypingText(fullAnalysisText.slice(0, prev + 1));
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [fullAnalysisText]);

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

  const handleAdClick = useCallback((ad: AdBanner) => {
    if (ad.url) {
      window.open(ad.url, '_blank');
    }
  }, []);

  const handleCloseAd = useCallback((adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClosedAds(prev => new Set([...prev, adId]));
  }, []);

  const visibleAds = useMemo(() => adBanners.filter(ad => !closedAds.has(ad.id)), [adBanners, closedAds]);
  const currentAd = useMemo(() => visibleAds[currentAdIndex % visibleAds.length], [visibleAds, currentAdIndex]);

  // Auto-rotate ads every 5 seconds (pagination with rotation)
  useEffect(() => {
    if (visibleAds.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % visibleAds.length);
      }, 5000); // Rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [visibleAds.length]);

  const AdBannerComponent = useCallback(({ ad, showClose = true }: { ad: AdBanner; showClose?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
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
      <div className="relative aspect-[3/2] w-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-2">
        <div className="relative w-full h-full">
          <Image
            src={ad.imagePath}
            alt={ad.alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 200px, 300px"
          />
        </div>
      </div>
      
      {/* Text Section */}
      <div className="p-2 bg-white">
        {ad.title && (
          <h4 className="font-bold text-xs text-gray-900 mb-0.5">{ad.title}</h4>
        )}
        {ad.description && (
          <p className="text-xs text-gray-600 leading-tight line-clamp-2">{ad.description}</p>
        )}
      </div>
      
      {/* Hover Effect */}
      {ad.url && (
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors duration-300" />
      )}
    </motion.div>
  ), [handleAdClick, handleCloseAd]);

  return (
    <>
      {/* Mobile Popup */}
      <AnimatePresence>
        {isPopupVisible && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center lg:hidden p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm mx-auto p-3 rounded-2xl shadow-xl space-y-2 relative"
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-gray-800 font-semibold text-sm">
                  <Bot className="text-blue-600" size={16} />
                  🤖 Помощь AI
                </div>
                <button
                  onClick={closePopup}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Закрыть"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              <div className="text-xs text-gray-700 space-y-2">{getTipsContent()}</div>
              {step === 2 && (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-md text-xs text-gray-600 whitespace-pre-line">
                  {aiTypingText}
                </div>
              )}

              {/* Mobile Ads with Pagination */}
              {visibleAds.length > 0 && currentAd && (
                <div className="space-y-2">
                  <hr className="border-gray-200" />
                  <div className="text-xs text-gray-500 font-medium flex items-center justify-between">
                    <span>Реклама</span>
                    {visibleAds.length > 1 && (
                      <span className="text-gray-400 text-xs">
                        {currentAdIndex + 1} / {visibleAds.length}
                      </span>
                    )}
                  </div>
                  <div className="w-full">
                    <AdBannerComponent ad={currentAd} showClose={false} />
                  </div>
                  
                  {/* Mobile Pagination */}
                  {visibleAds.length > 1 && (
                    <div className="flex justify-center items-center gap-1">
                      <button
                        onClick={() => setCurrentAdIndex((prev) => (prev - 1 + visibleAds.length) % visibleAds.length)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors touch-manipulation"
                        aria-label="Previous ad"
                      >
                        <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1L1 5l4 4"/>
                        </svg>
                      </button>
                      
                      <div className="flex gap-1 px-2">
                        {visibleAds.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentAdIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                              index === currentAdIndex ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            aria-label={`Go to ad ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentAdIndex((prev) => (prev + 1) % visibleAds.length)}
                        className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors touch-manipulation"
                        aria-label="Next ad"
                      >
                        <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 9l4-4-4-4"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Panel */}
      <div className="hidden md:block w-full max-w-sm space-y-3 md:space-y-4">
        {/* Tips Panel */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-sm text-gray-700 sticky top-6 space-y-4 md:space-y-5">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm md:text-base">
            <Bot className="text-blue-600" size={18} />
            Помощь AI
          </div>

          <div>{getTipsContent()}</div>

          <hr className="border-gray-200" />

          {step === 2 && (
            <div className="flex items-start gap-2 text-gray-500 text-xs md:text-sm whitespace-pre-line">
              <Loader2 className="animate-spin text-blue-500 mt-1" size={14} />
              <span className="font-mono">{aiTypingText || "Анализ..."}</span>
            </div>
          )}
          
          {/* Quick Facts Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-xs md:text-sm">💡 Полезная информация</h4>
            <div className="space-y-1 md:space-y-2 text-xs text-gray-600">
              {step === 1 && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Укажите продолжительность симптомов</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Опишите интенсивность боли от 1 до 10</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Добавьте сопутствующие симптомы</span>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>AI анализирует ваши симптомы</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Вы можете выбрать другого врача</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Все врачи сертифицированы</span>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Консультация длится до 30 минут</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>Врач может выписать рецепт</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>История консультаций сохраняется</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-800 text-xs md:text-sm mb-2">📊 Сегодня на платформе</h4>
            <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs">
              <div className="text-center">
                <div className="font-bold text-blue-600 text-base md:text-lg">120+</div>
                <div className="text-blue-500">Врачей онлайн</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600 text-base md:text-lg">95%</div>
                <div className="text-green-500">Довольных пациентов</div>
              </div>
            </div>
          </div>

          {/* Advertisement Banners - Paginated Rotation - PRIORITY SECTION */}
          {visibleAds.length > 0 && currentAd && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 font-medium flex items-center justify-between">
                <span>Реклама</span>
                {visibleAds.length > 1 && (
                  <span className="text-gray-300 text-xs">
                    {currentAdIndex + 1} / {visibleAds.length}
                  </span>
                )}
              </div>
              
              {/* Always use smooth animation for banner transitions */}
              <AnimatePresence mode="wait">
                <AdBannerComponent key={`ad-${currentAd.id}`} ad={currentAd} />
              </AnimatePresence>
              
              {/* Pagination Dots - show if multiple ads */}
              {visibleAds.length > 1 && (
                <div className="flex justify-center items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentAdIndex((prev) => (prev - 1 + visibleAds.length) % visibleAds.length)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Previous ad"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1L1 5l4 4"/>
                    </svg>
                  </button>
                  
                  {/* Pagination dots */}
                  <div className="flex gap-1">
                    {visibleAds.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAdIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentAdIndex 
                            ? 'bg-blue-500 scale-110' 
                            : 'bg-gray-300 hover:bg-gray-400 hover:scale-105'
                        }`}
                        aria-label={`Go to ad ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Next button */}
                  <button
                    onClick={() => setCurrentAdIndex((prev) => (prev + 1) % visibleAds.length)}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    aria-label="Next ad"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 9l4-4-4-4"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3">
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-sm">🔒</span>
              <div className="text-xs text-green-700">
                <div className="font-medium mb-1">Ваши данные защищены</div>
                <div>Все консультации проходят по защищенному соединению</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow-sm">
            <h4 className="font-bold text-red-800 text-xs md:text-sm mb-2 flex items-center gap-2">
              🚨 Экстренная помощь
            </h4>
            <p className="text-xs text-red-700 mb-2">
              При серьёзных симптомах немедленно обратитесь в скорую помощь
            </p>
            <div className="text-center">
              <a href="tel:103" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                📞 103
              </a>
            </div>
          </div>

          {/* FAQ Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-lg md:rounded-xl shadow-md p-2 md:p-3">
            <h4 className="font-bold text-gray-800 text-xs md:text-sm mb-2">❓ Часто задаваемые вопросы</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-700 hover:text-blue-600">Сколько стоит консультация?</summary>
                <p className="mt-1 pl-2 border-l-2 border-blue-200">Первая консультация бесплатная. Последующие - от 2000 тенге.</p>
              </details>
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-700 hover:text-blue-600">Как долго длится консультация?</summary>
                <p className="mt-1 pl-2 border-l-2 border-blue-200">Обычно 15-30 минут в зависимости от сложности случая.</p>
              </details>
              <details className="cursor-pointer">
                <summary className="font-medium text-gray-700 hover:text-blue-600">Можно ли получить рецепт?</summary>
                <p className="mt-1 pl-2 border-l-2 border-blue-200">Да, врач может выписать электронный рецепт после консультации.</p>
              </details>
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow-sm">
            <h4 className="font-bold text-purple-800 text-xs md:text-sm mb-2">💬 Нужна помощь?</h4>
            <p className="text-xs text-purple-700 mb-2">
              Наша служба поддержки работает 24/7
            </p>
            <div className="flex gap-1.5">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                Чат
              </button>
              <button className="flex-1 bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipsPanel;