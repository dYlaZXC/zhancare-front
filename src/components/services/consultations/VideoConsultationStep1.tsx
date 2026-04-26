"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Info,
  ClipboardPaste,
  Mic,
  MicOff,
  Thermometer,
  Heart,
  Brain,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Video,
  Home,
  Stethoscope
} from "lucide-react";
import PatientConsultationsTable from "./PatientConsultationsTable";

interface Step1Props {
  symptoms: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onOffline?: () => void;
  onDiagnostics?: () => void;
  loading?: boolean;
}

const VideoConsultationStep1: React.FC<Step1Props> = ({
  symptoms,
  onChange,
  onNext,
  onOffline,
  onDiagnostics,
  loading = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [charCount, setCharCount] = useState(symptoms.length);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isNextDisabled = !symptoms.trim() || loading;
  const minChars = 20;
  const maxChars = 500;
  const progress = Math.min((charCount / minChars) * 100, 100);

  // Quick symptom categories
  const categories = [
    { id: 'fever', icon: Thermometer, label: 'Температура/Жар', color: 'from-red-500 to-orange-500' },
    { id: 'heart', icon: Heart, label: 'Сердце/Грудь', color: 'from-pink-500 to-red-500' },
    { id: 'head', icon: Brain, label: 'Головная боль', color: 'from-purple-500 to-indigo-500' },
    { id: 'energy', icon: Zap, label: 'Слабость/Усталость', color: 'from-yellow-500 to-orange-500' },
  ];

  // Smart suggestions based on input
  const suggestions = [
    {
      text: "Температура 36.2, головная боль с утра, усиливается при движении",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
    {
      text: "Температура 39.5°C, сильный озноб, затрудненное дыхание",
      urgency: "urgent",
      urgencyLabel: "Срочная",
      urgencyColor: "red"
    },
    {
      text: "Боль в горле, трудно глотать, кашель",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
    {
      text: "Острая боль в груди, одышка, учащенное сердцебиение",
      urgency: "urgent",
      urgencyLabel: "Срочная",
      urgencyColor: "red"
    },
    {
      text: "Боль в животе, спазмы после еды",
      urgency: "non_urgent",
      urgencyLabel: "Плановая",
      urgencyColor: "blue"
    },
  ];

  useEffect(() => {
    setCharCount(symptoms.length);
  }, [symptoms]);

  const insertExample = () => {
    const example = "Головная боль с утра (около 7 утра), пульсирующая в области висков. Температура 38.1°C, небольшой озноб. Общая слабость, трудно сконцентрироваться на работе.";
    onChange(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    const currentText = symptoms.trim();
    const newText = currentText ? `${currentText}. ${suggestionText}` : suggestionText;
    onChange(newText);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Auto-focus textarea after category selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Mock voice recording (in real implementation, integrate with Web Speech API)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Simulate voice input after 3 seconds
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        onChange(symptoms + " (добавлено голосом: першение в горле, сухой кашель)");
      }, 3000);
    }
  };

  const getProgressColor = () => {
    if (progress < 30) return 'from-red-400 to-red-500';
    if (progress < 70) return 'from-yellow-400 to-orange-500';
    return 'from-green-400 to-emerald-500';
  };

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-64 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-0 right-1/4 w-80 h-64 bg-indigo-500/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-6 py-10">
        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600 tracking-wide uppercase">Zhancare AI</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Медицинские услуги</h3>
          <p className="text-sm text-gray-400">Выберите удобный формат консультации</p>
        </div>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full max-w-2xl">

          {/* Online — primary */}
          <motion.button
            onClick={onNext}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex-1 flex sm:flex-col flex-row items-center sm:gap-3 gap-4 sm:px-6 px-4 sm:py-6 py-4 rounded-2xl overflow-hidden text-white font-semibold text-sm transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #6048f5 100%)', boxShadow: '0 8px 28px rgba(55,114,255,0.35)' }}
          >
            {/* Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            {/* Glow blob */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-400/30 rounded-full blur-2xl" />

            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
              <Video size={20} />
            </div>
            <div className="relative sm:text-center text-left flex-1">
              <p className="font-bold text-base leading-tight">Онлайн</p>
              <p className="text-xs opacity-75 mt-0.5">консультация</p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full border border-white/25 flex-shrink-0">
              Начать <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>

          {/* Offline */}
          <motion.button
            onClick={onOffline}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex-1 flex sm:flex-col flex-row items-center sm:gap-3 gap-4 sm:px-6 px-4 sm:py-6 py-4 rounded-2xl overflow-hidden text-white font-semibold text-sm transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 8px 28px rgba(16,185,129,0.35)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-300/30 rounded-full blur-2xl" />

            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
              <Home size={20} />
            </div>
            <div className="relative sm:text-center text-left flex-1">
              <p className="font-bold text-base leading-tight">Оффлайн</p>
              <p className="text-xs opacity-75 mt-0.5">приём врача</p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full border border-white/25 flex-shrink-0">
              Записаться <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>

          {/* Diagnostics */}
          <motion.button
            onClick={onDiagnostics}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex-1 flex sm:flex-col flex-row items-center sm:gap-3 gap-4 sm:px-6 px-4 sm:py-6 py-4 rounded-2xl overflow-hidden text-white font-semibold text-sm transition-all cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', boxShadow: '0 8px 28px rgba(139,92,246,0.35)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-violet-400/30 rounded-full blur-2xl" />

            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-inner flex-shrink-0">
              <Stethoscope size={20} />
            </div>
            <div className="relative sm:text-center text-left flex-1">
              <p className="font-bold text-base leading-tight">Диагностика</p>
              <p className="text-xs opacity-75 mt-0.5">анализы и обследование</p>
            </div>
            <div className="relative flex items-center gap-1 text-xs font-semibold bg-white/20 px-3 py-1 rounded-full border border-white/25 flex-shrink-0">
              Записаться <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </motion.button>

        </div>
      </div>

      {/* Divider */}
      <div className="relative mx-6 h-px bg-gray-100" />

      {/* Patient Consultations Table */}
      <div className="relative py-6">
        <PatientConsultationsTable />
      </div>

      <div className="pb-4" />
    </div>
  );
};

export default VideoConsultationStep1;