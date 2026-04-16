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
  loading?: boolean;
}

const VideoConsultationStep1: React.FC<Step1Props> = ({
  symptoms,
  onChange,
  onNext,
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

      <div className="relative flex items-center justify-between gap-4 px-6 py-4 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Консультации</h3>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-600">
            <Sparkles className="w-3 h-3" />
            Медицинские услуги
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
          >
            <Video size={15} />
            Онлайн консультация
            <ArrowRight size={14} />
          </motion.button>

          <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 font-medium text-sm cursor-not-allowed">
            <Home size={15} />
            Оффлайн
          </button>

          <button disabled className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 font-medium text-sm cursor-not-allowed">
            <Stethoscope size={15} />
            Диагностика
          </button>
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