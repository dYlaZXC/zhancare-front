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
  Video
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <motion.div
        className="p-4 md:p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-3"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Видеоконсультации
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Просмотрите ваши консультации или назначьте новую встречу с врачом
          </p>
        </motion.div>

        {/* Big Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full max-w-md px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3"
          >
            <Video size={24} />
            Назначить новую консультацию
            <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Patient Consultations Table */}
      <PatientConsultationsTable />

      {/* Extended Bottom Spacing */}
      <div className="pb-8 md:pb-12"></div>
    </div>
  );
};

export default VideoConsultationStep1;