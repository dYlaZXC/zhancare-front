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
import { useLanguage } from "@/context/LanguageContext";
import { formatDualTime } from "@/utils/clinicTime";

const STEP3_TEXT = {
  ru: {
    checkSymptoms: "Анализ симптомов", checkConnection: "Проверка соединения", checkCamera: "Тестирование камеры",
    checkMic: "Проверка микрофона", checkSecurity: "Настройка безопасности", checkDoctor: "Готовность врача",
    rescanning: "Пересканирование...",
    issuesFound: "Обнаружены проблемы", checkDoneWarnings: "Проверка завершена с предупреждениями", aiCheckDone: "ИИ проверка завершена",
    fix: "Исправить", details: "Детали",
    connStable: "стабильна", connFair: "средняя", connPoor: "слабая",
    connLabel: "Связь:", cameraLabel: "Камера:", micLabel: "Микрофон:",
    cameraReady: "готова", cameraBlocked: "заблокирована", micReady: "готов", micBlocked: "заблокирован",
    actionRequired: "Требуется действие:", allowCameraMic: "Разрешите доступ к камере и микрофону для видеоконсультации",
    aiChecking: "ИИ выполняет проверку...",
    checkOf: "Проверка", of2: "из", donePercent: "завершено",
    descriptionSymptoms: "Описание симптомов", symptomsTransferred: "Ваши жалобы переданы врачу",
    chooseSpecialist: "Выбор специалиста", doctorMatched: "Врач подобран по вашим симптомам",
    videoConsultation: "Видеоконсультация", readyToStart: "Готово к началу консультации",
    equipmentCheck: "Проверка оборудования",
    camera: "Камера", microphone: "Микрофон", internet: "Интернет",
    allowed: "Разрешена", micAllowed: "Разрешен", noAccess: "Нет доступа",
    excellent: "Отлично", good: "Хорошо", weak: "Слабо",
    accessRequired: "Требуется доступ", allowInBrowserSettings: "Разрешите доступ к камере и микрофону в настройках браузера для видеоконсультации",
    checkAgain: "Проверить снова",
    allReady: "Всё готово", checkDataAndAssign: "Проверьте данные и назначьте консультацию",
    connShort: "Связь", cameraShort: "Камера", micShort: "Микро",
    years: "лет",
    appointment: "Запись", confirmed: "Подтверждено", clinicTime: "Время клиники",
    symptoms: "Симптомы",
    preparing: "Подготовка...", connecting: "Подключение...", waitingTime: (t: string) => `Ожидание (${t})`,
    assignConsultation: "Назначить консультацию",
    waitingDoctor: (t: string) => `Ожидаем врача · ${t}`, willConnectSoon: "скоро подключится",
    cancel2: "Отменить",
    assignQuestion: "Назначить консультацию?", withDoctorAt: (name: string) => `С доктором ${name} в выбранное время`,
    cancel: "Отмена", confirm: "Подтвердить",
    consultationCost: "Стоимость консультации",
    locale: "ru-RU",
  },
  kz: {
    checkSymptoms: "Симптомдарды талдау", checkConnection: "Байланысты тексеру", checkCamera: "Камераны тестілеу",
    checkMic: "Микрофонды тексеру", checkSecurity: "Қауіпсіздікті баптау", checkDoctor: "Дәрігердің дайындығы",
    rescanning: "Қайта сканерлеу...",
    issuesFound: "Мәселелер табылды", checkDoneWarnings: "Тексеру ескертулермен аяқталды", aiCheckDone: "AI тексеруі аяқталды",
    fix: "Түзету", details: "Толығырақ",
    connStable: "тұрақты", connFair: "орташа", connPoor: "әлсіз",
    connLabel: "Байланыс:", cameraLabel: "Камера:", micLabel: "Микрофон:",
    cameraReady: "дайын", cameraBlocked: "бөгелген", micReady: "дайын", micBlocked: "бөгелген",
    actionRequired: "Әрекет қажет:", allowCameraMic: "Бейне кеңес үшін камера мен микрофонға қатынасты рұқсат етіңіз",
    aiChecking: "AI тексеру жүргізіп жатыр...",
    checkOf: "Тексеру", of2: "ішінен", donePercent: "аяқталды",
    descriptionSymptoms: "Симптомдар сипаттамасы", symptomsTransferred: "Шағымдарыңыз дәрігерге жіберілді",
    chooseSpecialist: "Маманды таңдау", doctorMatched: "Дәрігер симптомдарыңызға сай таңдалды",
    videoConsultation: "Бейне кеңес", readyToStart: "Кеңесті бастауға дайын",
    equipmentCheck: "Жабдықты тексеру",
    camera: "Камера", microphone: "Микрофон", internet: "Интернет",
    allowed: "Рұқсат етілген", micAllowed: "Рұқсат етілген", noAccess: "Қатынас жоқ",
    excellent: "Тамаша", good: "Жақсы", weak: "Әлсіз",
    accessRequired: "Қатынас қажет", allowInBrowserSettings: "Бейне кеңес үшін браузер баптауларында камера мен микрофонға қатынасты рұқсат етіңіз",
    checkAgain: "Қайта тексеру",
    allReady: "Бәрі дайын", checkDataAndAssign: "Деректерді тексеріп, кеңесті тағайындаңыз",
    connShort: "Байланыс", cameraShort: "Камера", micShort: "Микро",
    years: "жыл",
    appointment: "Жазылу", confirmed: "Расталды", clinicTime: "Клиника уақыты",
    symptoms: "Симптомдар",
    preparing: "Дайындық...", connecting: "Қосылу...", waitingTime: (t: string) => `Күту (${t})`,
    assignConsultation: "Кеңесті тағайындау",
    waitingDoctor: (t: string) => `Дәрігерді күтеміз · ${t}`, willConnectSoon: "жақында қосылады",
    cancel2: "Бас тарту",
    assignQuestion: "Кеңес тағайындау керек пе?", withDoctorAt: (name: string) => `${name} дәрігермен таңдалған уақытта`,
    cancel: "Бас тарту", confirm: "Растау",
    consultationCost: "Кеңес құны",
    locale: "kk-KZ",
  },
  en: {
    checkSymptoms: "Symptom analysis", checkConnection: "Connection check", checkCamera: "Camera testing",
    checkMic: "Microphone check", checkSecurity: "Security setup", checkDoctor: "Doctor readiness",
    rescanning: "Rescanning...",
    issuesFound: "Issues found", checkDoneWarnings: "Check completed with warnings", aiCheckDone: "AI check complete",
    fix: "Fix", details: "Details",
    connStable: "stable", connFair: "fair", connPoor: "weak",
    connLabel: "Connection:", cameraLabel: "Camera:", micLabel: "Microphone:",
    cameraReady: "ready", cameraBlocked: "blocked", micReady: "ready", micBlocked: "blocked",
    actionRequired: "Action required:", allowCameraMic: "Allow camera and microphone access for the video consultation",
    aiChecking: "AI is running a check...",
    checkOf: "Check", of2: "of", donePercent: "complete",
    descriptionSymptoms: "Symptom description", symptomsTransferred: "Your complaints have been sent to the doctor",
    chooseSpecialist: "Choosing a specialist", doctorMatched: "A doctor has been matched to your symptoms",
    videoConsultation: "Video consultation", readyToStart: "Ready to start the consultation",
    equipmentCheck: "Equipment check",
    camera: "Camera", microphone: "Microphone", internet: "Internet",
    allowed: "Allowed", micAllowed: "Allowed", noAccess: "No access",
    excellent: "Excellent", good: "Good", weak: "Weak",
    accessRequired: "Access required", allowInBrowserSettings: "Allow camera and microphone access in your browser settings for the video consultation",
    checkAgain: "Check again",
    allReady: "All set", checkDataAndAssign: "Review the details and schedule the consultation",
    connShort: "Connection", cameraShort: "Camera", micShort: "Mic",
    years: "yrs",
    appointment: "Appointment", confirmed: "Confirmed", clinicTime: "Clinic time",
    symptoms: "Symptoms",
    preparing: "Preparing...", connecting: "Connecting...", waitingTime: (t: string) => `Waiting (${t})`,
    assignConsultation: "Schedule consultation",
    waitingDoctor: (t: string) => `Waiting for the doctor · ${t}`, willConnectSoon: "will join soon",
    cancel2: "Cancel",
    assignQuestion: "Schedule the consultation?", withDoctorAt: (name: string) => `With Dr. ${name} at the selected time`,
    cancel: "Cancel", confirm: "Confirm",
    consultationCost: "Consultation cost",
    locale: "en-US",
  },
  uz: {
    checkSymptoms: "Simptomlarni tahlil qilish", checkConnection: "Aloqani tekshirish", checkCamera: "Kamerani sinash",
    checkMic: "Mikrofonni tekshirish", checkSecurity: "Xavfsizlikni sozlash", checkDoctor: "Shifokorning tayyorligi",
    rescanning: "Qayta tekshirilmoqda...",
    issuesFound: "Muammolar topildi", checkDoneWarnings: "Tekshirish ogohlantirishlar bilan yakunlandi", aiCheckDone: "AI tekshiruvi yakunlandi",
    fix: "Tuzatish", details: "Tafsilotlar",
    connStable: "barqaror", connFair: "o'rtacha", connPoor: "zaif",
    connLabel: "Aloqa:", cameraLabel: "Kamera:", micLabel: "Mikrofon:",
    cameraReady: "tayyor", cameraBlocked: "bloklangan", micReady: "tayyor", micBlocked: "bloklangan",
    actionRequired: "Harakat talab qilinadi:", allowCameraMic: "Video konsultatsiya uchun kamera va mikrofonga ruxsat bering",
    aiChecking: "AI tekshirish o'tkazmoqda...",
    checkOf: "Tekshiruv", of2: "dan", donePercent: "yakunlandi",
    descriptionSymptoms: "Simptomlar tavsifi", symptomsTransferred: "Shikoyatlaringiz shifokorga yuborildi",
    chooseSpecialist: "Mutaxassisni tanlash", doctorMatched: "Simptomlaringizga mos shifokor tanlandi",
    videoConsultation: "Video konsultatsiya", readyToStart: "Konsultatsiyani boshlashga tayyor",
    equipmentCheck: "Uskunani tekshirish",
    camera: "Kamera", microphone: "Mikrofon", internet: "Internet",
    allowed: "Ruxsat berilgan", micAllowed: "Ruxsat berilgan", noAccess: "Kirish yo'q",
    excellent: "A'lo", good: "Yaxshi", weak: "Zaif",
    accessRequired: "Kirish talab qilinadi", allowInBrowserSettings: "Video konsultatsiya uchun brauzer sozlamalarida kamera va mikrofonga ruxsat bering",
    checkAgain: "Qayta tekshirish",
    allReady: "Hammasi tayyor", checkDataAndAssign: "Ma'lumotlarni tekshirib, konsultatsiyani belgilang",
    connShort: "Aloqa", cameraShort: "Kamera", micShort: "Mikro",
    years: "yosh",
    appointment: "Yozilish", confirmed: "Tasdiqlandi", clinicTime: "Klinika vaqti",
    symptoms: "Simptomlar",
    preparing: "Tayyorlanmoqda...", connecting: "Ulanmoqda...", waitingTime: (t: string) => `Kutilmoqda (${t})`,
    assignConsultation: "Konsultatsiyani belgilash",
    waitingDoctor: (t: string) => `Shifokorni kutamiz · ${t}`, willConnectSoon: "tez orada ulanadi",
    cancel2: "Bekor qilish",
    assignQuestion: "Konsultatsiya belgilansinmi?", withDoctorAt: (name: string) => `${name} shifokor bilan tanlangan vaqtda`,
    cancel: "Bekor qilish", confirm: "Tasdiqlash",
    consultationCost: "Konsultatsiya narxi",
    locale: "uz-UZ",
  },
};

// AI Live Checker Component
const AILiveChecker = ({ onComplete, onOpenDetailedCheck, cameraPermission, micPermission, connectionQuality }: { 
  onComplete: () => void; 
  onOpenDetailedCheck: () => void;
  cameraPermission: 'granted' | 'denied' | 'checking';
  micPermission: 'granted' | 'denied' | 'checking';
  connectionQuality: 'good' | 'fair' | 'poor';
}) => {
  const { language: uiLanguage } = useLanguage();
  const tt = STEP3_TEXT[uiLanguage as keyof typeof STEP3_TEXT] ?? STEP3_TEXT.ru;
  const [currentCheck, setCurrentCheck] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [checkResults, setCheckResults] = useState<{[key: string]: 'success' | 'error' | 'warning'}>({});
  const [isRechecking, setIsRechecking] = useState(false);

  const checks = useMemo(() => [
    { id: 'symptoms', label: tt.checkSymptoms, icon: Brain, duration: 1200 },
    { id: 'connection', label: tt.checkConnection, icon: Wifi, duration: 800 },
    { id: 'camera', label: tt.checkCamera, icon: Camera, duration: 1000 },
    { id: 'microphone', label: tt.checkMic, icon: Volume2, duration: 600 },
    { id: 'security', label: tt.checkSecurity, icon: Shield, duration: 900 },
    { id: 'doctor', label: tt.checkDoctor, icon: Activity, duration: 1500 }
  ], [tt]);

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
                <span className="text-blue-700 font-medium text-sm sm:text-base md:text-lg">{tt.rescanning}</span>
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
                    ? tt.issuesFound
                    : hasWarnings
                    ? tt.checkDoneWarnings
                    : tt.aiCheckDone
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
                {hasErrors || hasWarnings ? tt.fix : tt.details}
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
                  {tt.connLabel} {connectionQuality === 'good' ? tt.connStable : connectionQuality === 'fair' ? tt.connFair : tt.connPoor}
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
                  {tt.cameraLabel} {cameraPermission === 'granted' ? tt.cameraReady : tt.cameraBlocked}
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
                  {tt.micLabel} {micPermission === 'granted' ? tt.micReady : tt.micBlocked}
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
            <strong>{tt.actionRequired}</strong> {tt.allowCameraMic}
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
          <span className="text-blue-700 font-medium text-sm md:text-base">{tt.aiChecking}</span>
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
            {tt.checkOf} {currentCheck + 1} {tt.of2} {checks.length}
          </div>
          <div className="text-xs text-blue-600 font-medium">
            {Math.round(((currentCheck) / checks.length) * 100)}% {tt.donePercent}
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
    clinic_timezone?: string | null;
  } | null;
  pendingConsultationData?: {
    scheduled_time: string;
    doctor_id: number;
    ai_recommendation_id: number;
  } | null;
  consultationPrice?: number | null;
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
  consultationPrice,
}) => {
  const { language: uiLanguage } = useLanguage();
  const tt = STEP3_TEXT[uiLanguage as keyof typeof STEP3_TEXT] ?? STEP3_TEXT.ru;
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
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{tt.equipmentCheck}</h3>
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
                  <span className="font-medium text-sm md:text-base">{tt.camera}</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  cameraPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {cameraPermission === 'granted' ? tt.allowed : tt.noAccess}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {micPermission === 'granted' ? <Volume2 className="text-green-500" /> : <VolumeX className="text-red-500" />}
                  <span className="font-medium text-sm md:text-base">{tt.microphone}</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  micPermission === 'granted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {micPermission === 'granted' ? tt.micAllowed : tt.noAccess}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getConnectionIcon()}
                  <span className="font-medium text-sm md:text-base">{tt.internet}</span>
                </div>
                <span className={`text-xs md:text-sm px-2 py-1 rounded-full ${
                  connectionQuality === 'good'
                    ? 'bg-green-100 text-green-700'
                    : connectionQuality === 'fair'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {connectionQuality === 'good' ? tt.excellent : connectionQuality === 'fair' ? tt.good : tt.weak}
                </span>
              </div>
            </div>

            {(cameraPermission === 'denied' || micPermission === 'denied') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1 text-sm md:text-base">{tt.accessRequired}</p>
                    <p className="text-yellow-700 text-xs md:text-sm">
                      {tt.allowInBrowserSettings}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={checkMediaPermissions}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              {tt.checkAgain}
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
          <p className="font-bold text-white text-base leading-tight">{tt.allReady}</p>
          <p className="text-white/65 text-xs mt-0.5 truncate">{tt.checkDataAndAssign}</p>
        </div>
        <div className="relative flex-shrink-0 flex items-center gap-1.5">
          {[
            { ok: connectionQuality === 'good', warn: connectionQuality === 'fair', label: tt.connShort },
            { ok: cameraPermission === 'granted', warn: false, label: tt.cameraShort },
            { ok: micPermission === 'granted', warn: false, label: tt.micShort },
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
                {doctor.experience && <span>{doctor.experience} {tt.years}</span>}
              </div>
            )}
          </div>
        )}

        {/* Appointment row — online, so BOTH the viewer's own time and the
            clinic's time matter; shown explicitly (date + UTC-offset label),
            not just "HH:MM", so an international patient always knows
            exactly which day/instant they're booked for. */}
        {scheduledConsultation && (() => {
          const dual = formatDualTime(scheduledConsultation.scheduled_time, scheduledConsultation.clinic_timezone, undefined, tt.locale);
          return (
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">{tt.appointment}</p>
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {dual.viewerDate} · {dual.viewerTime} ({dual.viewerLabel})
                </p>
                {!dual.sameTimezone && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tt.clinicTime}: {dual.clinicDate} · {dual.clinicTime} ({dual.clinicLabel})
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {tt.confirmed}
              </span>
            </div>
          );
        })()}

        {/* Price row */}
        {consultationPrice != null && (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">₸</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">{tt.consultationCost}</p>
              <p className="text-sm font-bold text-gray-900">{consultationPrice.toLocaleString()} ₸</p>
            </div>
          </div>
        )}

        {/* Symptoms row */}
        {symptoms && (
          <div className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">{tt.symptoms}</p>
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
          onClick={() => onScheduleConsultation ? onScheduleConsultation() : setShowConfirmDialog(true)}
          disabled={loading || !selectedDoctorId || waiting || connecting}
          whileTap={!loading && !waiting && !connecting ? { scale: 0.97 } : {}}
          whileHover={!loading && !waiting && !connecting ? { scale: 1.01 } : {}}
          className="group relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white overflow-hidden shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)', boxShadow: '0 4px 16px rgba(55,114,255,0.3)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{tt.preparing}</span></>
          ) : connecting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>{tt.connecting}</span></>
          ) : waiting ? (
            <><Clock className="w-4 h-4" /><span>{tt.waitingTime(formatWaitingTime(waitingTime))}</span></>
          ) : (
            <><Video className="w-4 h-4" /><span>{tt.assignConsultation}{consultationPrice ? ` · ${consultationPrice.toLocaleString()} ₸` : ""}</span></>
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
              <p className="text-sm font-semibold text-amber-900">{tt.waitingDoctor(formatWaitingTime(waitingTime))}</p>
              <p className="text-xs text-amber-600 truncate">{doctor?.name} {tt.willConnectSoon}</p>
            </div>
            <button onClick={onCancel} className="text-red-500 hover:text-red-600 text-xs font-medium flex-shrink-0 transition-colors">
              {tt.cancel2}
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
              <p className="font-bold text-gray-900 text-base mb-1">{tt.assignQuestion}</p>
              <p className="text-gray-500 text-sm mb-5">{tt.withDoctorAt(doctor?.name || '')}</p>
              <div className="flex gap-2.5">
                <button onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                  {tt.cancel}
                </button>
                <button onClick={() => { setShowConfirmDialog(false); onCall(); }}
                  className="flex-1 py-2.5 text-white rounded-xl font-semibold text-sm shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3772ff, #1d4ed8)' }}>
                  {tt.confirm}
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