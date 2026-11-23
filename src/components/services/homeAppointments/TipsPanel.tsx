"use client";

import React from "react";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface TipsPanelProps {
  step: 1 | 2 | 3;
  compact?: boolean;
}

const TIPS_BY_STEP = {
  ru: {
    usefulTips: "Полезные советы", followRecommendations: "💡 Следуйте этим рекомендациям для успешного вызова",
    1: {
      title: "Как правильно указать адрес и симптомы",
      tips: [
        "📍 Указывайте полный адрес: улица, дом, подъезд, этаж, квартира",
        "🗺️ Используйте карту для точного определения местоположения",
        "📋 Опишите основные симптомы: температура, кашель, боль и т.п.",
        "💊 Укажите хронические заболевания и принимаемые лекарства",
        "🚑 При экстренных случаях лучше вызвать скорую помощь 103",
      ],
    },
    2: {
      title: "Советы при выборе клиники",
      tips: [
        "🏥 Заявка уйдёт медсёстрам именно этой клиники",
        "📍 Выбирайте клинику поближе — так визит состоится быстрее",
        "☎️ Номер клиники можно уточнить в списке перед выбором",
        "🔄 Клинику можно сменить, пока не нажали «Продолжить»",
      ],
    },
    3: {
      title: "Перед подтверждением вызова",
      tips: [
        "✅ Проверьте все данные: адрес, дату, время, симптомы",
        "📲 После отправки вы получите SMS-подтверждение",
        "🔔 Врач получит уведомление автоматически",
        "💬 Будьте на связи по указанному телефону",
        "🚪 Подготовьте документы: паспорт, медицинская карта (если есть)",
      ],
    },
  },
  kz: {
    usefulTips: "Пайдалы кеңестер", followRecommendations: "💡 Шақыруды сәтті өткізу үшін осы ұсыныстарды орындаңыз",
    1: {
      title: "Мекенжай мен симптомдарды қалай дұрыс көрсету керек",
      tips: [
        "📍 Толық мекенжайды көрсетіңіз: көше, үй, кіреберіс, қабат, пәтер",
        "🗺️ Орналасқан жерді дәл анықтау үшін картаны пайдаланыңыз",
        "📋 Негізгі симптомдарды сипаттаңыз: температура, жөтел, ауырсыну және т.б.",
        "💊 Созылмалы аурулар мен қабылдайтын дәрі-дәрмектерді көрсетіңіз",
        "🚑 Жедел жағдайларда 103 жедел жәрдемге хабарласқан дұрыс",
      ],
    },
    2: {
      title: "Клиниканы таңдау бойынша кеңестер",
      tips: [
        "🏥 Өтінім дәл осы клиниканың медбикелеріне жіберіледі",
        "📍 Жақынырақ клиниканы таңдаңыз — визит тезірек болады",
        "☎️ Клиниканың нөмірін таңдаудан бұрын тізімнен көре аласыз",
        "🔄 «Жалғастыру» баспағанша клиниканы ауыстыруға болады",
      ],
    },
    3: {
      title: "Шақыруды растамас бұрын",
      tips: [
        "✅ Барлық деректерді тексеріңіз: мекенжай, күні, уақыты, симптомдар",
        "📲 Жібергеннен кейін сізге SMS-растау келеді",
        "🔔 Дәрігер хабарламаны автоматты түрде алады",
        "💬 Көрсетілген телефон арқылы байланыста болыңыз",
        "🚪 Құжаттарды дайындаңыз: жеке куәлік, медициналық карта (болса)",
      ],
    },
  },
  en: {
    usefulTips: "Useful tips", followRecommendations: "💡 Follow these recommendations for a successful call",
    1: {
      title: "How to correctly provide the address and symptoms",
      tips: [
        "📍 Provide the full address: street, house, entrance, floor, apartment",
        "🗺️ Use the map to pinpoint your location",
        "📋 Describe the main symptoms: fever, cough, pain, etc.",
        "💊 Mention any chronic conditions and medications you're taking",
        "🚑 For emergencies, it's better to call emergency services at 103",
      ],
    },
    2: {
      title: "Tips for choosing a clinic",
      tips: [
        "🏥 The request goes straight to that clinic's own nurses",
        "📍 Pick a clinic nearby — the visit will happen sooner",
        "☎️ You can check the clinic's phone number in the list before choosing",
        "🔄 You can change the clinic until you press \"Continue\"",
      ],
    },
    3: {
      title: "Before confirming the call",
      tips: [
        "✅ Check all the details: address, date, time, symptoms",
        "📲 You'll receive an SMS confirmation after submitting",
        "🔔 The doctor will be notified automatically",
        "💬 Stay reachable at the provided phone number",
        "🚪 Prepare documents: ID, medical card (if any)",
      ],
    },
  },
  uz: {
    usefulTips: "Foydali maslahatlar", followRecommendations: "💡 Muvaffaqiyatli chaqiruv uchun shu tavsiyalarga amal qiling",
    1: {
      title: "Manzil va simptomlarni qanday to'g'ri ko'rsatish kerak",
      tips: [
        "📍 To'liq manzilni ko'rsating: ko'cha, uy, kirish, qavat, kvartira",
        "🗺️ Joylashuvni aniq belgilash uchun xaritadan foydalaning",
        "📋 Asosiy simptomlarni tasvirlang: harorat, yo'tal, og'riq va h.k.",
        "💊 Surunkali kasalliklar va qabul qilinayotgan dorilarni ko'rsating",
        "🚑 Shoshilinch holatlarda 103 tez yordamga murojaat qiling",
      ],
    },
    2: {
      title: "Klinikani tanlash bo'yicha maslahatlar",
      tips: [
        "🏥 Ariza aynan shu klinikaning hamshiralariga yuboriladi",
        "📍 Yaqinroq klinikani tanlang — tashrif tezroq bo'ladi",
        "☎️ Klinika raqamini tanlashdan oldin ro'yxatda ko'rishingiz mumkin",
        "🔄 «Davom etish» tugmasini bosmaguningizcha klinikani almashtirish mumkin",
      ],
    },
    3: {
      title: "Chaqiruvni tasdiqlashdan oldin",
      tips: [
        "✅ Barcha ma'lumotlarni tekshiring: manzil, sana, vaqt, simptomlar",
        "📲 Yuborgandan keyin SMS-tasdiqlash olasiz",
        "🔔 Shifokor avtomatik xabardor qilinadi",
        "💬 Ko'rsatilgan telefon orqali aloqada bo'ling",
        "🚪 Hujjatlarni tayyorlang: pasport, tibbiy karta (mavjud bo'lsa)",
      ],
    },
  },
};

const TipsPanel: React.FC<TipsPanelProps> = ({ step, compact }) => {
  const { language: uiLanguage } = useLanguage();
  const tipsByStep = TIPS_BY_STEP[uiLanguage as keyof typeof TIPS_BY_STEP] ?? TIPS_BY_STEP.ru;
  const { title, tips } = tipsByStep[step];

  if (compact) {
    return (
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-800">{title}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {tips.slice(0, 3).map((tip, i) => (
            <span key={i} className="text-xs text-amber-700 leading-relaxed">
              {tip}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-6"
    >
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold text-base leading-tight">{title}</h3>
            <p className="text-amber-700 text-xs mt-1">{tipsByStep.usefulTips}</p>
          </div>
        </div>

        {/* Tips List */}
        <div className="space-y-2.5">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-sm text-amber-900 leading-relaxed"
            >
              <span className="text-base flex-shrink-0 mt-0.5">{tip.split(' ')[0]}</span>
              <span className="flex-1">{tip.substring(tip.indexOf(' ') + 1)}</span>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700 text-center">
            {tipsByStep.followRecommendations}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default TipsPanel;
