"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Calendar, Clock,
  FlaskConical, Scan, Heart, Brain, Bone, Eye, Baby, Microscope
} from "lucide-react";

interface DiagnosticsFlowProps {
  onBack: () => void;
  onComplete?: () => void;
}

const CATEGORIES = [
  { id: 'lab',     icon: FlaskConical, label: 'Анализы крови',   sub: 'ОАК, биохимия, гормоны',   bg: 'linear-gradient(135deg,#3772ff,#1d4ed8)', shadow: 'rgba(55,114,255,0.28)' },
  { id: 'imaging', icon: Scan,         label: 'Визуализация',    sub: 'МРТ, КТ, рентген, УЗИ',   bg: 'linear-gradient(135deg,#6366f1,#4338ca)', shadow: 'rgba(99,102,241,0.28)' },
  { id: 'cardio',  icon: Heart,        label: 'Кардиология',     sub: 'ЭКГ, холтер, ЭХОКГ',      bg: 'linear-gradient(135deg,#ef4444,#b91c1c)', shadow: 'rgba(239,68,68,0.28)'  },
  { id: 'neuro',   icon: Brain,        label: 'Неврология',      sub: 'ЭЭГ, ЭМГ, УЗДГ',          bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', shadow: 'rgba(139,92,246,0.28)' },
  { id: 'ortho',   icon: Bone,         label: 'Ортопедия',       sub: 'Денситометрия, рентген',   bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.28)' },
  { id: 'ophtha',  icon: Eye,          label: 'Офтальмология',   sub: 'Осмотр, ОКТ, поля зрения',bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', shadow: 'rgba(14,165,233,0.28)' },
  { id: 'peds',    icon: Baby,         label: 'Педиатрия',       sub: 'Скрининг, анализы',        bg: 'linear-gradient(135deg,#ec4899,#be185d)', shadow: 'rgba(236,72,153,0.28)' },
  { id: 'micro',   icon: Microscope,   label: 'Микробиология',   sub: 'Посев, ПЦР, антигены',     bg: 'linear-gradient(135deg,#10b981,#047857)', shadow: 'rgba(16,185,129,0.28)' },
];

const TESTS: Record<string, string[]> = {
  lab:     ['Общий анализ крови', 'Биохимический анализ', 'Гормоны щитовидной железы', 'Анализ на сахар', 'Коагулограмма', 'Иммунограмма'],
  imaging: ['УЗИ органов брюшной полости', 'МРТ головного мозга', 'КТ грудной клетки', 'Рентген позвоночника', 'УЗИ суставов'],
  cardio:  ['ЭКГ', 'Холтеровское мониторирование', 'ЭХОКГ (УЗИ сердца)', 'Велоэргометрия', 'Суточный мониторинг АД'],
  neuro:   ['ЭЭГ', 'УЗДГ сосудов головы и шеи', 'Электромиография', 'Вызванные потенциалы'],
  ortho:   ['Денситометрия', 'Рентген суставов', 'Рентген позвоночника', 'УЗИ суставов'],
  ophtha:  ['Проверка остроты зрения', 'Тонометрия', 'Осмотр глазного дна', 'Периметрия', 'ОКТ сетчатки'],
  peds:    ['Неонатальный скрининг', 'Общий анализ крови', 'Анализ мочи', 'УЗИ тазобедренных суставов'],
  micro:   ['Бакпосев', 'ПЦР-диагностика', 'Антиген-тест', 'Анализ на хеликобактер'],
};

type Step = 1 | 2 | 3;

const DiagnosticsFlow: React.FC<DiagnosticsFlowProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const category = CATEGORIES.find(c => c.id === selectedCategory);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={step === 1 ? onBack : () => setStep((step - 1) as Step)}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">Диагностика</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3772ff, #1d4ed8)' }}
                animate={{ width: progressWidth }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">Шаг {step} / 3</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* Step 1 — Category */}
        {step === 1 && (
          <motion.div
            key="diag-step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <div>
              <h3 className="font-bold text-gray-900 text-base">Выберите тип диагностики</h3>
              <p className="text-xs text-gray-400 mt-0.5">Выберите нужный раздел для записи</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedCategory(cat.id); setStep(2); }}
                    className="group relative flex flex-col items-center gap-3 px-3 py-5 rounded-2xl text-white overflow-hidden cursor-pointer"
                    style={{ background: cat.bg, boxShadow: `0 6px 20px ${cat.shadow}` }}
                  >
                    {/* Shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                    <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-black/10 rounded-full blur-xl" />

                    <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="relative text-center">
                      <p className="font-bold text-sm leading-tight">{cat.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{cat.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Test + Date/Time */}
        {step === 2 && selectedCategory && (
          <motion.div
            key="diag-step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            {/* Category badge */}
            {category && (() => {
              const Icon = category.icon;
              return (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: category.bg }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{category.label}</span>
                </div>
              );
            })()}

            {/* Select test */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-3.5 pb-2">Выберите исследование</p>
              <div className="divide-y divide-gray-50">
                {(TESTS[selectedCategory] || []).map((test) => (
                  <button
                    key={test}
                    onClick={() => setSelectedTest(test)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      selectedTest === test ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${selectedTest === test ? 'text-blue-700' : 'text-gray-700'}`}>{test}</span>
                    {selectedTest === test && <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Select date */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Дата
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
                      <span className="opacity-70 text-[10px]">{d.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                      <span className="font-bold text-sm leading-tight">{d.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Время
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
              onClick={() => setStep(3)}
              disabled={!selectedTest || !selectedDate || !selectedTime}
              whileHover={selectedTest && selectedDate && selectedTime ? { scale: 1.01 } : {}}
              whileTap={selectedTest && selectedDate && selectedTime ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}
            >
              Подтвердить запись <ArrowRight className="w-4 h-4" />
            </motion.button>
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
              <h2 className="font-bold text-white text-lg">Запись подтверждена!</h2>
              <p className="text-white/70 text-sm mt-1">Ждём вас в назначенное время</p>
            </div>

            {/* Booking summary */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {selectedTest && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Microscope className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Исследование</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedTest}</p>
                  </div>
                </div>
              )}
              {category && (
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
                  {(() => { const Icon = category.icon; return (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: category.bg }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  ); })()}
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Раздел</p>
                    <p className="text-sm font-semibold text-gray-900">{category.label}</p>
                  </div>
                </div>
              )}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Дата и время</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })} · {selectedTime}
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
                На главную
              </button>
              <button
                onClick={onComplete}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}
              >
                Готово
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticsFlow;
