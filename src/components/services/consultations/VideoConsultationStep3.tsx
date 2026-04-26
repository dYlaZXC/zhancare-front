"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  User,
  Stethoscope,
  Video,
  CheckCircle2,
  Clock,
  Shield,
  Info,
  AlertCircle,
  ArrowLeft,
  Phone,
  Calendar,
  FileText,
  Star,
  Wifi,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  Settings,
  HelpCircle,
  X,
  Bot,
  Brain,
  Activity,
  Loader2
} from "lucide-react";

// AI Live Checker Component
const AILiveChecker = ({ onComplete, onOpenDetailedCheck, cameraPermission, micPermission, connectionQuality }: { 
  onComplete: () => void; 
  onOpenDetailedCheck: () => void;
  cameraPermission: 'granted' | 'denied' | 'checking';
  micPermission: 'granted' | 'denied' | 'checking';
  connectionQuality: 'good' | 'fair' | 'poor';
}) => {
  const [currentCheck, setCurrentCheck] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkResults, setCheckResults] = useState<{[key: string]: 'success' | 'error' | 'warning'}>({});
  const [isRechecking, setIsRechecking] = useState(false);
  
  const checks = useMemo(() => [
    { id: 'symptoms', label: "Анализ симптомов", icon: Brain, duration: 1200 },
    { id: 'connection', label: "Проверка соединения", icon: Wifi, duration: 800 },
    { id: 'camera', label: "Тестирование камеры", icon: Camera, duration: 1000 },
    { id: 'microphone', label: "Проверка микрофона", icon: Volume2, duration: 600 },
    { id: 'security', label: "Настройка безопасности", icon: Shield, duration: 900 },
    { id: 'doctor', label: "Готовность врача", icon: Activity, duration: 1500 }
  ], []);

  // Monitor permission changes and recheck if needed
  useEffect(() => {
    if (isCompleted && (cameraPermission !== 'checking' || micPermission !== 'checking')) {
      const hadCameraError = checkResults.camera === 'error';
      const hadMicError = checkResults.microphone === 'error';
      const nowCameraOk = cameraPermission === 'granted';
      const nowMicOk = micPermission === 'granted';
      
      // If permissions were fixed, automatically recheck
      if ((hadCameraError && nowCameraOk) || (hadMicError && nowMicOk)) {
        setIsRechecking(true);
        setTimeout(() => {
          // Update the results
          setCheckResults(prev => ({
            ...prev,
            camera: cameraPermission === 'granted' ? 'success' : 'error',
            microphone: micPermission === 'granted' ? 'success' : 'error',
            connection: connectionQuality === 'good' ? 'success' : connectionQuality === 'fair' ? 'warning' : 'warning'
          }));
          setIsRechecking(false);
        }, 1500);
      }
    }
  }, [cameraPermission, micPermission, connectionQuality, isCompleted, checkResults]);

  useEffect(() => {
    if (currentCheck < checks.length && !isCompleted) {
      const timer = setTimeout(() => {
        // Determine result for current check
        const check = checks[currentCheck];
        let result: 'success' | 'error' | 'warning' = 'success';
        
        if (check.id === 'camera' && cameraPermission === 'denied') result = 'error';
        else if (check.id === 'microphone' && micPermission === 'denied') result = 'error';
        else if (check.id === 'connection' && connectionQuality === 'poor') result = 'warning';
        else if (check.id === 'connection' && connectionQuality === 'fair') result = 'warning';
        
        setCheckResults(prev => ({...prev, [check.id]: result}));
        
        if (currentCheck === checks.length - 1) {
          setIsCompleted(true);
          onComplete();
        } else {
          setCurrentCheck(prev => prev + 1);
        }
      }, checks[currentCheck].duration);

      return () => clearTimeout(timer);
    }
  }, [currentCheck, checks, isCompleted, onComplete, cameraPermission, micPermission, connectionQuality]);

  const hasErrors = Object.values(checkResults).some(result => result === 'error');
  const hasWarnings = Object.values(checkResults).some(result => result === 'warning');

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-3"
      >
        <AnimatePresence mode="wait">
          {isRechecking ? (
            <motion.div
              key="rechecking"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Loader2 className="animate-spin text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-blue-700 font-medium text-sm sm:text-base md:text-lg">Пересканирование...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border shadow-md ${
                hasErrors
                  ? 'bg-red-50 border-red-200'
                  : hasWarnings
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {hasErrors ? (
                  <AlertCircle className="text-red-600" size={16} />
                ) : hasWarnings ? (
                  <AlertCircle className="text-yellow-600" size={16} />
                ) : (
                  <CheckCircle2 className="text-green-600" size={16} />
                )}
                <span className={`font-medium text-sm md:text-base ${
                  hasErrors 
                    ? 'text-red-700' 
                    : hasWarnings 
                    ? 'text-yellow-700' 
                    : 'text-green-700'
                }`}>
                  {hasErrors 
                    ? 'Обнаружены проблемы' 
                    : hasWarnings 
                    ? 'Проверка завершена с предупреждениями' 
                    : 'ИИ проверка завершена'
                  }
                </span>
                {!hasErrors && !hasWarnings && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    100%
                  </span>
                )}
              </div>
              <button
                onClick={onOpenDetailedCheck}
                className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium flex items-center gap-1"
              >
                <Settings size={14} />
                {hasErrors || hasWarnings ? 'Исправить' : 'Детали'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          {!isRechecking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-3 gap-2 text-xs"
            >
              <div className="flex items-center gap-1">
                <motion.div 
                  className={`w-2 h-2 rounded-full`}
                  animate={{
                    backgroundColor: connectionQuality === 'good' ? '#4ade80' : 
                                   connectionQuality === 'fair' ? '#facc15' : '#f87171'
                  }}
                  transition={{ duration: 0.3 }}
                />
                <span className="text-gray-600 text-xs">
                  Связь: {connectionQuality === 'good' ? 'стабильна' : connectionQuality === 'fair' ? 'средняя' : 'слабая'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <motion.div 
                  className="w-2 h-2 rounded-full"
                  animate={{
                    backgroundColor: cameraPermission === 'granted' ? '#4ade80' : '#f87171'
                  }}
                  transition={{ duration: 0.3 }}
                />
                <span className="text-gray-600 text-xs">
                  Камера: {cameraPermission === 'granted' ? 'готова' : 'заблокирована'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <motion.div 
                  className="w-2 h-2 rounded-full"
                  animate={{
                    backgroundColor: micPermission === 'granted' ? '#4ade80' : '#f87171'
                  }}
                  transition={{ duration: 0.3 }}
                />
                <span className="text-gray-600 text-xs">
                  Микрофон: {micPermission === 'granted' ? 'готов' : 'заблокирован'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {hasErrors && !isRechecking && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700"
          >
            <strong>Требуется действие:</strong> Разрешите доступ к камере и микрофону для видеоконсультации
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="text-blue-600" size={16} />
          <span className="text-blue-700 font-medium text-sm md:text-base">ИИ выполняет проверку...</span>
        </div>
        
        <div className="space-y-2">
          {checks.map((check, index) => {
            const Icon = check.icon;
            const isActive = index === currentCheck;
            const isCompleted = index < currentCheck;
            const result = checkResults[check.id];
            
            return (
              <motion.div
                key={check.label}
                initial={{ opacity: 0.5 }}
                animate={{ 
                  opacity: isActive ? 1 : isCompleted ? 0.8 : 0.5 
                }}
                className={`flex items-center gap-2 text-sm ${
                  isCompleted 
                    ? result === 'error' 
                      ? 'text-red-600' 
                      : result === 'warning' 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                    : isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500'
                }`}
              >
                {isCompleted ? (
                  result === 'error' ? (
                    <AlertCircle size={14} className="text-red-600" />
                  ) : result === 'warning' ? (
                    <AlertCircle size={14} className="text-yellow-600" />
                  ) : (
                    <CheckCircle2 size={14} className="text-green-600" />
                  )
                ) : isActive ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <Icon size={14} />
                )}
                <span className={`${isActive ? 'font-medium' : ''} text-sm`}>{check.label}</span>
                {isActive && (
                  <div className="flex-1 ml-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: check.duration / 1000 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Проверка {currentCheck + 1} из {checks.length}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            {Math.round(((currentCheck) / checks.length) * 100)}% завершено
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export interface Step3Props {
  symptoms: string;
  doctors: {
    id: number;
    name: string;
    doctor_type: string;
    rating?: number;
    experience?: number;
    avatar?: string;
  }[];
  selectedDoctorId: number | null;
  onBack: () => void;
  onCall: () => void;
  onScheduleConsultation?: () => void;
  onCancel: () => void;
  loading: boolean;
  waiting: boolean;
  connecting?: boolean;
  activeStep?: number;
  recommendedDoctor?: {
    id: number;
    name: string;
    doctor_type: string;
    reason: string;
    urgency: string;
    confidence?: number;
  };
  scheduledConsultation?: {
    id: number;
    scheduled_time: string;
    doctor_name: string;
    doctor_type: string;
    booking_type: 'urgent' | 'scheduled';
  } | null;
  pendingConsultationData?: {
    scheduled_time: string;
    doctor_id: number;
    ai_recommendation_id: number;
  } | null;
}

const steps = [
  {
    id: 1,
    label: "Описание симптомов",
    icon: User,
    key: "symptoms",
    description: "Ваши жалобы переданы врачу"
  },
  {
    id: 2,
    label: "Выбор специалиста",
    icon: Stethoscope,
    key: "doctor",
    description: "Врач подобран по вашим симптомам"
  },
  {
    id: 3,
    label: "Видеоконсультация",
    icon: Video,
    key: "connect",
    description: "Готово к началу консультации"
  },
];

const VideoConsultationStep3: React.FC<Step3Props> = ({
  symptoms,
  doctors,
  selectedDoctorId,
  onBack,
  onCall,
  onScheduleConsultation,
  onCancel,
  loading,
  waiting,
  connecting = false,
  activeStep = 3,
  recommendedDoctor,
  scheduledConsultation,
  pendingConsultationData,
}) => {
  const [waitingTime, setWaitingTime] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const doctor = doctors.find((d) => d.id === selectedDoctorId);
  // REMOVED: Urgent consultation logic - all consultations now require time slot selection
  // const isUrgent = recommendedDoctor?.urgency === 'urgent';
  const isUrgent = false; // Always false now

  // Check permissions on mount
  useEffect(() => {
    checkMediaPermissions();
    checkConnectionQuality();
  }, []);

  // Timer for waiting state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (waiting) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitingTime(0);
    }
    return () => clearInterval(interval);
  }, [waiting]);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraPermission('granted');
      setMicPermission('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setCameraPermission('denied');
      setMicPermission('denied');
    }
  };

  const checkConnectionQuality = () => {
    // Mock connection check - in real app, use network APIs
    const connection = (navigator as any).connection;
    if (connection) {
      const speed = connection.downlink;
      if (speed > 10) setConnectionQuality('good');
      else if (speed > 2) setConnectionQuality('fair');
      else setConnectionQuality('poor');
    }
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < activeStep) return "completed";
    if (stepId === activeStep) return "current";
    return "upcoming";
  };

  const formatWaitingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good': return <Wifi className="text-green-500" size={16} />;
      case 'fair': return <Wifi className="text-yellow-500" size={16} />;
      case 'poor': return <Wifi className="text-red-500" size={16} />;
    }
  };

  const TechCheckModal = () => {
    return (
      <AnimatePresence>
      {showTechCheck && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTechCheck(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full space-y-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Проверка оборудования</h3>
              <button 
                onClick={() => setShowTechCheck(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {cameraPermission === 'granted' ? <Camera className="text-green-500" /> : <CameraOff className="text-red-500" />}
                  <span className="font-medium text-sm md:text-base">Камера</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  cameraPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {cameraPermission === 'granted' ? 'Разрешена' : 'Нет доступа'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {micPermission === 'granted' ? <Volume2 className="text-green-500" /> : <VolumeX className="text-red-500" />}
                  <span className="font-medium text-sm md:text-base">Микрофон</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  micPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {micPermission === 'granted' ? 'Разрешен' : 'Нет доступа'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getConnectionIcon()}
                  <span className="font-medium text-sm md:text-base">Интернет</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  connectionQuality === 'good' 
                    ? 'bg-green-100 text-green-700' 
                    : connectionQuality === 'fair' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {connectionQuality === 'good' ? 'Отлично' : connectionQuality === 'fair' ? 'Хорошо' : 'Слабо'}
                </span>
              </div>
            </div>

            {(cameraPermission === 'denied' || micPermission === 'denied') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1 text-sm md:text-base">Требуется доступ</p>
                    <p className="text-yellow-700 text-xs md:text-sm">
                      Разрешите доступ к камере и микрофону в настройках браузера для видеоконсультации
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={checkMediaPermissions}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              Проверить снова
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    );
  };

  return (
    <motion.div
      className="space-y-3 pb-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── Compact status bar ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #3772ff 0%, #1d4ed8 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-white" />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="font-bold text-white text-base leading-tight">Всё готово</p>
          <p className="text-white/65 text-xs mt-0.5 truncate">Проверьте данные и назначьте консультацию</p>
        </div>
        <div className="relative flex-shrink-0 flex items-center gap-1.5">
          {[
            { ok: connectionQuality === 'good', warn: connectionQuality === 'fair', label: 'Связь' },
            { ok: cameraPermission === 'granted', warn: false, label: 'Камера' },
            { ok: micPermission === 'granted', warn: false, label: 'Микро' },
          ].map(({ ok, warn, label }) => (
            <div key={label} title={label} className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : warn ? 'bg-amber-400' : 'bg-red-400'}`} />
          ))}
        </div>
      </div>

      {/* ── Main summary card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

        {/* Doctor row */}
        {doctor && (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {doctor.name.charAt(0)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{doctor.name}</p>
              <p className="text-xs text-blue-600 truncate">{doctor.doctor_type}</p>
            </div>
            {(doctor.rating || doctor.experience) && (
              <div className="flex-shrink-0 flex items-center gap-2 text-[11px] text-gray-400">
                {doctor.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{doctor.rating}
                  </span>
                )}
                {doctor.experience && <span>{doctor.experience} лет</span>}
              </div>
            )}
          </div>
        )}

        {/* Appointment row */}
        {scheduledConsultation && (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Запись</p>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {new Date(scheduledConsultation.scheduled_time).toLocaleDateString('ru-RU', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })}{' · '}
                {new Date(scheduledConsultation.scheduled_time).toLocaleTimeString('ru-RU', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              Подтверждено
            </span>
          </div>
        )}

        {/* Symptoms row */}
        {symptoms && (
          <div className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Симптомы</p>
              <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{symptoms}</p>
            </div>
          </div>
        )}

        {/* Tech check row */}
        <div className="px-4 py-3.5">
          <AILiveChecker
            onComplete={() => {}}
            onOpenDetailedCheck={() => setShowTechCheck(true)}
            cameraPermission={cameraPermission}
            micPermission={micPermission}
            connectionQuality={connectionQuality}
          />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2.5">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold bg-white border border-gray-200 hover:border-gray-300 text-gray-600 text-sm transition-all shadow-sm flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Назад
        </motion.button>

        <motion.button
          onClick={() => onScheduleConsultation ? onScheduleConsultation() : setShowConfirmDialog(true)}
          disabled={loading || !selectedDoctorId || waiting || connecting}
          whileTap={!loading && !waiting && !connecting ? { scale: 0.97 } : {}}
          whileHover={!loading && !waiting && !connecting ? { scale: 1.01 } : {}}
          className="group relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white overflow-hidden shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)', boxShadow: '0 4px 16px rgba(55,114,255,0.3)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Подготовка...</span></>
          ) : connecting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Подключение...</span></>
          ) : waiting ? (
            <><Clock className="w-4 h-4" /><span>Ожидание ({formatWaitingTime(waitingTime)})</span></>
          ) : (
            <><Video className="w-4 h-4" /><span>Назначить консультацию</span></>
          )}
        </motion.button>
      </div>

      {/* ── Waiting state ── */}
      <AnimatePresence>
        {waiting && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5"
          >
            <div className="flex gap-1 flex-shrink-0">
              {[0, 0.15, 0.3].map((d, i) => (
                <motion.div key={i} className="w-2 h-2 bg-amber-500 rounded-full"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">Ожидаем врача · {formatWaitingTime(waitingTime)}</p>
              <p className="text-xs text-amber-600 truncate">{doctor?.name} скоро подключится</p>
            </div>
            <button onClick={onCancel} className="text-red-500 hover:text-red-600 text-xs font-medium flex-shrink-0 transition-colors">
              Отменить
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TechCheckModal />

      {/* ── Confirm dialog ── */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="font-bold text-gray-900 text-base mb-1">Назначить консультацию?</p>
              <p className="text-gray-500 text-sm mb-5">С доктором {doctor?.name} в выбранное время</p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                  Отмена
                </button>
                <button onClick={() => { setShowConfirmDialog(false); onCall(); }}
                  className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}>
                  Подтвердить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoConsultationStep3;