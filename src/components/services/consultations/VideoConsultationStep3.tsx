"use client";

import React, { useState, useEffect } from "react";
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
  
  const checks = [
    { id: 'symptoms', label: "Анализ симптомов", icon: Brain, duration: 1200 },
    { id: 'connection', label: "Проверка соединения", icon: Wifi, duration: 800 },
    { id: 'camera', label: "Тестирование камеры", icon: Camera, duration: 1000 },
    { id: 'microphone', label: "Проверка микрофона", icon: Volume2, duration: 600 },
    { id: 'security', label: "Настройка безопасности", icon: Shield, duration: 900 },
    { id: 'doctor', label: "Готовность врача", icon: Activity, duration: 1500 }
  ];

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
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin text-blue-600" size={16} />
                <span className="text-blue-700 font-medium">Пересканирование...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${
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
                <span className={`font-medium ${
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
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
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
                <span className="text-gray-600">
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
                <span className="text-gray-600">
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
                <span className="text-gray-600">
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
          <span className="text-blue-700 font-medium">ИИ выполняет проверку...</span>
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
                <span className={isActive ? 'font-medium' : ''}>{check.label}</span>
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

interface Step3Props {
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
  onCancel: () => void;
  loading: boolean;
  waiting: boolean;
  activeStep?: number;
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
  onCancel,
  loading,
  waiting,
  activeStep = 3,
}) => {
  const [waitingTime, setWaitingTime] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'checking'>('checking');
  const [showTechCheck, setShowTechCheck] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');

  const doctor = doctors.find((d) => d.id === selectedDoctorId);

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

  const TechCheckModal = () => (
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
              <h3 className="text-xl font-bold text-gray-900">Проверка оборудования</h3>
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
                  <span className="font-medium">Камера</span>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  cameraPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {cameraPermission === 'granted' ? 'Разрешена' : 'Нет доступа'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {micPermission === 'granted' ? <Volume2 className="text-green-500" /> : <VolumeX className="text-red-500" />}
                  <span className="font-medium">Микрофон</span>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  micPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {micPermission === 'granted' ? 'Разрешен' : 'Нет доступа'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getConnectionIcon()}
                  <span className="font-medium">Интернет</span>
                </div>
                <span className={`text-sm px-2 py-1 rounded-full ${
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
                    <p className="font-medium text-yellow-800 mb-1">Требуется доступ</p>
                    <p className="text-yellow-700">
                      Разрешите доступ к камере и микрофону в настройках браузера для видеоконсультации
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={checkMediaPermissions}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Проверить снова
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div
      className="space-y-8 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CheckCircle2 size={24} />
          </div>
          Все готово для консультации
        </h2>
        <p className="text-gray-600">
          Проверьте информацию и начните видеоконсультацию с врачом
        </p>
      </motion.div>

      {/* Progress Steps */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-2xl p-6"
      >
        <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FileText size={20} />
          Сводка консультации
        </h3>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  status === "completed" 
                    ? "bg-green-100 text-green-600" 
                    : status === "current" 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {status === "completed" ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{step.label}</h4>
                    {status === "current" && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Активный шаг
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  
                  <div className="text-sm">
                    {step.key === "symptoms" && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 line-clamp-3">{symptoms}</p>
                      </div>
                    )}
                    {step.key === "doctor" && doctor && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {doctor.avatar || doctor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doctor.name}</p>
                          <p className="text-sm text-blue-600">{doctor.doctor_type}</p>
                          {doctor.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="fill-yellow-400 text-yellow-400" size={12} />
                              <span className="text-xs text-gray-600">{doctor.rating}</span>
                              {doctor.experience && (
                                <span className="text-xs text-gray-500">• {doctor.experience} лет опыта</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {step.key === "connect" && (
                      <AILiveChecker 
                        onComplete={() => {}}
                        onOpenDetailedCheck={() => setShowTechCheck(true)}
                        cameraPermission={cameraPermission}
                        micPermission={micPermission}
                        connectionQuality={connectionQuality}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Important Information */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-3">
          <Shield className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900">Важная информация</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Clock size={14} className="mt-0.5 flex-shrink-0" />
                <span>Средняя продолжительность консультации: 15-30 минут</span>
              </div>
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 flex-shrink-0" />
                <span>Консультация будет записана для вашей медицинской карты</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="mt-0.5 flex-shrink-0" />
                <span>После консультации вы получите рекомендации врача</span>
              </div>
              <div className="flex items-start gap-2">
                <HelpCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>В случае технических проблем обратитесь в поддержку</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-between items-center pt-6 border-t border-gray-200"
      >
        <motion.button
          onClick={onBack}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
        >
          <ArrowLeft size={16} />
          Изменить данные
        </motion.button>

        <motion.button
          onClick={onCall}
          disabled={loading || !selectedDoctorId || waiting}
          whileTap={!loading && !waiting ? { scale: 0.97 } : {}}
          whileHover={!loading && !waiting ? { scale: 1.02 } : {}}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all min-w-[200px] justify-center ${
            loading || waiting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25"
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Подготовка...
            </>
          ) : waiting ? (
            <>
              <Clock size={20} />
              Ожидание ({formatWaitingTime(waitingTime)})
            </>
          ) : (
            <>
              <Video size={20} />
              Начать консультацию
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Waiting State */}
      <AnimatePresence>
        {waiting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  Ожидаем подключения врача
                </h3>
                <p className="text-sm text-yellow-700">
                  Доктор {doctor?.name} скоро подключится к видеоконсультации
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Время ожидания: {formatWaitingTime(waitingTime)}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="text-red-600 hover:text-red-700 text-sm font-medium underline transition-colors"
              >
                Отменить консультацию
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TechCheckModal />
    </motion.div>
  );
};

export default VideoConsultationStep3;