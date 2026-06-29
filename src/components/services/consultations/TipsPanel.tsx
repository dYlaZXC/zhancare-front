"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, ClipboardPaste, X, ExternalLink } from "lucide-react";
import Image from "next/image";
import Logo7 from "@/assets/omron.png";
import Logo8 from "@/assets/astanamua.png";
import Logo9 from "@/assets/enactus2.png";
import { useLanguage } from "@/context/LanguageContext";

const TIPS_TEXT = {
  ru: {
    helpAi: "Помощь AI", close: "Закрыть",
    step1Tip: "Укажите как можно больше деталей о симптомах. Это поможет AI подобрать лучшего врача.",
    step1Example: "Пример: У меня температура 38.5, слабость, боль в горле уже третий день.",
    insertExample: "Вставить пример",
    step2Tip: "AI анализирует симптомы и предлагает врача на их основе.",
    step2TipSub: "При необходимости вы можете выбрать другого специалиста.",
    step3Tip: "Проверяем подключение к выбранному врачу. Обычно ожидание не превышает 1–2 минут.",
    analyzing: "Анализ...",
    analyzingSymptoms: "Анализируем введённые симптомы...",
    preparingConnection: "Готовим безопасное соединение с врачом...",
    aiNoSpecialty: (specialty: string, name: string, type: string) => `AI не нашёл врача по направлению «${specialty}», поэтому предложен врач: ${name} (${type}).`,
    aiRecommended: (name: string, type: string) => `AI рекомендовал врача: ${name} (${type}).`,
    aiSpecialtyOnly: (specialty: string) => `AI порекомендовал направление «${specialty}», но подходящий врач не найден.`,
    reason: "Причина:", explanation: "Пояснение:",
    usefulInfo: "Полезная информация",
    tipsStep1: ["Укажите продолжительность симптомов", "Опишите интенсивность боли от 1 до 10", "Добавьте сопутствующие симптомы"],
    tipsStep2: ["AI анализирует ваши симптомы", "Вы можете выбрать другого врача", "Все врачи сертифицированы"],
    tipsStep3: ["Консультация длится до 30 минут", "Врач может выписать рецепт", "История консультаций сохраняется"],
    todayOnPlatform: "Сегодня на платформе",
    doctorsOnline: "Врачей онлайн", happyPatients: "Довольных пациентов",
    ad: "Реклама",
    dataProtected: "Ваши данные защищены",
    securedConnection: "Все консультации проходят по защищенному соединению",
    emergencyHelp: "Экстренная помощь",
    emergencyDesc: "При серьёзных симптомах немедленно обратитесь в скорую помощь",
    faq: "Часто задаваемые вопросы",
    faqItems: [
      { q: "Сколько стоит консультация?", a: "Первая консультация бесплатная. Последующие - от 2000 тенге." },
      { q: "Как долго длится консультация?", a: "Обычно 15-30 минут в зависимости от сложности случая." },
      { q: "Можно ли получить рецепт?", a: "Да, врач может выписать электронный рецепт после консультации." },
    ],
    needHelp: "Нужна помощь?", supportWorks: "Наша служба поддержки работает 24/7",
    chat: "Чат", email: "Email",
  },
  kz: {
    helpAi: "AI көмекшісі", close: "Жабу",
    step1Tip: "Симптомдар туралы мүмкіндігінше көп мәлімет беріңіз. Бұл AI-ге үздік дәрігерді таңдауға көмектеседі.",
    step1Example: "Мысалы: Менің температурам 38.5, әлсіздік, тамағым ауырады үшінші күн.",
    insertExample: "Мысал қою",
    step2Tip: "AI симптомдарды талдап, соған сай дәрігерді ұсынады.",
    step2TipSub: "Қажет болса, басқа маманды таңдай аласыз.",
    step3Tip: "Таңдалған дәрігерге қосылуды тексереміз. Әдетте күту 1–2 минуттан аспайды.",
    analyzing: "Талдау...",
    analyzingSymptoms: "Енгізілген симптомдарды талдаймыз...",
    preparingConnection: "Дәрігермен қауіпсіз байланыс дайындаймыз...",
    aiNoSpecialty: (specialty: string, name: string, type: string) => `AI «${specialty}» бағыты бойынша дәрігер таппады, сондықтан ұсынылды: ${name} (${type}).`,
    aiRecommended: (name: string, type: string) => `AI дәрігерді ұсынды: ${name} (${type}).`,
    aiSpecialtyOnly: (specialty: string) => `AI «${specialty}» бағытын ұсынды, бірақ сәйкес дәрігер табылмады.`,
    reason: "Себеп:", explanation: "Түсіндірме:",
    usefulInfo: "Пайдалы ақпарат",
    tipsStep1: ["Симптомдардың ұзақтығын көрсетіңіз", "Ауырсыну қарқындылығын 1-ден 10-ға дейін сипаттаңыз", "Қосымша симптомдарды қосыңыз"],
    tipsStep2: ["AI симптомдарыңызды талдайды", "Басқа дәрігерді таңдауға болады", "Барлық дәрігерлер сертификатталған"],
    tipsStep3: ["Кеңес 30 минутқа дейін созылады", "Дәрігер рецепт жаза алады", "Кеңестер тарихы сақталады"],
    todayOnPlatform: "Бүгін платформада",
    doctorsOnline: "Онлайн дәрігерлер", happyPatients: "Көңілі толған пациенттер",
    ad: "Жарнама",
    dataProtected: "Деректеріңіз қорғалған",
    securedConnection: "Барлық кеңестер қорғалған байланыс арқылы өтеді",
    emergencyHelp: "Жедел көмек",
    emergencyDesc: "Ауыр симптомдар кезінде дереу жедел жәрдемге хабарласыңыз",
    faq: "Жиі қойылатын сұрақтар",
    faqItems: [
      { q: "Кеңес қанша тұрады?", a: "Бірінші кеңес тегін. Келесілері - 2000 теңгеден бастап." },
      { q: "Кеңес қанша уақыт жалғасады?", a: "Әдетте жағдайдың күрделілігіне байланысты 15-30 минут." },
      { q: "Рецепт алуға болады ма?", a: "Иә, дәрігер кеңестен кейін электрондық рецепт жаза алады." },
    ],
    needHelp: "Көмек керек пе?", supportWorks: "Біздің қолдау қызметі 24/7 жұмыс істейді",
    chat: "Чат", email: "Email",
  },
  en: {
    helpAi: "AI Assistant", close: "Close",
    step1Tip: "Provide as many details about your symptoms as possible. This will help AI find the best doctor.",
    step1Example: "Example: I have a temperature of 38.5, weakness, sore throat for the third day.",
    insertExample: "Insert example",
    step2Tip: "AI analyzes your symptoms and suggests a doctor based on them.",
    step2TipSub: "You can choose a different specialist if needed.",
    step3Tip: "Checking the connection to your selected doctor. The wait is usually no more than 1–2 minutes.",
    analyzing: "Analyzing...",
    analyzingSymptoms: "Analyzing the symptoms you entered...",
    preparingConnection: "Preparing a secure connection with the doctor...",
    aiNoSpecialty: (specialty: string, name: string, type: string) => `AI didn't find a doctor in the "${specialty}" specialty, so this doctor was suggested instead: ${name} (${type}).`,
    aiRecommended: (name: string, type: string) => `AI recommended a doctor: ${name} (${type}).`,
    aiSpecialtyOnly: (specialty: string) => `AI recommended the "${specialty}" specialty, but no suitable doctor was found.`,
    reason: "Reason:", explanation: "Explanation:",
    usefulInfo: "Useful information",
    tipsStep1: ["Specify how long the symptoms have lasted", "Describe pain intensity from 1 to 10", "Add any accompanying symptoms"],
    tipsStep2: ["AI is analyzing your symptoms", "You can choose a different doctor", "All doctors are certified"],
    tipsStep3: ["The consultation lasts up to 30 minutes", "The doctor can issue a prescription", "Consultation history is saved"],
    todayOnPlatform: "Today on the platform",
    doctorsOnline: "Doctors online", happyPatients: "Satisfied patients",
    ad: "Ad",
    dataProtected: "Your data is protected",
    securedConnection: "All consultations run over a secure connection",
    emergencyHelp: "Emergency help",
    emergencyDesc: "For serious symptoms, contact emergency services immediately",
    faq: "Frequently asked questions",
    faqItems: [
      { q: "How much does a consultation cost?", a: "The first consultation is free. Subsequent ones start at 2000 tenge." },
      { q: "How long does a consultation last?", a: "Usually 15-30 minutes depending on the complexity of the case." },
      { q: "Can I get a prescription?", a: "Yes, the doctor can issue an electronic prescription after the consultation." },
    ],
    needHelp: "Need help?", supportWorks: "Our support team works 24/7",
    chat: "Chat", email: "Email",
  },
  uz: {
    helpAi: "AI yordamchisi", close: "Yopish",
    step1Tip: "Simptomlar haqida imkon qadar ko'proq ma'lumot bering. Bu AI'ga eng yaxshi shifokorni tanlashga yordam beradi.",
    step1Example: "Masalan: Haroratim 38.5, holsizlik, tomoq og'rig'i uchinchi kun bo'ldi.",
    insertExample: "Misol qo'shish",
    step2Tip: "AI simptomlarni tahlil qilib, shularga asoslanib shifokorni taklif qiladi.",
    step2TipSub: "Zarur bo'lsa, boshqa mutaxassisni tanlashingiz mumkin.",
    step3Tip: "Tanlangan shifokorga ulanish tekshirilmoqda. Odatda kutish 1–2 daqiqadan oshmaydi.",
    analyzing: "Tahlil qilinmoqda...",
    analyzingSymptoms: "Kiritilgan simptomlar tahlil qilinmoqda...",
    preparingConnection: "Shifokor bilan xavfsiz aloqa tayyorlanmoqda...",
    aiNoSpecialty: (specialty: string, name: string, type: string) => `AI «${specialty}» yo'nalishi bo'yicha shifokor topa olmadi, shuning uchun taklif etildi: ${name} (${type}).`,
    aiRecommended: (name: string, type: string) => `AI shifokorni tavsiya qildi: ${name} (${type}).`,
    aiSpecialtyOnly: (specialty: string) => `AI «${specialty}» yo'nalishini tavsiya qildi, ammo mos shifokor topilmadi.`,
    reason: "Sabab:", explanation: "Tushuntirish:",
    usefulInfo: "Foydali ma'lumot",
    tipsStep1: ["Simptomlar davomiyligini ko'rsating", "Og'riq kuchini 1 dan 10 gacha tasvirlang", "Qo'shimcha simptomlarni qo'shing"],
    tipsStep2: ["AI simptomlaringizni tahlil qilmoqda", "Boshqa shifokorni tanlashingiz mumkin", "Barcha shifokorlar sertifikatlangan"],
    tipsStep3: ["Konsultatsiya 30 daqiqagacha davom etadi", "Shifokor retsept yozishi mumkin", "Konsultatsiya tarixi saqlanadi"],
    todayOnPlatform: "Bugun platformada",
    doctorsOnline: "Onlayn shifokorlar", happyPatients: "Mamnun bemorlar",
    ad: "Reklama",
    dataProtected: "Ma'lumotlaringiz himoyalangan",
    securedConnection: "Barcha konsultatsiyalar xavfsiz aloqa orqali o'tadi",
    emergencyHelp: "Shoshilinch yordam",
    emergencyDesc: "Jiddiy simptomlar bo'lsa, darhol tez yordamga murojaat qiling",
    faq: "Tez-tez so'raladigan savollar",
    faqItems: [
      { q: "Konsultatsiya qancha turadi?", a: "Birinchi konsultatsiya bepul. Keyingilari - 2000 tengedan boshlanadi." },
      { q: "Konsultatsiya qancha davom etadi?", a: "Odatda holatning murakkabligiga qarab 15-30 daqiqa." },
      { q: "Retsept olish mumkinmi?", a: "Ha, shifokor konsultatsiyadan keyin elektron retsept yozishi mumkin." },
    ],
    needHelp: "Yordam kerakmi?", supportWorks: "Bizning qo'llab-quvvatlash xizmatimiz 24/7 ishlaydi",
    chat: "Chat", email: "Email",
  },
};

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

const AD_DESCRIPTIONS = {
  ru: {
    omron: "Медицинское оборудование для дома",
    astanamua: "Медицинский университет Астана – твой путь в профессию будущего!",
    enactus: "Предпринимательство на благо общества",
  },
  kz: {
    omron: "Үй үшін медициналық жабдықтар",
    astanamua: "Астана медицина университеті – болашақ мамандығыңа жол!",
    enactus: "Қоғам игілігі үшін кәсіпкерлік",
  },
  en: {
    omron: "Medical equipment for the home",
    astanamua: "Astana Medical University — your path to the profession of the future!",
    enactus: "Entrepreneurship for the benefit of society",
  },
  uz: {
    omron: "Uy uchun tibbiy uskunalar",
    astanamua: "Astana tibbiyot universiteti – kelajak kasbiga yo'lingiz!",
    enactus: "Jamiyat manfaati uchun tadbirkorlik",
  },
};

const TipsPanel: React.FC<Props> = ({
  step,
  onInsertExample,
  recommendedDoctor,
  aiErrorData,
  fallbackUsed,
  adBanners,
}) => {
  const { language } = useLanguage();
  const tt = TIPS_TEXT[language as keyof typeof TIPS_TEXT] ?? TIPS_TEXT.ru;
  const adText = AD_DESCRIPTIONS[language as keyof typeof AD_DESCRIPTIONS] ?? AD_DESCRIPTIONS.ru;
  const resolvedAdBanners: AdBanner[] = adBanners ?? [
    {
      id: "omron",
      imagePath: Logo7,
      title: "OMRON",
      description: adText.omron,
      url: "https://www.omron-healthcare.kz/",
      alt: "OMRON medical equipment"
    },
    {
      id: "astnanamua",
      imagePath: Logo8,
      title: "Astana MUA",
      description: adText.astanamua,
      url: "https://amu.edu.kz/",
      alt: "Astana MUA"
    },
    {
      id: "enactuskz",
      imagePath: Logo9,
      title: "Enactus Kazakhstan",
      description: adText.enactus,
      url: "https://enactus.kz/",
      alt: "Enactus Kazakhstan"
    }
  ];
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
        return `${tt.aiNoSpecialty(aiErrorData.specialty, recommendedDoctor.name, recommendedDoctor.doctor_type)}
${tt.reason} ${recommendedDoctor.reason}

${tt.explanation} ${aiErrorData.reason}`;
      } else if (recommendedDoctor) {
        return `${tt.aiRecommended(recommendedDoctor.name, recommendedDoctor.doctor_type)}
${tt.explanation} ${recommendedDoctor.reason}`;
      } else if (aiErrorData) {
        return `${tt.aiSpecialtyOnly(aiErrorData.specialty)}
${tt.explanation} ${aiErrorData.reason}`;
      }
    }

    if (step === 1) {
      return tt.analyzingSymptoms;
    }

    if (step === 3) {
      return tt.preparingConnection;
    }

    return "";
  }, [step, recommendedDoctor, aiErrorData, fallbackUsed, tt]);

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
            {tt.step1Tip}
          </p>
          <p className="text-xs text-gray-500 italic">
            {tt.step1Example}
          </p>
          {onInsertExample && (
            <button
              onClick={onInsertExample}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ClipboardPaste size={16} />
              {tt.insertExample}
            </button>
          )}
        </>
      );
    }

    if (step === 2) {
      return (
        <p>
          {tt.step2Tip} <br />
          <span className="text-xs text-gray-500">
            {tt.step2TipSub}
          </span>
        </p>
      );
    }

    if (step === 3) {
      return (
        <p>
          {tt.step3Tip}
        </p>
      );
    }

    return null;
  };

  const handleAdClick = useCallback((ad: AdBanner) => {
    if (ad.url) {
      window.open(ad.url);
    }
  }, []);

  const handleCloseAd = useCallback((adId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClosedAds(prev => new Set([...prev, adId]));
  }, []);

  const visibleAds = useMemo(() => resolvedAdBanners.filter(a => !closedAds.has(a.id)), [resolvedAdBanners, closedAds]);
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
                  🤖 {tt.helpAi}
                </div>
                <button
                  onClick={closePopup}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label={tt.close}
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
                    <span>{tt.ad}</span>
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
            {tt.helpAi}
          </div>

          <div>{getTipsContent()}</div>

          <hr className="border-gray-200" />

          {step === 2 && (
            <div className="flex items-start gap-2 text-gray-500 text-xs md:text-sm whitespace-pre-line">
              <Loader2 className="animate-spin text-blue-500 mt-1" size={14} />
              <span className="font-mono">{aiTypingText || tt.analyzing}</span>
            </div>
          )}

          {/* Quick Facts Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-xs md:text-sm">💡 {tt.usefulInfo}</h4>
            <div className="space-y-1 md:space-y-2 text-xs text-gray-600">
              {step === 1 && (
                <>
                  {tt.tipsStep1.map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </>
              )}
              {step === 2 && (
                <>
                  {tt.tipsStep2.map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </>
              )}
              {step === 3 && (
                <>
                  {tt.tipsStep3.map((tip) => (
                    <div key={tip} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Statistics Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 md:p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-800 text-xs md:text-sm mb-2">📊 {tt.todayOnPlatform}</h4>
            <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs">
              <div className="text-center">
                <div className="font-bold text-blue-600 text-base md:text-lg">120+</div>
                <div className="text-blue-500">{tt.doctorsOnline}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600 text-base md:text-lg">95%</div>
                <div className="text-green-500">{tt.happyPatients}</div>
              </div>
            </div>
          </div>

          {/* Advertisement Banners - Paginated Rotation - PRIORITY SECTION */}
          {visibleAds.length > 0 && currentAd && (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 font-medium flex items-center justify-between">
                <span>{tt.ad}</span>
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
                <div className="font-medium mb-1">{tt.dataProtected}</div>
                <div>{tt.securedConnection}</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow-sm">
            <h4 className="font-bold text-red-800 text-xs md:text-sm mb-2 flex items-center gap-2">
              🚨 {tt.emergencyHelp}
            </h4>
            <p className="text-xs text-red-700 mb-2">
              {tt.emergencyDesc}
            </p>
            <div className="text-center">
              <a href="tel:103" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                📞 103
              </a>
            </div>
          </div>

          {/* FAQ Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-lg md:rounded-xl shadow-md p-2 md:p-3">
            <h4 className="font-bold text-gray-800 text-xs md:text-sm mb-2">❓ {tt.faq}</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {tt.faqItems.map((item) => (
                <details key={item.q} className="cursor-pointer">
                  <summary className="font-medium text-gray-700 hover:text-blue-600">{item.q}</summary>
                  <p className="mt-1 pl-2 border-l-2 border-blue-200">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Contact Support Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg md:rounded-xl p-2 md:p-3 shadow-sm">
            <h4 className="font-bold text-purple-800 text-xs md:text-sm mb-2">💬 {tt.needHelp}</h4>
            <p className="text-xs text-purple-700 mb-2">
              {tt.supportWorks}
            </p>
            <div className="flex gap-1.5">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {tt.chat}
              </button>
              <button className="flex-1 bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors">
                {tt.email}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipsPanel;