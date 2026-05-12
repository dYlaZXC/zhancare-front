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
  Video,
  Home,
  Stethoscope,
  ArrowRight,
  MapPin
} from "lucide-react";

interface Step1Props {
  symptoms: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onOffline?: () => void;
  onDiagnostics?: () => void;
  onHome?: () => void;
  loading?: boolean;
}

const VideoConsultationStep1: React.FC<Step1Props> = ({
  symptoms,
  onChange,
  onNext,
  onOffline,
  onDiagnostics,
  onHome,
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

  const serviceButtons = [
    {
      label: 'Онлайн',
      sub: 'видео-консультация',
      icon: <Video size={20} />,
      action: 'Начать',
      onClick: onNext,
      bg: '#1d4ed8',
    },
    {
      label: 'Оффлайн',
      sub: 'приём у врача',
      icon: <Home size={20} />,
      action: 'Записаться',
      onClick: onOffline,
      bg: '#0f766e',
    },
    {
      label: 'Вызов на дом',
      sub: 'медсестра к вам',
      icon: <MapPin size={20} />,
      action: 'Вызвать',
      onClick: onHome,
      bg: '#b45309',
    },
    {
      label: 'Диагностика',
      sub: 'анализы и обследование',
      icon: <Stethoscope size={20} />,
      action: 'Записаться',
      onClick: onDiagnostics,
      bg: '#7c3aed',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {serviceButtons.map(({ label, sub, icon, action, onClick, bg }) => (
        <motion.button
          key={label}
          onClick={onClick}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="group relative flex flex-col gap-3 px-4 py-4 rounded-2xl overflow-hidden text-white text-left transition-colors duration-200"
          style={{ backgroundColor: bg }}
        >
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />

          <div className="relative w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="relative flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">{label}</p>
            <p className="text-xs opacity-60 mt-0.5">{sub}</p>
          </div>
          <div className="relative flex items-center gap-1 text-xs font-semibold opacity-70 group-hover:opacity-100 transition-opacity">
            {action} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default VideoConsultationStep1;