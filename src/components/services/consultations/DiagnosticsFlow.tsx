"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Calendar, Clock,
  FlaskConical, Scan, Heart, Brain, Bone, Eye, Baby, Microscope,
  Loader2, MapPin, Phone, Sparkles, RefreshCw,
} from "lucide-react";
import { api as axiosInstance } from "@/utils/axiosInstance";
import { getCurrencySymbol } from "@/utils/currency";
import { useLanguage } from "@/context/LanguageContext";
import { useConsultationPayment } from "@/components/payment/useConsultationPayment";

const CATEGORY_TEXT = {
  ru: {
    lab: { label: 'Анализы крови', sub: 'ОАК, биохимия, гормоны' },
    imaging: { label: 'Визуализация', sub: 'МРТ, КТ, рентген, УЗИ' },
    cardio: { label: 'Кардиология', sub: 'ЭКГ, холтер, ЭХОКГ' },
    neuro: { label: 'Неврология', sub: 'ЭЭГ, ЭМГ, УЗДГ' },
    ortho: { label: 'Ортопедия', sub: 'Денситометрия, рентген' },
    ophtha: { label: 'Офтальмология', sub: 'Осмотр, ОКТ, поля зрения' },
    peds: { label: 'Педиатрия', sub: 'Скрининг, анализы' },
    micro: { label: 'Микробиология', sub: 'Посев, ПЦР, антигены' },
  },
  kz: {
    lab: { label: 'Қан анализдері', sub: 'ЖҮА, биохимия, гормондар' },
    imaging: { label: 'Бейнелеу', sub: 'МРТ, КТ, рентген, УДЗ' },
    cardio: { label: 'Кардиология', sub: 'ЭКГ, холтер, ЭХОКГ' },
    neuro: { label: 'Неврология', sub: 'ЭЭГ, ЭМГ, УДДГ' },
    ortho: { label: 'Ортопедия', sub: 'Денситометрия, рентген' },
    ophtha: { label: 'Офтальмология', sub: 'Қарау, ОКТ, көру өрісі' },
    peds: { label: 'Педиатрия', sub: 'Скрининг, анализдер' },
    micro: { label: 'Микробиология', sub: 'Дақыл, ПЦР, антигендер' },
  },
  en: {
    lab: { label: 'Blood tests', sub: 'CBC, biochemistry, hormones' },
    imaging: { label: 'Imaging', sub: 'MRI, CT, X-ray, ultrasound' },
    cardio: { label: 'Cardiology', sub: 'ECG, Holter, echocardiogram' },
    neuro: { label: 'Neurology', sub: 'EEG, EMG, ultrasound Doppler' },
    ortho: { label: 'Orthopedics', sub: 'Densitometry, X-ray' },
    ophtha: { label: 'Ophthalmology', sub: 'Exam, OCT, visual field' },
    peds: { label: 'Pediatrics', sub: 'Screening, tests' },
    micro: { label: 'Microbiology', sub: 'Culture, PCR, antigens' },
  },
  uz: {
    lab: { label: 'Qon tahlillari', sub: 'UQT, biokimyo, gormonlar' },
    imaging: { label: 'Tasvirlash', sub: 'MRT, KT, rentgen, UZI' },
    cardio: { label: 'Kardiologiya', sub: 'EKG, xolter, EXOKG' },
    neuro: { label: 'Nevrologiya', sub: 'EEG, EMG, UZDG' },
    ortho: { label: 'Ortopediya', sub: 'Densitometriya, rentgen' },
    ophtha: { label: 'Oftalmologiya', sub: "Ko'rik, OKT, ko'rish maydoni" },
    peds: { label: 'Pediatriya', sub: 'Skrining, tahlillar' },
    micro: { label: 'Mikrobiologiya', sub: 'Ekish, PCR, antigenlar' },
  },
};

const DIAGNOSTICS_TEXT = {
  ru: {
    chooseDiagnosticsType: "Выберите тип диагностики", categories: "категорий",
    aiPicking: "ИИ подбирает диагностику...", aiAnalyzingSub: "Анализируем симптомы и подбираем нужные исследования",
    aiPicked: "ИИ подобрал диагностику", rewrite: "Написать заново",
    aiPickTitle: "Подобрать диагностику с ИИ", aiPickSub: "Опишите симптомы — ИИ подберёт нужные анализы",
    aiPlaceholder: "Например: болит голова и шея, головокружение по утрам...", askAi: "Спросить ИИ",
    aiNoSuggestion: "Не удалось получить рекомендацию.", serviceUnavailable: "Сервис временно недоступен.",
    back: "Назад", chooseExam: "Выберите исследование", noServicesInCategory: "Нет доступных услуг в этой категории",
    date: "Дата", time: "Время", confirmBooking: "Подтвердить запись",
    bookingError: "Ошибка при записи. Попробуйте ещё раз.",
    appointmentConfirmed: "Запись подтверждена!", confirmationSentToEmail: "На вашу почту отправлено подтверждение",
    exam: "Исследование", section: "Раздел", dateTime: "Дата и время", clinic: "Клиника", phone: "Телефон",
    toHome: "На главную", done: "Готово", locale: "ru-RU",
  },
  kz: {
    chooseDiagnosticsType: "Диагностика түрін таңдаңыз", categories: "санат",
    aiPicking: "AI диагностиканы таңдап жатыр...", aiAnalyzingSub: "Симптомдарды талдап, қажетті зерттеулерді таңдаймыз",
    aiPicked: "AI диагностиканы таңдады", rewrite: "Қайта жазу",
    aiPickTitle: "AI көмегімен диагностика таңдау", aiPickSub: "Симптомдарды сипаттаңыз — AI қажетті анализдерді таңдайды",
    aiPlaceholder: "Мысалы: бас және мойын ауырады, таңертең бас айналу...", askAi: "AI-ден сұрау",
    aiNoSuggestion: "Ұсыныс алу мүмкін болмады.", serviceUnavailable: "Қызмет уақытша қолжетімсіз.",
    back: "Артқа", chooseExam: "Зерттеуді таңдаңыз", noServicesInCategory: "Бұл санатта қолжетімді қызметтер жоқ",
    date: "Күні", time: "Уақыты", confirmBooking: "Жазылуды растау",
    bookingError: "Жазылу кезінде қате орын алды. Қайталап көріңіз.",
    appointmentConfirmed: "Жазылу расталды!", confirmationSentToEmail: "Растау поштаңызға жіберілді",
    exam: "Зерттеу", section: "Бөлім", dateTime: "Күні мен уақыты", clinic: "Клиника", phone: "Телефон",
    toHome: "Басты бетке", done: "Дайын", locale: "kk-KZ",
  },
  en: {
    chooseDiagnosticsType: "Choose a diagnostics type", categories: "categories",
    aiPicking: "AI is picking diagnostics...", aiAnalyzingSub: "Analyzing symptoms and selecting the right tests",
    aiPicked: "AI picked the diagnostics", rewrite: "Rewrite",
    aiPickTitle: "Find diagnostics with AI", aiPickSub: "Describe your symptoms — AI will choose the right tests",
    aiPlaceholder: "Example: head and neck pain, morning dizziness...", askAi: "Ask AI",
    aiNoSuggestion: "Could not get a recommendation.", serviceUnavailable: "Service temporarily unavailable.",
    back: "Back", chooseExam: "Choose a test", noServicesInCategory: "No services available in this category",
    date: "Date", time: "Time", confirmBooking: "Confirm booking",
    bookingError: "Error booking the appointment. Please try again.",
    appointmentConfirmed: "Appointment confirmed!", confirmationSentToEmail: "A confirmation has been sent to your email",
    exam: "Test", section: "Section", dateTime: "Date and time", clinic: "Clinic", phone: "Phone",
    toHome: "Back to home", done: "Done", locale: "en-US",
  },
  uz: {
    chooseDiagnosticsType: "Diagnostika turini tanlang", categories: "kategoriya",
    aiPicking: "AI diagnostikani tanlamoqda...", aiAnalyzingSub: "Simptomlarni tahlil qilib, kerakli tekshiruvlarni tanlaymiz",
    aiPicked: "AI diagnostikani tanladi", rewrite: "Qayta yozish",
    aiPickTitle: "AI yordamida diagnostika tanlash", aiPickSub: "Simptomlarni tasvirlang — AI kerakli tahlillarni tanlaydi",
    aiPlaceholder: "Masalan: bosh va bo'yin og'riydi, ertalab bosh aylanishi...", askAi: "AI'dan so'rash",
    aiNoSuggestion: "Tavsiya olib bo'lmadi.", serviceUnavailable: "Xizmat vaqtincha mavjud emas.",
    back: "Orqaga", chooseExam: "Tekshiruvni tanlang", noServicesInCategory: "Bu toifada mavjud xizmatlar yo'q",
    date: "Sana", time: "Vaqt", confirmBooking: "Yozilishni tasdiqlash",
    bookingError: "Yozilishda xatolik yuz berdi. Qayta urinib ko'ring.",
    appointmentConfirmed: "Yozilish tasdiqlandi!", confirmationSentToEmail: "Tasdiqlash elektron pochtangizga yuborildi",
    exam: "Tekshiruv", section: "Bo'lim", dateTime: "Sana va vaqt", clinic: "Klinika", phone: "Telefon",
    toHome: "Bosh sahifaga", done: "Tayyor", locale: "uz-UZ",
  },
};

interface DiagnosticsFlowProps {
  onBack: () => void;
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

interface DiagnosticsService {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  duration_minutes: number;
  clinic: number;
  clinic_name: string;
  clinic_logo?: string | null;
  category: string;
  category_label: string;
}

interface AISuggestion {
  summary: string;
  suggested_categories: { id: string; label: string }[];
  suggested_tests: string[];
}

const CATEGORY_META = [
  { id: 'lab',     icon: FlaskConical, iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    border: 'border-blue-100 hover:border-blue-200',    dot: 'bg-blue-400',    cardBg: 'bg-blue-50/70'    },
  { id: 'imaging', icon: Scan,         iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  border: 'border-indigo-100 hover:border-indigo-200',  dot: 'bg-indigo-400',  cardBg: 'bg-indigo-50/70'  },
  { id: 'cardio',  icon: Heart,        iconBg: 'bg-red-100',     iconColor: 'text-red-500',     border: 'border-red-100 hover:border-red-200',        dot: 'bg-red-400',     cardBg: 'bg-red-50/70'     },
  { id: 'neuro',   icon: Brain,        iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  border: 'border-violet-100 hover:border-violet-200',  dot: 'bg-violet-400',  cardBg: 'bg-violet-50/70'  },
  { id: 'ortho',   icon: Bone,         iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   border: 'border-amber-100 hover:border-amber-200',    dot: 'bg-amber-400',   cardBg: 'bg-amber-50/70'   },
  { id: 'ophtha',  icon: Eye,          iconBg: 'bg-cyan-100',    iconColor: 'text-cyan-600',    border: 'border-cyan-100 hover:border-cyan-200',      dot: 'bg-cyan-400',    cardBg: 'bg-cyan-50/70'    },
  { id: 'peds',    icon: Baby,         iconBg: 'bg-pink-100',    iconColor: 'text-pink-500',    border: 'border-pink-100 hover:border-pink-200',      dot: 'bg-pink-400',    cardBg: 'bg-pink-50/70'    },
  { id: 'micro',   icon: Microscope,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-200',dot: 'bg-emerald-400', cardBg: 'bg-emerald-50/70' },
];

type Step = 1 | 2 | 3;

const DiagnosticsFlow: React.FC<DiagnosticsFlowProps> = ({ onBack, onComplete, onStepChange }) => {
  const { language: uiLanguage } = useLanguage();
  const tt = DIAGNOSTICS_TEXT[uiLanguage as keyof typeof DIAGNOSTICS_TEXT] ?? DIAGNOSTICS_TEXT.ru;
  const { pay: payForConsultation } = useConsultationPayment();
  const ctext = CATEGORY_TEXT[uiLanguage as keyof typeof CATEGORY_TEXT] ?? CATEGORY_TEXT.ru;
  const CATEGORIES = CATEGORY_META.map(m => ({
    ...m,
    label: ctext[m.id as keyof typeof ctext].label,
    sub: ctext[m.id as keyof typeof ctext].sub,
  }));
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [step, setStep] = useState<Step>(1);

  const goToStep = (s: Step) => { setStep(s); onStepChange?.(s); };
  const goBack = () => { if (step === 1) onBack(); else goToStep((step - 1) as Step); };
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<DiagnosticsService | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [services, setServices] = useState<DiagnosticsService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  // AI suggestion state
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const category = CATEGORIES.find(c => c.id === selectedCategory);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  useEffect(() => {
    axiosInstance.get('/clinic-stats/').then((res: any) => {
      const cur = res.data?.clinic_info?.currency;
      if (cur) setClinicCurrency(cur);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    setLoadingServices(true);
    setServices([]);
    setSelectedService(null);
    axiosInstance
      .get('/diagnostics/services/', { params: { category: selectedCategory } })
      .then((res: any) => setServices(res.data.results ?? res.data))
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));
  }, [selectedCategory]);

  const requestAISuggestion = async () => {
    if (!aiInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiSuggestion(null);
    setAiError(null);
    try {
      const res = await axiosInstance.post('/diagnostics/ai-suggest/', { symptoms: aiInput.trim() });
      if (res.data.success) {
        setAiSuggestion(res.data);
      } else {
        setAiError(res.data.error || tt.aiNoSuggestion);
      }
    } catch {
      setAiError(tt.serviceUnavailable);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setBooking(true);
    setBookingError(null);
    try {
      const scheduledTime = `${selectedDate}T${selectedTime}:00`;
      const amount = selectedService.price ? Math.round(Number(selectedService.price)) : 3000;

      await payForConsultation({
        paymentType: "diagnostics",
        amount,
        description: selectedService.name,
        bookingData: {
          service_id: selectedService.id,
          scheduled_time: scheduledTime,
        },
      });

      // Populate bookedAppointment from local state for the success screen
      setBookedAppointment({
        clinic_name: selectedService.clinic_name,
      });
      goToStep(3);
    } catch (err: any) {
      if (err?.message !== "Payment cancelled") {
        setBookingError(err?.message || tt.bookingError);
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">

        {/* Step 1 — Category */}
        {step === 1 && (
          <motion.div
            key="diag-step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            {/* Unified card — same style as Step2 */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800 flex-1">{tt.chooseDiagnosticsType}</span>
              <span className="text-xs text-gray-400">{CATEGORIES.length} {tt.categories}</span>
            </div>

            {/* ── AI section — same design as Step2 ── */}
            <AnimatePresence mode="wait">
              {aiLoading ? (
                <motion.div key="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3 border-b border-blue-100 bg-blue-50">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">{tt.aiPicking}</p>
                    <p className="text-xs text-blue-600">{tt.aiAnalyzingSub}</p>
                  </div>
                </motion.div>
              ) : aiSuggestion ? (
                <motion.div key="ai-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 py-4 border-b border-emerald-100 bg-emerald-50">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-900">{tt.aiPicked}</p>
                      <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{aiSuggestion.summary}</p>
                      {aiSuggestion.suggested_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {aiSuggestion.suggested_categories.map(cat => {
                            const meta = CATEGORIES.find(c => c.id === cat.id);
                            const Icon = meta?.icon ?? FlaskConical;
                            return (
                              <button key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); goToStep(2); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:shadow-sm ${meta ? `${meta.iconBg} ${meta.iconColor} border-transparent` : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                <Icon className="w-3.5 h-3.5" />{cat.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {aiSuggestion.suggested_tests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {aiSuggestion.suggested_tests.map((test, i) => (
                            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-emerald-100 text-xs text-emerald-700">
                              <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />{test}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <motion.button onClick={() => { setAiSuggestion(null); setAiInput(''); }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0 self-start"
                      style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}>
                      <RefreshCw className="w-3 h-3" /> {tt.rewrite}
                    </motion.button>
                  </div>
                  {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
                </motion.div>
              ) : (
                <motion.div key="ai-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2 mb-2.5">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900 leading-tight">{tt.aiPickTitle}</p>
                      <p className="text-xs text-indigo-500">{tt.aiPickSub}</p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-xl border border-indigo-200 bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all overflow-hidden shadow-sm">
                    <input
                      ref={inputRef}
                      type="text"
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && aiInput.trim()) requestAISuggestion(); }}
                      placeholder={tt.aiPlaceholder}
                      className="flex-1 pl-3.5 py-4 text-sm bg-transparent border-none outline-none placeholder-indigo-300 text-gray-700 min-w-0"
                    />
                    <motion.button onClick={requestAISuggestion} disabled={!aiInput.trim()}
                      whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
                      className="px-5 py-4 text-sm font-semibold text-white disabled:opacity-30 flex-shrink-0 whitespace-nowrap self-stretch flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg, #29358f, #3772ff)' }}>
                      <Sparkles className="w-3.5 h-3.5" /> {tt.askAi}
                    </motion.button>
                  </div>
                  {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isAISuggested = aiSuggestion?.suggested_categories.some(s => s.id === cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedCategory(cat.id); goToStep(2); }}
                    className={`group relative flex flex-col items-start gap-3 px-4 py-4 rounded-2xl border shadow-sm cursor-pointer text-left transition-all ${isAISuggested ? 'bg-violet-50/70 border-violet-200 ring-1 ring-violet-100' : `${cat.cardBg} ${cat.border}`}`}
                  >
                    <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${cat.dot} opacity-60`} />
                    {isAISuggested && (
                      <div className="absolute top-2.5 left-2.5">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{cat.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{cat.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            </div>{/* end p-4 */}
            </div>{/* end unified card */}
          </motion.div>
        )}

        {/* Step 2 — Service + Date/Time */}
        {step === 2 && selectedCategory && (
          <motion.div
            key="diag-step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            >
            {/* Unified card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible">

            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button onClick={() => goBack()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all flex-shrink-0">
                <ArrowLeft className="w-4 h-4" /> {tt.back}
              </button>
              {category && (() => {
                const Icon = category.icon;
                return (
                  <>
                    <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${category.iconBg}`}>
                      <Icon className={`w-3.5 h-3.5 ${category.iconColor}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-800 flex-1">{category.label}</span>
                  </>
                );
              })()}
            </div>

            <div className="p-4 space-y-3">

            {/* Booking error */}
            {bookingError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {bookingError}
              </div>
            )}

            {/* Select service */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3.5 pb-2">
                {tt.chooseExam}
              </p>
              {loadingServices ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : services.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-gray-400">{tt.noServicesInCategory}</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        selectedService?.id === svc.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {svc.clinic_logo ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm flex-shrink-0 flex items-center justify-center">
                            <img src={svc.clinic_logo} alt={svc.clinic_name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className={`text-sm font-medium block ${selectedService?.id === svc.id ? 'text-blue-700' : 'text-gray-700'}`}>
                            {svc.name}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[11px] text-gray-400">{svc.clinic_name}</span>
                            {svc.price && (
                              <span className="text-[11px] text-gray-500">· {Number(svc.price).toLocaleString(tt.locale)} {getCurrencySymbol(clinicCurrency)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedService?.id === svc.id && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Select date */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {tt.date}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {dates.map((d) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center py-2 px-3 rounded-xl border text-xs font-semibold flex-shrink-0 transition-all ${
                        isSelected ? 'bg-blue-600 text-white border-transparent shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <span className="opacity-70 text-[10px]">{d.toLocaleDateString(tt.locale, { weekday: 'short' })}</span>
                      <span className="font-bold text-sm leading-tight">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {tt.time}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {times.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedTime === t
                            ? 'bg-blue-600 text-white border-transparent shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button
              onClick={handleBook}
              disabled={!selectedService || !selectedDate || !selectedTime || booking}
              whileHover={selectedService && selectedDate && selectedTime ? { scale: 1.01 } : {}}
              whileTap={selectedService && selectedDate && selectedTime ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}
            >
              {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{tt.confirmBooking} <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
            </div>{/* end p-4 */}
            </div>{/* end unified card */}
          </motion.div>
        )}

        {/* Step 3 — Confirmed */}
        {step === 3 && (
          <motion.div
            key="diag-step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Success banner */}
            <div
              className="relative overflow-hidden rounded-2xl px-5 py-6 text-center"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #1d4ed8 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="relative w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle2 className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="font-bold text-white text-lg">{tt.appointmentConfirmed}</h2>
              <p className="text-white/70 text-sm mt-1">{tt.confirmationSentToEmail}</p>
            </div>

            {/* Booking summary */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {selectedService && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Microscope className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{tt.exam}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{selectedService.name}</p>
                    {selectedService.price && (
                      <p className="text-xs text-gray-400">{Number(selectedService.price).toLocaleString(tt.locale)} {getCurrencySymbol(clinicCurrency)}</p>
                    )}
                  </div>
                </div>
              )}
              {category && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  {(() => { const Icon = category.icon; return (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category.iconBg}`}>
                      <Icon className={`w-4 h-4 ${category.iconColor}`} />
                    </div>
                  ); })()}
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.section}</p>
                    <p className="text-sm font-semibold text-gray-900">{category.label}</p>
                  </div>
                </div>
              )}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.dateTime}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedDate).toLocaleDateString(tt.locale, { weekday: 'short', day: 'numeric', month: 'short' })} · {selectedTime}
                    </p>
                  </div>
                </div>
              )}
              {/* Clinic info from booking response */}
              {(bookedAppointment?.clinic_name || selectedService?.clinic_name) && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.clinic}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {bookedAppointment?.clinic_name ?? selectedService?.clinic_name}
                    </p>
                    {bookedAppointment?.clinic_address && (
                      <p className="text-xs text-gray-400 mt-0.5">{bookedAppointment.clinic_address}</p>
                    )}
                  </div>
                </div>
              )}
              {bookedAppointment?.clinic_phones && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{tt.phone}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Array.isArray(bookedAppointment.clinic_phones)
                        ? bookedAppointment.clinic_phones.map((p: any) => p.number ?? p).join(', ')
                        : bookedAppointment.clinic_phones}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold bg-white border border-gray-200 text-gray-600 text-sm shadow-sm hover:border-gray-300 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {tt.toHome}
              </button>
              <button
                onClick={onComplete}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}
              >
                {tt.done}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticsFlow;
