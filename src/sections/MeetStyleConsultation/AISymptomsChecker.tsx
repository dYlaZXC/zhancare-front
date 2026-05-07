"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faArrowUp,
  faArrowLeft,
  faSpinner,
  faMicrophone,
  faStop,
  faHeartPulse,
  faCircleCheck,
  faUserMd,
  faVideo,
  faHouse,
  faStethoscope,
  faArrowRight,
  faImage,
  faTimes,
  faClock,
  faCalendarDays,
  faBell,
  faEnvelope,
  faStar,
  faBolt,
  faHospital,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import BookingModal from "@/sections/Chat/BookingModal";
import LanguageSwitcher from "@/sections/Hero/LanguageSwitcher";
import type { Doctor } from "@/components/services/consultations/types/doctor";
import { aiService, isInjectionAttempt, CHAT_ENDPOINT, CHAT_UPLOAD_ENDPOINT } from "@/lib/ai";
import type { ClinicContext, DoctorRecommendation } from "@/lib/ai";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

interface BookingConfirmationData {
  doctorName: string;
  doctorType: string;
  formattedDate: string;
  formattedTime: string;
}

type ConsultationFlow = 'online' | 'offline' | 'diagnostics';

interface Message {
  role: "user" | "assistant" | "doctor-card" | "doctors-list" | "time-slots" | "booking-confirmation" | "consultation-type-selector";
  content: string;
  doctor?: DoctorRecommendation;
  doctors?: DoctorRecommendation[];
  otherDoctors?: DoctorRecommendation[];
  timeSlots?: TimeSlot[];
  doctorId?: number;
  doctorName?: string;
  imageUrl?: string;
  bookingConfirmation?: BookingConfirmationData;
  selectedConsultationType?: ConsultationFlow;
  preliminaryDiagnosis?: string;
}

// Renders **bold** and *italic* inline markdown within a single text segment.
function renderInline(text: string, key?: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[2] !== undefined) parts.push(<em key={m.index}>{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span key={key}>{parts}</span>;
}

// Parses the AI response into paragraphs, numbered lists, and bullet lists.
const formatAIMessage = (content: string) => {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  type ListState = { ordered: boolean; items: string[] } | null;
  let list: ListState = null;
  let paraLines: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (!paraLines.length) return;
    blocks.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(paraLines.join(" "))}
      </p>
    );
    paraLines = [];
  };

  const flushList = () => {
    if (!list) return;
    if (list.ordered) {
      blocks.push(
        <ol key={key++} className="space-y-2 list-none">
          {list.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-semibold flex-shrink-0 w-5 text-right" style={{ color: "#3772ff" }}>
                {i + 1}.
              </span>
              <span className="leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={key++} className="space-y-2 list-none">
          {list.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 rounded-full mt-[7px]"
                style={{ width: 6, height: 6, background: "#3772ff" }}
              />
              <span className="leading-relaxed flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      flushList();
      continue;
    }

    // Numbered list: "1." or "1)"
    const ol = line.match(/^(\d+)[.)]\s+(.+)/);
    if (ol) {
      flushPara();
      if (list && !list.ordered) flushList();
      if (!list) list = { ordered: true, items: [] };
      list.items.push(ol[2]);
      continue;
    }

    // Bullet list: "-", "*", "•"
    const ul = line.match(/^[-*•]\s+(.+)/);
    if (ul) {
      flushPara();
      if (list && list.ordered) flushList();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(ul[1]);
      continue;
    }

    // Regular text — flush any open list first
    flushList();
    paraLines.push(line);
  }

  flushPara();
  flushList();

  return <div className="space-y-3">{blocks}</div>;
};

const UI = {
  ru: {
    back: "Назад",
    title: "ИИ Медицинский Ассистент",
    subtitle: "Диагностика симптомов",
    online: "Онлайн",
    welcomeTitle: "Добро пожаловать в ZhanBot.Ai",
    welcomeClinic: (name: string) => `Добро пожаловать в ${name}`,
    welcomeDesc: "Я проведу предварительную диагностику ваших симптомов и помогу подобрать подходящего специалиста. Все данные конфиденциальны и защищены.",
    aiLabel: "ИИ Ассистент",
    placeholder: "Опишите ваши симптомы...",
    enterHint: "Enter - отправка",
    shiftHint: "Shift+Enter - строка",
  },
  en: {
    back: "Back",
    title: "AI Medical Assistant",
    subtitle: "Symptom Diagnostics",
    online: "Online",
    welcomeTitle: "Welcome to ZhanBot.Ai",
    welcomeClinic: (name: string) => `Welcome to ${name}`,
    welcomeDesc: "I will conduct a preliminary diagnosis of your symptoms and help you find the right specialist. All data is confidential and secure.",
    aiLabel: "AI Assistant",
    placeholder: "Describe your symptoms...",
    enterHint: "Enter - send",
    shiftHint: "Shift+Enter - new line",
  },
  kz: {
    back: "Артқа",
    title: "ЖИ Медициналық Көмекші",
    subtitle: "Симптомдарды диагностикалау",
    online: "Онлайн",
    welcomeTitle: "ZhanBot.Ai-ға қош келдіңіз",
    welcomeClinic: (name: string) => `${name}-ға қош келдіңіз`,
    welcomeDesc: "Мен симптомдарыңыздың алдын ала диагностикасын жүргіземін және сізге тиісті маманды таңдауға көмектесемін. Барлық деректер құпия және қорғалған.",
    aiLabel: "ЖИ Көмекші",
    placeholder: "Симптомдарыңызды сипаттаңыз...",
    enterHint: "Enter - жіберу",
    shiftHint: "Shift+Enter - жол",
  },
};

export default function AISymptomsChecker({ clinic }: { clinic?: ClinicContext }) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const accentColor = clinic?.primaryColor ?? "#3772ff";

  const ui = UI[language as keyof typeof UI] ?? UI.ru;

  // Get initial welcome message based on language
  const getWelcomeMessage = () => {
    switch (language) {
      case "en":
        return "Hello! I'm your medical AI assistant. Please tell me what's bothering you? Describe your symptoms in detail. You can also attach photos of symptoms (rash, redness, etc.).";
      case "kz":
        return "Сәлеметсіз бе! Мен сіздің медициналық AI көмекшісімін. Сізді не алаңдатып тұр? Симптомдарыңызды толық сипаттаңыз. Сондай-ақ симптомдардың фотосуреттерін тіркеуге болады (бөртпе, қызару және т.б.).";
      case "ru":
      default:
        return clinic?.welcomeMessage ||
          "Здравствуйте! Я ваш медицинский ИИ-ассистент. Расскажите, пожалуйста, что вас беспокоит? Опишите ваши симптомы подробно. Вы также можете прикрепить фото симптомов (сыпь, покраснения и т.д.).";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: clinic?.welcomeMessage ?? getWelcomeMessage(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedDoctor, setPreselectedDoctor] = useState<Doctor | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [accumulatedSymptoms, setAccumulatedSymptoms] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (dataUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (blob.size > 5 * 1024 * 1024) return null;

      const urlRes = await fetch(CHAT_UPLOAD_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: blob.type || "image/jpeg" }),
      });
      if (!urlRes.ok) return null;
      const { upload_url, file_url } = await urlRes.json();

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });
      if (!uploadRes.ok) return null;
      return file_url as string;
    } catch {
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send the configured start message once on mount
  useEffect(() => {
    const msg = clinic?.autoMessage?.trim();
    if (!msg) return;
    const timer = setTimeout(() => {
      setInput(msg);
    }, 600); // short delay so the welcome message renders first
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line

  // Trigger send once input is pre-filled by autoMessage
  const autoSentRef = useRef(false);
  useEffect(() => {
    const msg = clinic?.autoMessage?.trim();
    if (!msg || autoSentRef.current) return;
    if (input === msg) {
      autoSentRef.current = true;
      handleSendMessage();
    }
  }, [input]); // eslint-disable-line

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      // Only update if the first message is still the welcome message (no user messages yet)
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [
          {
            role: "assistant",
            content: getWelcomeMessage(),
          },
        ];
      }
      return prev;
    });
  }, [language]);

  const handleSendMessage = async () => {
    // Allow sending if there's either text or an image
    if ((!input.trim() && !imagePreview) || isLoading) return;

    const userMessage = input.trim() || "📷 [Фото симптомов]";
    const userImage = imagePreview;

    setInput("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Reset textarea height and scroll to initial state
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
      inputRef.current.style.overflowY = "hidden";
      inputRef.current.scrollTop = 0;
    }

    // ── Prompt injection early guard (EN + RU + KZ via aiService) ───────────
    if (isInjectionAttempt(userMessage)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content:
            language === "en"
              ? "I'm a medical assistant and cannot change my role. Please describe your symptoms so I can help you find the right doctor."
              : language === "kz"
              ? "Мен медициналық көмекшімін және рөлімді өзгерте алмаймын. Симптомдарыңызды сипаттаңыз."
              : "Я медицинский ассистент и не могу изменить свою роль. Пожалуйста, опишите ваши симптомы — я помогу подобрать врача.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage, imageUrl: userImage || undefined }]);
    setIsLoading(true);

    try {
      // Only block pure greetings (hi, hello, привет) with no medical content at all
      const isOnlyGreeting = /^(hi|hello|привет|здравствуй|добрый день|добрый вечер|доброе утро|hey|хай|салам|сәлем)\s*[!.,]?\s*$/i.test(userMessage.trim());

      // Block obvious nonsense (no vowels)
      const hasVowels = /[аеёиоуыэюяaeiouy]/i.test(userMessage.trim());
      const consonantRatio = (userMessage.match(/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]/gi) || []).length / userMessage.trim().length;
      const isLikelyNonsense = !hasVowels || consonantRatio > 0.8;

      if (!userImage && (isOnlyGreeting || isLikelyNonsense)) {
        const isEnglish = /^(hi|hello|hey)/i.test(userMessage.trim());
        const isKazakh = /[әғқңөұүһ]/i.test(userMessage.trim());
        const greetingResponse = isEnglish
          ? "Hello! Tell me what's bothering you — I'll suggest likely causes and recommend a specialist."
          : isKazakh
          ? "Сәлеметсіз бе! Симптомдарыңызды айтыңыз — ықтимал себептерді және маманды ұсынамын."
          : "Здравствуйте! Опишите симптомы — я сразу предложу вероятные причины и порекомендую специалиста.";
        setMessages((prev) => [...prev, { role: "assistant", content: greetingResponse }]);
        setIsLoading(false);
        return;
      }

      // Upload image first if present
      let imageStorageUrl: string | undefined;
      if (userImage) {
        imageStorageUrl = (await uploadImage(userImage)) ?? undefined;
        if (!imageStorageUrl && !input.trim()) {
          const uploadErr = { ru: "Не удалось загрузить изображение. Попробуйте ещё раз.", en: "Failed to upload image. Please try again.", kz: "Суретті жүктеу мүмкін болмады. Қайталап көріңіз." };
          setMessages(prev => [...prev, { role: "assistant", content: uploadErr[language as keyof typeof uploadErr] ?? uploadErr.ru }]);
          setIsLoading(false);
          return;
        }
      }

      // Build conversation history (user + assistant only)
      const history = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      // ── Call ZhanBot chat AI ──────────────────────────────────────────────────
      const chatRes = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: (userImage && !input.trim()) ? "" : userMessage,
          language,
          history,
          ...(clinic?.clinicSlug ? { clinic_slug: clinic.clinicSlug } : {}),
          ...(imageStorageUrl ? { image_url: imageStorageUrl } : {}),
        }),
      });

      if (!chatRes.ok) throw new Error("Chat AI error");

      const chatData = await chatRes.json();
      let aiText: string = chatData.text || "";
      // Safety: if backend returned raw JSON instead of natural language, replace with fallback
      const trimmed = aiText.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const fallbacks = {
          ru: "Опишите ваши симптомы подробнее — я помогу подобрать подходящего специалиста.",
          en: "Please describe your symptoms in more detail so I can find the right specialist for you.",
          kz: "Симптомдарыңызды толығырақ сипаттаңыз — сізге сәйкес маманды табуға көмектесемін.",
        };
        aiText = fallbacks[language as keyof typeof fallbacks] ?? fallbacks.ru;
      }
      const showDoctorBtn: boolean = chatData.show_doctor_button ?? false;
      const preliminaryDiagnosis: string | undefined = chatData.preliminary_diagnosis || undefined;

      // ── Typewriter effect ─────────────────────────────────────────────────────
      await new Promise<void>(resolve => {
        let i = 0;
        const tick = () => {
          i++;
          setStreamingText(aiText.slice(0, i));
          if (i < aiText.length) {
            setTimeout(tick, 15);
          } else {
            setStreamingText("");
            setMessages(prev => [...prev, {
              role: "assistant",
              content: aiText,
              ...(preliminaryDiagnosis ? { preliminaryDiagnosis } : {}),
            }]);
            resolve();
          }
        };
        tick();
      });

      // ── If AI recommends a doctor, ask patient to choose consultation type ──────
      if (showDoctorBtn) {
        const allUserMessages = [...messages.filter(m => m.role === "user").map(m => m.content), userMessage];
        const fullSymptoms = allUserMessages.join(". ");
        setAccumulatedSymptoms(fullSymptoms);

        const lang = language as "en" | "ru" | "kz";
        const selectorLabels = {
          en: "How would you like to consult?",
          ru: "Как вы хотите получить консультацию?",
          kz: "Қалай кеңес алғыңыз келеді?",
        };
        setMessages(prev => [...prev, {
          role: "consultation-type-selector",
          content: selectorLabels[lang] ?? selectorLabels.ru,
        }]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("AI error:", error);
      setStreamingText("");
      const errMsg = { ru: "Произошла ошибка. Попробуйте ещё раз.", en: "An error occurred. Please try again.", kz: "Қате орын алды. Қайталап көріңіз." };
      setMessages(prev => [...prev, { role: "assistant", content: errMsg[language as keyof typeof errMsg] ?? errMsg.ru }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const handleBookAppointment = async (doctorId: number, doctorName: string, doctorRec?: DoctorRecommendation) => {
    if (doctorRec) {
      // Map DoctorRecommendation → Doctor so the modal can skip the doctor-selection step
      const mapped: Doctor = {
        id: doctorRec.id,
        name: doctorRec.name,
        email: doctorRec.email || "",
        doctor_type: doctorRec.specialization
          ? doctorRec.specialization[language as keyof typeof doctorRec.specialization] || doctorRec.doctor_type || ""
          : doctorRec.doctor_type || "",
        years_of_experience: doctorRec.years_of_experience,
        clinic: doctorRec.clinic
          ? { id: 0, name: doctorRec.clinic.name, address: doctorRec.clinic.address, city: doctorRec.clinic.city ?? undefined }
          : null,
        availability_status: "available",
        language: doctorRec.language ?? null,
      };
      setPreselectedDoctor(mapped);
    } else {
      setPreselectedDoctor(null);
    }
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = useCallback((bookingDetails: {
    doctorName: string;
    doctorType: string;
    scheduledTime: string;
    isGuest?: boolean;
  }) => {
    const date = new Date(bookingDetails.scheduledTime);
    const locale = language === "kz" ? "kk-KZ" : language === "en" ? "en-US" : "ru-RU";
    const formattedDate = date.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const formattedTime = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        role: "booking-confirmation",
        content: "",
        bookingConfirmation: {
          doctorName: bookingDetails.doctorName,
          doctorType: bookingDetails.doctorType,
          formattedDate,
          formattedTime,
        },
      }
    ]);
  }, [language]);

  const handleShowOtherDoctors = async () => {
    setIsLoading(true);
    try {
      const doctors = await aiService.getRandomDoctors();

      if (doctors.length > 0) {
        const listLabels: Record<string, string> = {
          en: "Here are other available doctors you can consult with:",
          ru: "Вот другие доступные врачи, с которыми вы можете проконсультироваться:",
          kz: "Міне, сіз кеңес ала алатын басқа қолжетімді дәрігерлер:",
        };
        setMessages((prev) => [
          ...prev,
          {
            role: "doctors-list",
            content: listLabels[language] ?? listLabels.ru,
            doctors,
          },
        ]);
      } else {
        const emptyLabels: Record<string, string> = {
          en: "Sorry, no available doctors at the moment. Please try again later.",
          ru: "Извините, в данный момент нет доступных врачей. Пожалуйста, попробуйте позже.",
          kz: "Кешіріңіз, қазіргі уақытта қолжетімді дәрігерлер жоқ. Кейінірек қайталап көріңіз.",
        };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: emptyLabels[language] ?? emptyLabels.ru },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Произошла ошибка при загрузке списка врачей. Пожалуйста, попробуйте позже." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsultationTypeSelect = async (type: ConsultationFlow) => {
    const lang = language as "en" | "ru" | "kz";

    // Mark the selector as selected so buttons become inactive
    setMessages(prev => prev.map(m =>
      m.role === "consultation-type-selector" && !m.selectedConsultationType
        ? { ...m, selectedConsultationType: type }
        : m
    ));

    const typeLabels = {
      online:      { en: "Online video consultation", ru: "Онлайн видео-консультация", kz: "Онлайн бейне кеңес" },
      offline:     { en: "In-person visit",           ru: "Оффлайн приём у врача",     kz: "Офлайн дәрігерге баю" },
      diagnostics: { en: "Diagnostics",               ru: "Диагностика",               kz: "Диагностика" },
    };
    const choiceLabel = typeLabels[type][lang] ?? typeLabels[type].ru;

    // Add user's choice as a message
    setMessages(prev => [...prev, { role: "user", content: `✅ ${choiceLabel}` }]);
    setIsLoading(true);

    try {
      if (type === "online") {
        const result = await aiService.analyzeSymptoms({
          symptoms: accumulatedSymptoms,
          language,
          clinicSlug: clinic?.clinicSlug,
        });

        if (!result.injectionBlocked && result.success && result.recommendedDoctor) {
          const cardLabels = { en: "I found the best doctor for your symptoms:", ru: "Я подобрал подходящего врача по вашим симптомам:", kz: "Симптомдарыңызға сәйкес дәрігерді таптым:" };
          setMessages(prev => [...prev, {
            role: "doctor-card",
            content: cardLabels[lang] ?? cardLabels.ru,
            doctor: result.recommendedDoctor,
            otherDoctors: result.alternativeDoctors ?? [],
          }]);
        } else {
          // Fallback to random doctors
          const doctors = await aiService.getRandomDoctors();
          const listLabels = { en: "Available doctors for online consultation:", ru: "Доступные врачи для онлайн-консультации:", kz: "Онлайн кеңеске қолжетімді дәрігерлер:" };
          setMessages(prev => [...prev, { role: "doctors-list", content: listLabels[lang] ?? listLabels.ru, doctors }]);
        }
      } else {
        const doctors = await aiService.getRandomDoctors();
        const listLabels = {
          offline:     { en: "Available doctors for in-person visit:", ru: "Доступные врачи для приёма:", kz: "Қабылдауға қолжетімді дәрігерлер:" },
          diagnostics: { en: "Available specialists for diagnostics:", ru: "Специалисты для диагностики:", kz: "Диагностикаға арналған мамандар:" },
        };
        const label = listLabels[type]?.[lang] ?? listLabels[type]?.ru;
        if (doctors.length > 0) {
          setMessages(prev => [...prev, { role: "doctors-list", content: label, doctors }]);
        } else {
          const emptyLabels = { en: "No available doctors at the moment. Try again later.", ru: "В данный момент нет доступных врачей. Попробуйте позже.", kz: "Қазіргі уақытта дәрігерлер жоқ. Кейінірек қайталаңыз." };
          setMessages(prev => [...prev, { role: "assistant", content: emptyLabels[lang] ?? emptyLabels.ru }]);
        }
      }
    } catch {
      const errLabels = { en: "Error loading doctors. Please try again.", ru: "Ошибка загрузки врачей. Попробуйте ещё раз.", kz: "Дәрігерлерді жүктеу қатесі. Қайталап көріңіз." };
      setMessages(prev => [...prev, { role: "assistant", content: errLabels[lang] ?? errLabels.ru }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимальный размер: 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isSlotFuture = (slot?: { date: string; time: string }) => {
    if (!slot) return false;
    return new Date(`${slot.date}T${slot.time}:00`) > new Date();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #ebf1ff 0%, #ffffff 50%, #ebf1ff 100%)" }}>
      {/* Header — matches landing page scrolled style */}
      <header className="bg-[#1D1D2F]/95 backdrop-blur-xl shadow-xl border-b border-white/[0.07]">
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left — Back + Logo + Bot identity */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl transition-all hover:scale-105 hover:bg-white/10 text-sm sm:text-base text-white/80 hover:text-white"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs sm:text-sm" />
                <span className="hidden sm:inline font-medium">{ui.back}</span>
              </button>

              <div className="w-px h-6 bg-white/15 hidden sm:block" />

              <Image
                src={Logo}
                alt="ZhanCare logo"
                height={32}
                className="h-6 sm:h-8 w-auto"
              />

              <div className="w-px h-6 bg-white/15 hidden md:block" />

              {/* Bot identity */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl blur-lg opacity-40"
                    style={{ background: "#3772ff" }}
                  />
                  <div
                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                  >
                    <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-sm text-white leading-tight">{ui.title}</p>
                  <p className="text-[11px] flex items-center gap-1 text-[#6aa2ff] leading-tight">
                    <FontAwesomeIcon icon={faHeartPulse} className="text-[10px]" />
                    {ui.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side — language switcher + online badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher currentLanguage={language} setLanguage={setLanguage} variant="dark" />

              {/* Online Badge */}
              <div className="hidden sm:block px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap text-white/80 border border-white/20 bg-white/10">
                {ui.online}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl space-y-4 sm:space-y-6">
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border"
            style={{
              background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
              borderColor: "#2956bf"
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCircleCheck} className="text-white text-base sm:text-xl" />
              </div>
              <div className="text-white">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">
                  {clinic ? ui.welcomeClinic(clinic.clinicName) : ui.welcomeTitle}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {clinic?.welcomeMessage || ui.welcomeDesc}
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{ui.aiLabel}</span>
                      </div>
                      {message.preliminaryDiagnosis && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 mb-2 px-4 py-2.5 rounded-xl border"
                          style={{ background: "#fffbeb", borderColor: "#fde68a" }}
                        >
                          <span className="text-base flex-shrink-0 mt-px">🔍</span>
                          <div>
                            <span className="text-xs font-semibold block mb-0.5" style={{ color: "#92400e" }}>
                              {language === "en" ? "Preliminary" : language === "kz" ? "Болжамды диагноз" : "Примерный диагноз"}
                            </span>
                            <span className="text-sm font-medium" style={{ color: "#78350f" }}>
                              {message.preliminaryDiagnosis}
                            </span>
                          </div>
                        </motion.div>
                      )}
                      <div
                        className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border"
                        style={{
                          background: "white",
                          borderColor: "#e1eaff"
                        }}
                      >
                        <div className="text-sm sm:text-base break-words" style={{ color: "#283353", overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {formatAIMessage(message.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : message.role === "booking-confirmation" && message.bookingConfirmation ? (() => {
                  const bc = message.bookingConfirmation;
                  const labels = {
                    title:   { en: "Appointment Confirmed!", ru: "Запись подтверждена!", kz: "Жазылу расталды!" },
                    booked:  { en: `You have successfully booked an appointment with`, ru: `Вы успешно записались к врачу`, kz: `Дәрігерге сәтті жазылдыңыз:` },
                    date:    { en: "Date", ru: "Дата", kz: "Күні" },
                    time:    { en: "Time", ru: "Время", kz: "Уақыты" },
                    type:    { en: "Online video consultation", ru: "Онлайн видеоконсультация", kz: "Онлайн бейне кеңес" },
                    remind:  { en: "You will receive a reminder before your appointment.", ru: "Вы получите напоминание перед консультацией.", kz: "Кеңес алдында еске салу аласыз." },
                  };
                  const l = language as "en" | "ru" | "kz";
                  return (
                    <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                      >
                        <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                      </div>
                      <div className="flex-1">
                        <div
                          className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border"
                          style={{ background: "white", borderColor: "#e1eaff" }}
                        >
                          {/* Green header */}
                          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                              <FontAwesomeIcon icon={faCircleCheck} className="text-white text-lg" />
                            </div>
                            <p className="text-white font-bold text-sm sm:text-base">{labels.title[l]}</p>
                          </div>

                          {/* Body */}
                          <div className="px-5 py-4 space-y-3">
                            {/* Doctor row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ebf1ff" }}>
                                <FontAwesomeIcon icon={faUserMd} className="text-sm" style={{ color: "#2956bf" }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.booked[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.doctorName}</p>
                                <p className="text-xs" style={{ color: "#3772ff" }}>{bc.doctorType}</p>
                              </div>
                            </div>

                            <div className="border-t border-gray-100" />

                            {/* Date row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ebf1ff" }}>
                                <FontAwesomeIcon icon={faCalendarDays} className="text-sm" style={{ color: "#2956bf" }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.date[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedDate}</p>
                              </div>
                            </div>

                            {/* Time row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ebf1ff" }}>
                                <FontAwesomeIcon icon={faClock} className="text-sm" style={{ color: "#2956bf" }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.time[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedTime}</p>
                              </div>
                            </div>

                            <div className="border-t border-gray-100" />

                            {/* Type row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ebf1ff" }}>
                                <FontAwesomeIcon icon={faVideo} className="text-sm" style={{ color: "#2956bf" }} />
                              </div>
                              <p className="text-sm font-medium text-gray-700">{labels.type[l]}</p>
                            </div>

                            {/* Reminder note */}
                            <div className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                              <FontAwesomeIcon icon={faBell} className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                              <p className="text-xs text-green-800">{labels.remind[l]}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : message.role === "doctor-card" && message.doctor ? (() => {
                  // Detect language for doctor card labels
                  const detectLang = () => {
                    const lastAssistant = messages.filter(m => m.role === "assistant").pop();
                    const text = lastAssistant?.content || "";
                    const hasEnglish = /[a-zA-Z]/.test(text);
                    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
                    const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);
                    if (hasEnglish && !hasCyrillic) return "en";
                    if (hasKazakh) return "kz";
                    return "ru";
                  };
                  const lang = detectLang();


                  const labels = {
                    doctorRecommendation: { en: "Doctor Recommendation", ru: "Рекомендация врача", kz: "Дәрігер ұсынысы" },
                    bookAppointment: { en: "Book Appointment", ru: "Записаться на прием", kz: "Жазылу" },
                    showOtherDoctors: { en: "Show Other Doctors", ru: "Показать других врачей", kz: "Басқа дәрігерлерді көрсету" },
                    urgentConsultation: { en: "Urgent Consultation", ru: "Срочная консультация", kz: "Шұғыл кеңес" },
                    experience: { en: "years experience", ru: "лет опыта", kz: "жыл тәжірибе" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника" }
                  };

                  // Get specialization in current language
                  const doctorSpecialization = message.doctor.specialization
                    ? message.doctor.specialization[lang as keyof typeof message.doctor.specialization]
                    : message.doctor.doctor_type || "Doctor";

                  const otherDoctorLabels = {
                    bestMatch: { en: "Best Match", ru: "Лучший выбор", kz: "Ең жақсы таңдау" },
                    alsoAvailable: { en: "Also available:", ru: "Также доступны:", kz: "Сонымен қатар қолжетімді:" },
                    viewAll: { en: "View all doctors →", ru: "Показать всех врачей →", kz: "Барлық дәрігерлерді көрсету →" },
                    book: { en: "Book", ru: "Записаться", kz: "Жазылу" },
                  };

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{labels.doctorRecommendation[lang as keyof typeof labels.doctorRecommendation]}</span>
                      </div>

                      {/* ── BEST MATCH card ── */}
                      <div
                        className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 relative mb-3"
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)",
                          borderColor: "#60a5fa",
                          boxShadow: "0 20px 60px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                        }}
                      >
                        {/* Urgent badge */}
                        {message.doctor.urgency === "urgent" && (
                          <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
                            <div className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faHeartPulse} className="text-white text-sm animate-pulse" />
                              <span className="text-white text-xs font-bold uppercase tracking-wider">{labels.urgentConsultation[lang as keyof typeof labels.urgentConsultation]}</span>
                            </div>
                          </div>
                        )}

                        {/* Decorative glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", filter: "blur(40px)" }}></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", filter: "blur(30px)" }}></div>

                        <div className="relative px-5 py-5 sm:px-6 sm:py-5">
                          {/* Best match pill */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 text-xs font-bold" style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
                            <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[10px]" />
                            <span className="text-amber-200">{otherDoctorLabels.bestMatch[lang as keyof typeof otherDoctorLabels.bestMatch]}</span>
                          </div>

                          {/* Doctor header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative flex-shrink-0">
                              <div
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)",
                                  backdropFilter: "blur(10px)",
                                  boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)"
                                }}
                              >
                                <FontAwesomeIcon icon={faUserMd} className="text-white text-xl sm:text-2xl" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-blue-900 animate-pulse" style={{ background: "#10b981" }}></div>
                            </div>
                            <div className="flex-1 pt-0.5">
                              <h3 className="text-white font-bold text-base sm:text-lg mb-1 leading-tight">{message.doctor.name}</h3>
                              <p className="text-blue-200 text-xs sm:text-sm mb-2">{doctorSpecialization}</p>
                              <div className="flex flex-wrap gap-2">
                                {message.doctor.years_of_experience && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                                    <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[9px]" />
                                    <span className="text-white">{message.doctor.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                  </div>
                                )}
                                {message.doctor.clinic?.rating && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(251,191,36,0.15)" }}>
                                    <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[9px]" />
                                    <span className="text-amber-200">{message.doctor.clinic.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Clinic row */}
                          {message.doctor.clinic && (
                            <div className="flex items-center gap-2 mb-4 text-xs text-blue-200">
                              <FontAwesomeIcon icon={faHospital} className="text-blue-300 text-[11px] flex-shrink-0" />
                              <span className="font-medium text-white">{message.doctor.clinic.name}</span>
                              {message.doctor.clinic.city && <><span>·</span><FontAwesomeIcon icon={faLocationDot} className="text-blue-300 text-[10px] flex-shrink-0" /><span>{message.doctor.clinic.city}</span></>}
                            </div>
                          )}

                          {/* Nearest available slot */}
                          {isSlotFuture(message.doctor.nearest_slot) && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                              <FontAwesomeIcon icon={faClock} className="text-blue-200 text-[11px] flex-shrink-0" />
                              <span className="text-white opacity-90">
                                {{
                                  ru: "Ближайший слот:",
                                  en: "Nearest slot:",
                                  kz: "Жақын слот:",
                                }[lang as "ru" | "en" | "kz"] ?? "Ближайший слот:"}
                              </span>
                              <span className="text-white font-bold">{message.doctor.nearest_slot?.label}</span>
                            </div>
                          )}

                          {/* Primary CTA */}
                          <button
                            onClick={() => handleBookAppointment(message.doctor!.id, message.doctor!.name, message.doctor!)}
                            disabled={isLoading}
                            className="w-full py-3.5 font-bold rounded-xl transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                              color: "#1e40af",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative flex items-center justify-center gap-2 text-sm sm:text-base">
                              <span>{labels.bookAppointment[lang as keyof typeof labels.bookAppointment]}</span>
                              <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* ── OTHER DOCTORS (2 compact cards) ── */}
                      {message.otherDoctors && message.otherDoctors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-semibold mb-2 px-1" style={{ color: "#6b7280" }}>
                            {otherDoctorLabels.alsoAvailable[lang as keyof typeof otherDoctorLabels.alsoAvailable]}
                          </p>
                          <div className={`grid gap-2 ${message.otherDoctors.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {message.otherDoctors.map((doc, idx) => {
                              const docSpec = doc.specialization
                                ? doc.specialization[lang as keyof typeof doc.specialization]
                                : doc.doctor_type || "Doctor";
                              return (
                                <div
                                  key={doc.id || idx}
                                  className="rounded-2xl overflow-hidden border relative"
                                  style={{
                                    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                                    borderColor: "#93c5fd",
                                    boxShadow: "0 6px 20px rgba(37,99,235,0.25)"
                                  }}
                                >
                                  <div className="px-3 py-3">
                                    {/* Avatar + status */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="relative flex-shrink-0">
                                        <div
                                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                                          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                                        >
                                          <FontAwesomeIcon icon={faUserMd} className="text-white text-sm" />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-blue-900" style={{ background: "#10b981" }}></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-xs leading-tight truncate">{doc.name}</p>
                                        <p className="text-blue-200 text-[10px] truncate">{docSpec}</p>
                                      </div>
                                    </div>

                                    {/* Experience */}
                                    {doc.years_of_experience && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mb-2.5" style={{ background: "rgba(255,255,255,0.15)" }}>
                                        <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[9px]" />
                                        <span className="text-white font-medium">{doc.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                      </div>
                                    )}

                                    {/* Book button */}
                                    <button
                                      onClick={() => handleBookAppointment(doc.id, doc.name, doc)}
                                      disabled={isLoading}
                                      className="w-full py-2 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                                      style={{
                                        background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                                        color: "#1e40af",
                                        boxShadow: "0 3px 8px rgba(0,0,0,0.15)"
                                      }}
                                    >
                                      {otherDoctorLabels.book[lang as keyof typeof otherDoctorLabels.book]} →
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* View all doctors link */}
                      <button
                        onClick={handleShowOtherDoctors}
                        disabled={isLoading}
                        className="w-full py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                        style={{
                          background: "rgba(37,99,235,0.08)",
                          color: "#2563eb",
                          border: "1px solid rgba(37,99,235,0.2)"
                        }}
                      >
                        {otherDoctorLabels.viewAll[lang as keyof typeof otherDoctorLabels.viewAll]}
                      </button>
                    </div>
                  </div>
                  );
                })() : message.role === "doctors-list" && message.doctors ? (() => {
                  // Detect language for doctors list
                  const detectLang = () => {
                    const text = message.content || "";
                    const hasEnglish = /[a-zA-Z]/.test(text);
                    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
                    const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);
                    if (hasEnglish && !hasCyrillic) return "en";
                    if (hasKazakh) return "kz";
                    return "ru";
                  };
                  const lang = detectLang();

                  const labels = {
                    book: { en: "Book", ru: "Записаться", kz: "Жазылу" },
                    experience: { en: "years exp", ru: "лет опыта", kz: "жыл тәжірибе" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника" }
                  };

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{message.content}</span>
                      </div>
                      <div className="space-y-3">
                        {message.doctors.map((doctor, idx) => {
                          // Get specialization in current language
                          const doctorSpecialization = doctor.specialization
                            ? doctor.specialization[lang as keyof typeof doctor.specialization]
                            : doctor.doctor_type || "Doctor";

                          return (
                            <div
                              key={doctor.id || idx}
                              className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border relative"
                              style={{
                                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                                borderColor: "#60a5fa",
                                boxShadow: "0 10px 40px rgba(37, 99, 235, 0.3)"
                              }}
                            >
                              {/* Decorative elements */}
                              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", filter: "blur(20px)" }}></div>

                              <div className="relative px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex items-start gap-3 mb-3">
                                  {/* Avatar */}
                                  <div className="relative flex-shrink-0">
                                    <div
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                                      style={{
                                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
                                        backdropFilter: "blur(10px)",
                                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)"
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faUserMd} className="text-white text-sm sm:text-base" />
                                    </div>
                                    {/* Status dot */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-blue-900" style={{ background: "#10b981" }}></div>
                                  </div>

                                  <div className="flex-1">
                                    <h3 className="text-white font-bold text-sm sm:text-base mb-0.5 leading-tight">{doctor.name}</h3>
                                    <p className="text-blue-100 text-xs sm:text-sm mb-1.5">{doctorSpecialization}</p>
                                    {doctor.years_of_experience && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
                                        <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[9px]" />
                                        <span className="text-white font-semibold">{doctor.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Clinic Info */}
                                {doctor.clinic && (
                                  <div
                                    className="rounded-lg p-2.5 mb-3"
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      backdropFilter: "blur(10px)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)"
                                    }}
                                  >
                                    <p className="text-white text-xs font-semibold mb-1.5">{doctor.clinic.name}</p>
                                    <div className="flex items-center justify-between gap-2">
                                      {doctor.clinic.city && (
                                        <div className="flex items-center gap-1">
                                          <FontAwesomeIcon icon={faLocationDot} className="text-blue-300 text-[9px]" />
                                          <span className="text-blue-100 text-xs">{doctor.clinic.city}</span>
                                        </div>
                                      )}
                                      {doctor.clinic.rating && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(251, 191, 36, 0.15)" }}>
                                          <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[9px]" />
                                          <span className="text-amber-200 text-xs font-bold">{doctor.clinic.rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Nearest slot for alternative doctor */}
                                {isSlotFuture(doctor.nearest_slot) && (
                                  <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                    <FontAwesomeIcon icon={faClock} className="text-blue-200 text-[11px] flex-shrink-0" />
                                    <span className="text-white font-semibold">{doctor.nearest_slot?.label}</span>
                                  </div>
                                )}

                                {/* Book Button */}
                                <button
                                  onClick={() => handleBookAppointment(doctor.id, doctor.name, doctor)}
                                  disabled={isLoading}
                                  className="w-full py-2.5 sm:py-3 font-bold rounded-lg sm:rounded-xl transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                                    color: "#1e40af",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                                  }}
                                >
                                  <span className="relative flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                                    <span>{labels.book[lang as keyof typeof labels.book]}</span>
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })() : message.role === "time-slots" && message.timeSlots ? (() => {
                  // Detect language for time slots
                  const detectLang = () => {
                    const lastAssistant = messages.filter(m => m.role === "assistant").pop();
                    const text = lastAssistant?.content || "";
                    const hasEnglish = /[a-zA-Z]/.test(text);
                    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
                    const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);
                    if (hasEnglish && !hasCyrillic) return "en";
                    if (hasKazakh) return "kz";
                    return "ru";
                  };
                  const lang = detectLang();

                  const labels = {
                    selectTime: { en: "Select time", ru: "Выберите время", kz: "Уақытты таңдаңыз" },
                    bookSlot: { en: "Book", ru: "Забронировать", kz: "Брондау" },
                    noSlots: { en: "No available time slots", ru: "Нет доступного времени", kz: "Қолжетімді уақыт жоқ" }
                  };

                  const handleTimeSlotClick = (slot: TimeSlot) => {
                    if (!slot.available) return;

                    // TODO: Implement booking confirmation
                    console.log("Selected slot:", slot);
                    alert(`Selected: ${slot.date} at ${slot.time}`);
                  };

                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    const months = {
                      en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                      ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
                      kz: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"]
                    };
                    const monthNames = months[lang as keyof typeof months] || months.ru;
                    return `${date.getDate()} ${monthNames[date.getMonth()]}`;
                  };

                  // Group slots by date
                  const slotsByDate = message.timeSlots.reduce((acc, slot) => {
                    if (!acc[slot.date]) {
                      acc[slot.date] = [];
                    }
                    acc[slot.date].push(slot);
                    return acc;
                  }, {} as Record<string, TimeSlot[]>);

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{message.content}</span>
                      </div>

                      {Object.keys(slotsByDate).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(slotsByDate).map(([date, slots]) => (
                            <div key={date}>
                              <div className="mb-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#ebf1ff" }}>
                                <span className="text-sm font-bold" style={{ color: "#2956bf" }}>{formatDate(date)}</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {slots.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => handleTimeSlotClick(slot)}
                                    disabled={!slot.available}
                                    className="px-3 py-2 rounded-xl font-semibold text-sm transition-all relative overflow-hidden group"
                                    style={{
                                      background: slot.available
                                        ? "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)"
                                        : "rgba(203, 213, 225, 0.3)",
                                      color: slot.available ? "#1e40af" : "#94a3b8",
                                      border: slot.available ? "2px solid #3772ff" : "2px solid transparent",
                                      cursor: slot.available ? "pointer" : "not-allowed",
                                      boxShadow: slot.available ? "0 2px 8px rgba(37, 99, 235, 0.2)" : "none"
                                    }}
                                    onMouseEnter={(e) => {
                                      if (slot.available) {
                                        e.currentTarget.style.transform = "scale(1.05)";
                                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.4)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (slot.available) {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(37, 99, 235, 0.2)";
                                      }
                                    }}
                                  >
                                    <FontAwesomeIcon
                                      icon={faClock}
                                      className="mr-1.5 text-xs"
                                      style={{ color: slot.available ? "#3772ff" : "#94a3b8" }}
                                    />
                                    {slot.time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="rounded-2xl px-4 py-3 text-center"
                          style={{ background: "#ebf1ff" }}
                        >
                          <p className="text-sm font-semibold" style={{ color: "#2956bf" }}>
                            {labels.noSlots[lang as keyof typeof labels.noSlots]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })() : message.role === "consultation-type-selector" ? (() => {
                  const isSelected = !!message.selectedConsultationType;
                  const typeConfig = [
                    { type: 'online'      as ConsultationFlow, label: { en: "Online",      ru: "Онлайн",      kz: "Онлайн"      }, sub: { en: "video consultation", ru: "видео-консультация", kz: "бейне кеңес" }, icon: faVideo,        bg: "#1d4ed8" },
                    { type: 'offline'     as ConsultationFlow, label: { en: "Offline",     ru: "Оффлайн",     kz: "Оффлайн"     }, sub: { en: "in-person visit",   ru: "приём у врача",     kz: "дәрігерге баю" }, icon: faHouse,        bg: "#0f766e" },
                    { type: 'diagnostics' as ConsultationFlow, label: { en: "Diagnostics", ru: "Диагностика", kz: "Диагностика" }, sub: { en: "tests & exams",     ru: "анализы и обследование", kz: "талдау және тексеру" }, icon: faStethoscope, bg: "#7c3aed" },
                  ];
                  const lang = language as "en" | "ru" | "kz";
                  const actionLabel = { en: { online: "Start", offline: "Book", diagnostics: "Book" }, ru: { online: "Начать", offline: "Записаться", diagnostics: "Записаться" }, kz: { online: "Бастау", offline: "Жазылу", diagnostics: "Жазылу" } };
                  return (
                    <div className="max-w-[92%] sm:max-w-[88%] flex gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
                        <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="px-2 py-1 rounded-lg mb-3 inline-block" style={{ background: "#ebf1ff" }}>
                          <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{message.content}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {typeConfig.map(({ type, label, sub, icon, bg }) => {
                            const chosen = message.selectedConsultationType === type;
                            return (
                              <motion.button
                                key={type}
                                onClick={() => !isSelected && handleConsultationTypeSelect(type)}
                                whileHover={!isSelected ? { y: -2, scale: 1.02 } : {}}
                                whileTap={!isSelected ? { scale: 0.97 } : {}}
                                disabled={isSelected}
                                className="group relative flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-left transition-all duration-200"
                                style={{
                                  backgroundColor: bg,
                                  opacity: isSelected && !chosen ? 0.4 : 1,
                                  cursor: isSelected ? "default" : "pointer",
                                  outline: chosen ? "2px solid white" : "none",
                                  outlineOffset: "2px",
                                }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-xl" />
                                <div className="relative w-8 h-8 rounded-lg bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0">
                                  <FontAwesomeIcon icon={icon} className="text-sm" />
                                </div>
                                <div className="relative flex-1 min-w-0">
                                  <p className="text-xs font-bold leading-tight">{label[lang]}</p>
                                  <p className="text-[10px] opacity-60 mt-0.5 truncate">{sub[lang]}</p>
                                </div>
                                {chosen && (
                                  <div className="relative">
                                    <FontAwesomeIcon icon={faCircleCheck} className="text-white text-sm" />
                                  </div>
                                )}
                                {!isSelected && (
                                  <div className="relative flex items-center gap-0.5 text-[10px] font-semibold opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    {actionLabel[lang]?.[type]} <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="max-w-[90%] sm:max-w-[85%]">
                    <div
                      className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                      }}
                    >
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Attached"
                          className="max-w-full rounded-xl mb-2"
                          style={{ maxHeight: "300px", objectFit: "contain" }}
                        />
                      )}
                      <p className="text-white text-sm sm:text-base leading-relaxed break-words" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{message.content}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {(isLoading || streamingText) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                </div>
                <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border" style={{ background: "white", borderColor: "#e1eaff" }}>
                  {streamingText ? (
                    <div className="text-sm sm:text-base break-words" style={{ color: "#283353", overflowWrap: "break-word", wordBreak: "break-word" }}>
                      {formatAIMessage(streamingText)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm sm:text-base" style={{ color: "#3772ff" }} />
                      <span className="text-sm sm:text-base" style={{ color: "#283353" }}>
                        {{ ru: "Анализирую симптомы...", en: "Analysing symptoms...", kz: "Симптомдарды талдаймын..." }[language as "ru" | "en" | "kz"] ?? "Анализирую симптомы..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t" style={{ borderColor: "#e1eaff" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-[200px] max-h-[200px] rounded-xl border-2"
                style={{ borderColor: "#3772ff" }}
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
          )}

          <div className="relative">
            {/* Combined Input Container */}
            <div className="relative rounded-3xl border-2 transition-all shadow-lg"
              style={{
                borderColor: "#3772ff",
                background: "#ffffff"
              }}
            >
              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={ui.placeholder}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-3xl focus:outline-none focus:ring-0 focus:border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-transparent text-xs sm:text-sm lg:text-base resize-none overflow-hidden break-words border-0"
                  style={{
                    minHeight: "40px",
                    maxHeight: "120px",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    boxShadow: "none",
                    border: "none",
                    outline: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none"
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "40px";
                    const newHeight = Math.min(target.scrollHeight, 120);
                    target.style.height = newHeight + "px";
                    // Only show scroll if content exceeds max height
                    target.style.overflowY = target.scrollHeight > 120 ? "auto" : "hidden";
                  }}
                />

                {/* Right Side Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: imagePreview ? "#3772ff" : "transparent",
                    color: imagePreview ? "white" : "#3772ff"
                  }}
                >
                  <FontAwesomeIcon
                    icon={faImage}
                    className="text-sm sm:text-base"
                  />
                </button>

                {/* Voice Recording Button */}
                <button
                  onClick={toggleRecording}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: isRecording ? "#ef4444" : "transparent",
                    color: isRecording ? "white" : "#3772ff"
                  }}
                >
                  <FontAwesomeIcon
                    icon={isRecording ? faStop : faMicrophone}
                    className={`text-sm sm:text-base ${isRecording ? "animate-pulse" : ""}`}
                  />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !imagePreview) || isLoading}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                  style={{
                    background: (input.trim() || imagePreview) && !isLoading
                      ? "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)"
                      : "#bcc0ca"
                  }}
                  onMouseEnter={(e) => {
                    if ((input.trim() || imagePreview) && !isLoading) {
                      e.currentTarget.style.transform = "scale(1.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* Glow effect */}
                  {(input.trim() || imagePreview) && !isLoading && (
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-50 -z-10"
                      style={{ background: "#3772ff" }}
                    />
                  )}
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs sm:text-sm" />
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[8px] xs:text-[9px] sm:text-xs px-2" style={{ color: "#3772ff" }}>
            <span className="font-medium whitespace-nowrap">{ui.enterHint}</span>
            <span className="whitespace-nowrap" style={{ color: "#bcc0ca" }}>•</span>
            <span className="font-medium whitespace-nowrap">{ui.shiftHint}</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => { setIsBookingModalOpen(false); setPreselectedDoctor(null); }}
        onBookingComplete={handleBookingComplete}
        language={language}
        preselectedDoctor={preselectedDoctor}
      />
    </div>
  );
}
