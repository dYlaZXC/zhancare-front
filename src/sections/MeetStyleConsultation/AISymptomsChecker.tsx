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
  faLocationCrosshairs,
  faDoorOpen,
  faMapLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import { useBrand } from "@/context/BrandContext";
import BookingModal from "@/sections/Chat/BookingModal";
import InlineBookingCard from "@/sections/MeetStyleConsultation/InlineBookingCard";
import DiagnosticsBookingModal from "@/sections/Chat/DiagnosticsBookingModal";
import LanguageSwitcher from "@/sections/Hero/LanguageSwitcher";
import type { Doctor } from "@/components/services/consultations/types/doctor";
import { aiService, isInjectionAttempt, CHAT_ENDPOINT, CHAT_UPLOAD_ENDPOINT } from "@/lib/ai";
import type { ClinicContext, DoctorRecommendation, DiagnosticsServiceItem } from "@/lib/ai";
import { buildWhatsAppLink, consultationWhatsAppMessage } from "@/lib/whatsapp";

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
  meetingId?: string;
  consultationId?: number;
  consultationType?: 'online' | 'offline' | 'diagnostics';
  clinicName?: string;
  clinicAddress?: string;
  roomNumber?: string | null;
  gis2Url?: string;
  price?: string | null;
}

type ConsultationFlow = 'online' | 'offline' | 'diagnostics';

interface Message {
  role: "user" | "assistant" | "doctor-card" | "doctors-list" | "diagnostics-list" | "time-slots" | "booking-confirmation" | "consultation-type-selector" | "geolocation-prompt" | "booking-flow" | "offline-no-doctors";
  content: string;
  doctor?: DoctorRecommendation;
  doctors?: DoctorRecommendation[];
  otherDoctors?: DoctorRecommendation[];
  diagnosticsServices?: DiagnosticsServiceItem[];
  timeSlots?: TimeSlot[];
  doctorId?: number;
  doctorName?: string;
  imageUrl?: string;
  bookingConfirmation?: BookingConfirmationData;
  selectedConsultationType?: ConsultationFlow;
  preliminaryDiagnosis?: string;
  consultationType?: ConsultationFlow;
  isChoice?: boolean;
  bookingFlowConsultationType?: "online" | "offline";
  bookingFlowInitialSlot?: { date: string; time: string };
  showAll?: boolean;
}

// ─── Color utilities ──────────────────────────────────────────────────────────

function darkenHex(hex: string, factor = 0.72): string {
  const h = hex.replace('#', '').padEnd(6, '0');
  return '#' + [0, 2, 4]
    .map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0'))
    .join('');
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').padEnd(6, '0');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
}

/** Returns '#1a1a1a' for light backgrounds and '#ffffff' for dark ones. */
function getContrastColor(hex: string): string {
  const h = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ perceived brightness — threshold 135 works for all preset brand colors
  return (r * 299 + g * 587 + b * 114) / 1000 > 135 ? '#1a1a1a' : '#ffffff';
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
const formatAIMessage = (content: string, accentColor = "#3772ff") => {
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
              <span className="font-semibold flex-shrink-0 w-5 text-right" style={{ color: accentColor }}>
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
                style={{ width: 6, height: 6, background: accentColor }}
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
  uz: {
    back: "Orqaga",
    title: "AI Tibbiy Yordamchi",
    subtitle: "Simptomlar diagnostikasi",
    online: "Onlayn",
    welcomeTitle: "JonBot.Ai-ga xush kelibsiz",
    welcomeClinic: (name: string) => `${name}-ga xush kelibsiz`,
    welcomeDesc: "Men sizning simptomlaringizning dastlabki diagnostikasini o'tkazaman va mos mutaxassisni tanlashga yordam beraman. Barcha ma'lumotlar maxfiy va himoyalangan.",
    aiLabel: "AI Yordamchi",
    placeholder: "Simptomlaringizni tasvirlang...",
    enterHint: "Enter - yuborish",
    shiftHint: "Shift+Enter - yangi qator",
  },
};

type SavedMessage = { role: "user" | "assistant"; content: string; imageUrl?: string };

interface DoctorSearchResult {
  id: number; name: string; doctor_type?: string;
  specialization?: { ru?: string; en?: string; kz?: string; uz?: string };
  years_of_experience?: number; online_consultation_price?: number;
  clinic?: { name?: string };
}

function DoctorSearchBox({ onBook, lang, clinicSlug, accentGrad }: {
  onBook: (id: number, name: string, doc: DoctorSearchResult) => void;
  lang: string; clinicSlug?: string; accentGrad: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const params = new URLSearchParams({ search: q });
    if (clinicSlug) params.set("clinic_slug", clinicSlug);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultations/get-random-doctors/?${params}`)
      .then(r => r.json())
      .then(data => { setResults(Array.isArray(data) ? data : (data.doctors ?? [])); setSearched(true); })
      .catch(() => { setResults([]); setSearched(true); })
      .finally(() => setLoading(false));
  };

  const handleChange = (v: string) => {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 380);
  };

  const placeholder: Record<string, string> = { ru: "Имя врача...", en: "Doctor name...", kz: "Дәрігер аты...", uz: "Shifokor ismi..." };
  const notFound: Record<string, string> = { ru: "Врачи не найдены", en: "No doctors found", kz: "Дәрігер табылмады", uz: "Shifokor topilmadi" };
  const bookLbl: Record<string, string> = { ru: "Записаться", en: "Book", kz: "Жазылу", uz: "Yozilish" };
  const searchLbl: Record<string, string> = { ru: "Знаете врача? Найти по имени", en: "Know a doctor? Search by name", kz: "Дәрігерді білесіз бе? Атымен іздеу", uz: "Shifokorni bilasizmi? Ism bo'yicha qidiring" };

  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold mb-2 px-1" style={{ color: "#6b7280" }}>{searchLbl[lang] ?? searchLbl.ru}</p>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder[lang] ?? placeholder.ru}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.18)", color: "#1e293b", fontSize: 13 }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(37,99,235,0.45)"; (e.target as HTMLInputElement).style.background = "rgba(37,99,235,0.10)"; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(37,99,235,0.18)"; (e.target as HTMLInputElement).style.background = "rgba(37,99,235,0.06)"; }}
        />
        {loading && <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" width="13" height="13" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-18 0"/></svg>}
      </div>

      {searched && (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 ? (
            <p className="text-center text-xs py-3" style={{ color: "#9ca3af" }}>{notFound[lang] ?? notFound.ru}</p>
          ) : results.map(doc => {
            const spec = doc.specialization ? (doc.specialization[lang as keyof typeof doc.specialization] ?? doc.doctor_type ?? "Врач") : (doc.doctor_type ?? "Врач");
            return (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.14)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accentGrad }}>
                  <svg width="13" height="13" fill="white" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: "#1e293b" }}>{doc.name}</p>
                  <p className="text-[11px] truncate" style={{ color: "#64748b" }}>{spec}{doc.years_of_experience ? ` · ${doc.years_of_experience} л.` : ""}</p>
                </div>
                <button
                  onClick={() => onBook(doc.id, doc.name, doc)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ background: accentGrad }}
                >
                  {bookLbl[lang] ?? bookLbl.ru}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AISymptomsChecker({ clinic, embedded, initialInput, initialImageUrl, autoSend, initialMessages, onMessagesChange }: { clinic?: ClinicContext; embedded?: boolean; initialInput?: string; initialImageUrl?: string; autoSend?: boolean; initialMessages?: SavedMessage[]; onMessagesChange?: (msgs: SavedMessage[]) => void }) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { appLogo, brand } = useBrand();
  const accentColor = clinic?.primaryColor ?? "#3772ff";
  const accentDark = darkenHex(accentColor);
  const accentGrad = `linear-gradient(135deg, ${accentColor} 0%, ${accentDark} 100%)`;
  const accentLight = hexToRgba(accentColor, 0.1);
  const accentPageBg = `linear-gradient(135deg, ${hexToRgba(accentColor, 0.07)} 0%, #ffffff 50%, ${hexToRgba(accentColor, 0.07)} 100%)`;
  // text color to use on accent-colored backgrounds (black for bright colors, white for dark)
  const onAccent = getContrastColor(accentColor);

  const ui = UI[language as keyof typeof UI] ?? UI.ru;

  // Get initial welcome message based on language
  const getWelcomeMessage = () => {
    switch (language) {
      case "en":
        return "Hello! I'm your medical AI assistant. Please tell me what's bothering you? Describe your symptoms in detail. You can also attach photos of symptoms (rash, redness, etc.).";
      case "kz":
        return "Сәлеметсіз бе! Мен сіздің медициналық AI көмекшісімін. Сізді не алаңдатып тұр? Симптомдарыңызды толық сипаттаңыз. Сондай-ақ симптомдардың фотосуреттерін тіркеуге болады (бөртпе, қызару және т.б.).";
      case "uz":
        return "Salom! Men sizning tibbiy AI yordamchingizman. Sizni nima bezovta qilmoqda? Simptomlaringizni batafsil tasvirlab bering. Shuningdek, simptomlar fotosuratlarini biriktirishingiz mumkin (toshma, qizarish va h.k.).";
      case "ru":
      default:
        return clinic?.welcomeMessage ||
          "Здравствуйте! Я ваш медицинский ИИ-ассистент. Расскажите, пожалуйста, что вас беспокоит? Опишите ваши симптомы подробно. Вы также можете прикрепить фото симптомов (сыпь, покраснения и т.д.).";
    }
  };

  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : embedded ? [] : [{ role: "assistant", content: clinic?.welcomeMessage ?? getWelcomeMessage() }]
  );
  const [input, setInput] = useState(initialInput ?? "");
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;
  useEffect(() => {
    if (!onMessagesChangeRef.current) return;
    const simple = messages
      .filter((m): m is Message & { role: "user" | "assistant" } => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role, content: m.content, ...(m.imageUrl ? { imageUrl: m.imageUrl } : {}) }));
    onMessagesChangeRef.current(simple);
  }, [messages]);
  const sendFnRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl ?? null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedDoctor, setPreselectedDoctor] = useState<Doctor | null>(null);
  const [bookingConsultationType, setBookingConsultationType] = useState<'online' | 'offline'>('online');
  const [isDiagBookingOpen, setIsDiagBookingOpen] = useState(false);
  const [selectedDiagService, setSelectedDiagService] = useState<DiagnosticsServiceItem | null>(null);
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
              : language === "uz"
              ? "Men tibbiy yordamchiman va rolimni o'zgartira olmayman. Iltimos, simptomlaringizni tasvirlang — men shifokor tanlashga yordam beraman."
              : "Я медицинский ассистент и не могу изменить свою роль. Пожалуйста, опишите ваши симптомы — я помогу подобрать врача.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage, imageUrl: userImage || undefined }]);
    setIsLoading(true);

    try {
      // Only block pure greetings (hi, hello, привет, salom) with no medical content at all
      const isOnlyGreeting = /^(hi|hello|привет|здравствуй|добрый день|добрый вечер|доброе утро|hey|хай|салам|сәлем|salom|assalomu\s*alaykum)\s*[!.,]?\s*$/i.test(userMessage.trim());

      // Block obvious nonsense (no vowels)
      const hasVowels = /[аеёиоуыэюяaeiouy]/i.test(userMessage.trim());
      const consonantRatio = (userMessage.match(/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]/gi) || []).length / userMessage.trim().length;
      const isLikelyNonsense = !hasVowels || consonantRatio > 0.8;

      if (!userImage && (isOnlyGreeting || isLikelyNonsense)) {
        // Respond in the UI's selected language, not whatever language the user happened to type the greeting in
        const greetingResponse =
          language === "en"
            ? "Hello! Tell me what's bothering you — I'll suggest likely causes and recommend a specialist."
            : language === "kz"
            ? "Сәлеметсіз бе! Симптомдарыңызды айтыңыз — ықтимал себептерді және маманды ұсынамын."
            : language === "uz"
            ? "Salom! Sizni nima bezovta qilayotganini ayting — ehtimoliy sabablarni va mutaxassisni tavsiya qilaman."
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
          const uploadErr = { ru: "Не удалось загрузить изображение. Попробуйте ещё раз.", en: "Failed to upload image. Please try again.", kz: "Суретті жүктеу мүмкін болмады. Қайталап көріңіз.", uz: "Rasmni yuklab bo'lmadi. Qayta urinib ko'ring." };
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
          uz: "Simptomlaringizni batafsilroq tasvirlang — men sizga mos mutaxassisni topishga yordam beraman.",
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

        const lang = language as "en" | "ru" | "kz" | "uz";
        const selectorLabels = {
          en: "How would you like to consult?",
          ru: "Как вы хотите получить консультацию?",
          kz: "Қалай кеңес алғыңыз келеді?",
          uz: "Konsultatsiyani qanday olishni xohlaysiz?",
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
      const errMsg = { ru: "Произошла ошибка. Попробуйте ещё раз.", en: "An error occurred. Please try again.", kz: "Қате орын алды. Қайталап көріңіз.", uz: "Xatolik yuz berdi. Qayta urinib ko'ring." };
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

  // Keep sendFnRef always pointing to latest handleSendMessage
  useEffect(() => { sendFnRef.current = handleSendMessage; });

  // Auto-send initial message once on mount (works correctly with React Strict Mode)
  useEffect(() => {
    if (!autoSend || (!initialInput?.trim() && !initialImageUrl)) return;
    const t = setTimeout(() => sendFnRef.current?.(), 120);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const handleBookAppointment = async (doctorId: number, doctorName: string, doctorRec?: DoctorRecommendation, type: 'online' | 'offline' = 'online') => {
    if (doctorRec) {
      const scheduleIntro: Record<string, string> = {
        ru: `Смотрю расписание врача ${doctorRec.name}... Вот доступное время — выберите ближайший слот или любое удобное для вас:`,
        en: `Checking ${doctorRec.name}'s schedule... Here are the available slots — pick the nearest one or any time that works for you:`,
        kz: `${doctorRec.name} дәрігерінің кестесін қарап жатырмын... Міне қолжетімді уақыт — ең жақын немесе өзіңізге ыңғайлы уақытты таңдаңыз:`,
        uz: `${doctorRec.name} shifokorining jadvalini ko'rib chiqmoqdaman... Mana mavjud vaqtlar — eng yaqin yoki o'zingizga qulay vaqtni tanlang:`,
      };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: scheduleIntro[language] ?? scheduleIntro.ru,
        },
        {
          role: "booking-flow",
          content: "",
          doctor: doctorRec,
          bookingFlowConsultationType: type,
          bookingFlowInitialSlot: doctorRec.nearest_slot
            ? { date: doctorRec.nearest_slot.date, time: doctorRec.nearest_slot.time }
            : undefined,
        },
      ]);
      return;
    }
    // No preselected doctor — open the full modal with doctor-selection step
    setPreselectedDoctor(null);
    setBookingConsultationType(type);
    setIsBookingModalOpen(true);
  };

  const handleBookingComplete = useCallback((bookingDetails: {
    doctorName: string;
    doctorType: string;
    scheduledTime: string;
    isGuest?: boolean;
    meetingId?: string;
    consultationId?: number;
    consultationType?: 'online' | 'offline';
    clinicName?: string;
    clinicAddress?: string;
    roomNumber?: string | null;
    gis2Url?: string;
  }) => {
    const date = new Date(bookingDetails.scheduledTime);
    const locale = language === "kz" ? "kk-KZ" : language === "en" ? "en-US" : language === "uz" ? "uz-UZ" : "ru-RU";
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
          meetingId: bookingDetails.meetingId,
          consultationId: bookingDetails.consultationId,
          consultationType: bookingDetails.consultationType,
          clinicName: bookingDetails.clinicName,
          clinicAddress: bookingDetails.clinicAddress,
          roomNumber: bookingDetails.roomNumber,
          gis2Url: bookingDetails.gis2Url,
        },
      }
    ]);
  }, [language]);

  const handleBookDiagnosticsService = (service: DiagnosticsServiceItem) => {
    setSelectedDiagService(service);
    setIsDiagBookingOpen(true);
  };

  const handleDiagnosticsBookingComplete = useCallback((details: {
    serviceName: string;
    scheduledTime: string;
    price?: string | null;
    durationMinutes: number;
  }) => {
    const date = new Date(details.scheduledTime);
    const locale = language === "kz" ? "kk-KZ" : language === "en" ? "en-US" : language === "uz" ? "uz-UZ" : "ru-RU";
    const formattedDate = date.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const formattedTime = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        role: "booking-confirmation",
        content: "",
        bookingConfirmation: {
          doctorName: details.serviceName,
          doctorType: "",
          formattedDate,
          formattedTime,
          consultationType: "diagnostics",
          price: details.price,
        },
      },
    ]);
  }, [language]);

  const handleShowAllDiagnostics = (msgIndex: number) => {
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, showAll: true } : m));
  };

  const hasAvailableSlot = (doc: { nearest_slot?: { date: string; time: string; label: string } | null }) =>
    !!doc.nearest_slot && new Date(`${doc.nearest_slot.date}T${doc.nearest_slot.time}:00`) > new Date();

  const handleShowOtherDoctors = async (consultationType?: 'online' | 'offline') => {
    setIsLoading(true);
    try {
      const allDoctors = await aiService.getRandomDoctors(clinic?.clinicSlug);
      const doctors = consultationType === 'offline'
        ? allDoctors.filter(hasAvailableSlot)
        : allDoctors;

      if (doctors.length > 0) {
        const listLabels: Record<string, string> = {
          en: "Here are other available doctors you can consult with:",
          ru: "Вот другие доступные врачи, с которыми вы можете проконсультироваться:",
          kz: "Міне, сіз кеңес ала алатын басқа қолжетімді дәрігерлер:",
          uz: "Mana siz murojaat qilishingiz mumkin bo'lgan boshqa shifokorlar:",
        };
        setMessages((prev) => [
          ...prev,
          {
            role: "doctors-list",
            content: listLabels[language] ?? listLabels.ru,
            doctors,
            consultationType,
          },
        ]);
      } else {
        const emptyLabels: Record<string, string> = {
          en: "Sorry, no available doctors at the moment. Please try again later.",
          ru: "Извините, в данный момент нет доступных врачей. Пожалуйста, попробуйте позже.",
          kz: "Кешіріңіз, қазіргі уақытта қолжетімді дәрігерлер жоқ. Кейінірек қайталап көріңіз.",
          uz: "Kechirasiz, hozircha mavjud shifokorlar yo'q. Iltimos, keyinroq urinib ko'ring.",
        };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: emptyLabels[language] ?? emptyLabels.ru },
        ]);
      }
    } catch {
      const loadErrLabels: Record<string, string> = {
        en: "An error occurred while loading the doctors list. Please try again later.",
        ru: "Произошла ошибка при загрузке списка врачей. Пожалуйста, попробуйте позже.",
        kz: "Дәрігерлер тізімін жүктеу кезінде қате орын алды. Кейінірек қайталап көріңіз.",
        uz: "Shifokorlar ro'yxatini yuklashda xatolik yuz berdi. Keyinroq urinib ko'ring.",
      };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: loadErrLabels[language] ?? loadErrLabels.ru },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsultationTypeSelect = async (type: ConsultationFlow) => {
    const lang = language as "en" | "ru" | "kz" | "uz";

    // Mark the selector as selected so buttons become inactive
    setMessages(prev => prev.map(m =>
      m.role === "consultation-type-selector" && !m.selectedConsultationType
        ? { ...m, selectedConsultationType: type }
        : m
    ));

    const typeLabels = {
      online:      { en: "Online video consultation", ru: "Онлайн видео-консультация", kz: "Онлайн бейне кеңес", uz: "Onlayn video konsultatsiya" },
      offline:     { en: "In-person visit",           ru: "Оффлайн приём у врача",     kz: "Офлайн дәрігерге баю", uz: "Shifokor qabuliga shaxsan borish" },
      diagnostics: { en: "Diagnostics",               ru: "Диагностика",               kz: "Диагностика", uz: "Diagnostika" },
    };
    const choiceLabel = typeLabels[type][lang] ?? typeLabels[type].ru;

    // Add user's choice as a message
    setMessages(prev => [...prev, { role: "user", content: choiceLabel, isChoice: true }]);
    setIsLoading(true);

    try {
      if (type === "online") {
        const result = await aiService.analyzeSymptoms({
          symptoms: accumulatedSymptoms,
          language,
          clinicSlug: clinic?.clinicSlug,
        });

        if (!result.injectionBlocked && result.success && result.recommendedDoctor) {
          const cardLabels = { en: "I found the best doctor for your symptoms:", ru: "Я подобрал подходящего врача по вашим симптомам:", kz: "Симптомдарыңызға сәйкес дәрігерді таптым:", uz: "Simptomlaringizga mos shifokorni topdim:" };
          setMessages(prev => [...prev, {
            role: "doctor-card",
            content: cardLabels[lang] ?? cardLabels.ru,
            doctor: result.recommendedDoctor,
            otherDoctors: result.alternativeDoctors ?? [],
          }]);
        } else {
          // Fallback to random doctors
          const doctors = await aiService.getRandomDoctors(clinic?.clinicSlug);
          const listLabels = { en: "Available doctors for online consultation:", ru: "Доступные врачи для онлайн-консультации:", kz: "Онлайн кеңеске қолжетімді дәрігерлер:", uz: "Onlayn konsultatsiya uchun mavjud shifokorlar:" };
          const emptyLabels = { en: "Sorry, no doctors are available at the moment. Please try again later.", ru: "Извините, в данный момент нет доступных врачей. Пожалуйста, попробуйте позже.", kz: "Кешіріңіз, қазіргі уақытта қолжетімді дәрігерлер жоқ. Кейінірек қайталап көріңіз.", uz: "Kechirasiz, hozircha mavjud shifokorlar yo'q. Iltimos, keyinroq urinib ko'ring." };
          if (doctors.length > 0) {
            setMessages(prev => [...prev, { role: "doctors-list", content: listLabels[lang] ?? listLabels.ru, doctors }]);
          } else {
            setMessages(prev => [...prev, { role: "assistant", content: emptyLabels[lang] ?? emptyLabels.ru }]);
          }
        }
      } else if (type === "offline") {
        const listLabel = { en: "Nearest doctors for in-person visit:", ru: "Ближайшие врачи для приёма:", kz: "Жақын маңдағы дәрігерлер:", uz: "Qabul uchun eng yaqin shifokorlar:" }[lang] ?? "Ближайшие врачи для приёма:";
        const geoUnavailLabel = { en: "Available doctors for in-person visit:", ru: "Доступные врачи для приёма:", kz: "Қабылдауға қолжетімді дәрігерлер:", uz: "Qabul uchun mavjud shifokorlar:" }[lang] ?? "Доступные врачи для приёма:";
        const emptyLabel = { en: "No available doctors at the moment.", ru: "В данный момент нет доступных врачей.", kz: "Қазіргі уақытта дәрігерлер жоқ.", uz: "Hozircha mavjud shifokorlar yo'q." }[lang] ?? "В данный момент нет доступных врачей.";

        const fetchOfflineDoctors = async (lat?: number, lng?: number) => {
          const label = (lat !== undefined) ? listLabel : geoUnavailLabel;
          const rawDoctors = lat !== undefined
            ? await aiService.getNearbyOfflineDoctors(lat, lng!, undefined, clinic?.clinicSlug)
            : await aiService.getRandomDoctors(clinic?.clinicSlug);
          // Only show doctors who have an available upcoming slot
          const doctors = rawDoctors.filter(
            d => !!d.nearest_slot && new Date(`${d.nearest_slot.date}T${d.nearest_slot.time}:00`) > new Date()
          );
          if (doctors.length > 0) {
            const [primary, ...rest] = doctors;
            setMessages(prev => [...prev, {
              role: "doctor-card",
              content: label,
              doctor: primary,
              otherDoctors: rest.slice(0, 3),
              consultationType: "offline",
            }]);
          } else {
            setMessages(prev => [...prev, { role: "offline-no-doctors", content: "" }]);
          }
          setIsLoading(false);
        };

        if (typeof window !== "undefined" && navigator.geolocation) {
          const geoPromptLabel = { en: "Requesting your location to find the nearest clinic...", ru: "Запрашиваем геолокацию для поиска ближайшей клиники...", kz: "Жақын клиниканы табу үшін геолокация сұралуда...", uz: "Eng yaqin klinikani topish uchun joylashuvingiz so'ralmoqda..." }[lang] ?? "Запрашиваем геолокацию...";
          setMessages(prev => [...prev, { role: "geolocation-prompt", content: geoPromptLabel }]);
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await fetchOfflineDoctors(pos.coords.latitude, pos.coords.longitude);
            },
            async () => {
              // User denied or error — fall back to random doctors
              await fetchOfflineDoctors();
            },
            { timeout: 8000 }
          );
          return; // setIsLoading(false) called inside fetchOfflineDoctors
        } else {
          await fetchOfflineDoctors();
        }
      } else {
        // diagnostics — AI suggests relevant services based on symptoms, fallback to full list
        const fallbackLabel = { en: "Available diagnostic services:", ru: "Доступные услуги диагностики:", kz: "Қолжетімді диагностикалық қызметтер:", uz: "Mavjud diagnostika xizmatlari:" }[lang] ?? "Доступные услуги диагностики:";
        const aiLabel = { en: "Recommended diagnostics for your symptoms:", ru: "Рекомендуемая диагностика по вашим симптомам:", kz: "Симптомдарыңыз бойынша ұсынылатын диагностика:", uz: "Simptomlaringiz bo'yicha tavsiya etilgan diagnostika:" }[lang] ?? "Рекомендуемая диагностика по вашим симптомам:";
        const emptyLabel = { en: "No diagnostic services available at the moment.", ru: "В данный момент диагностические услуги недоступны.", kz: "Қазіргі уақытта диагностикалық қызметтер жоқ.", uz: "Hozircha diagnostika xizmatlari mavjud emas." }[lang] ?? "В данный момент диагностические услуги недоступны.";

        const [aiResult, allServices] = await Promise.all([
          aiService.suggestDiagnostics(accumulatedSymptoms, clinic?.clinicId, clinic?.clinicSlug),
          aiService.getDiagnosticsServices(clinic?.clinicId),
        ]);

        const services = (aiResult.success && aiResult.matchingServices.length > 0)
          ? aiResult.matchingServices
          : allServices;
        const label = (aiResult.success && aiResult.matchingServices.length > 0) ? aiLabel : fallbackLabel;

        if (services.length > 0) {
          // If AI provided a summary, prepend it as an assistant message
          if (aiResult.success && aiResult.summary) {
            setMessages(prev => [...prev, { role: "assistant", content: aiResult.summary! }]);
          }
          setMessages(prev => [...prev, { role: "diagnostics-list", content: label, diagnosticsServices: services }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: emptyLabel }]);
        }
      }
    } catch {
      const errLabels = { en: "Error loading doctors. Please try again.", ru: "Ошибка загрузки врачей. Попробуйте ещё раз.", kz: "Дәрігерлерді жүктеу қатесі. Қайталап көріңіз.", uz: "Shifokorlarni yuklashda xatolik. Qayta urinib ko'ring." };
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
    <div className={embedded ? "flex flex-col flex-1 min-h-0 overflow-hidden" : "min-h-screen flex flex-col"} style={embedded ? {} : { background: "#0A0A1B" }}>
      {/* Header — matches landing page scrolled style */}
      {!embedded && <header className="bg-[#1D1D2F]/95 backdrop-blur-xl shadow-xl border-b border-white/[0.07]">
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

              {clinic?.logoUrl ? (
                // Clinics upload logos with all kinds of backgrounds (opaque white,
                // transparent, etc.) — a white chip keeps every logo legible and
                // intentional-looking against this dark header instead of floating
                // as a stray box.
                <div className="flex items-center justify-center bg-white rounded-lg p-1 sm:p-1.5 h-6 sm:h-8 max-w-[96px] sm:max-w-[120px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={clinic.logoUrl} alt={clinic.clinicName} className="h-full w-auto max-w-full object-contain" />
                </div>
              ) : (
                <Image src={appLogo} alt={brand.name + " logo"} height={32} className="h-6 sm:h-8 w-auto" />
              )}

              <div className="w-px h-6 bg-white/15 hidden md:block" />

              {/* Bot identity */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl blur-lg opacity-40"
                    style={{ background: accentColor }}
                  />
                  <div
                    className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
                    style={{ background: accentGrad }}
                  >
                    <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-sm text-white leading-tight">{ui.title}</p>
                  <p className="text-[11px] flex items-center gap-1 leading-tight" style={{ color: hexToRgba(accentColor, 0.75) }}>
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
      </header>}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl space-y-4 sm:space-y-6">
          {/* Welcome Card */}
          {!embedded && <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border"
            style={{
              background: accentGrad,
              borderColor: accentDark
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCircleCheck} className="text-base sm:text-xl" style={{ color: onAccent }} />
              </div>
              <div style={{ color: onAccent }}>
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">
                  {clinic ? ui.welcomeClinic(clinic.clinicName) : ui.welcomeTitle}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {clinic?.welcomeMessage || ui.welcomeDesc}
                </p>
              </div>
            </div>
          </motion.div>}

          {/* Quick links chips */}
          {clinic?.quickLinks && clinic.quickLinks.length > 0 && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2"
            >
              {clinic.quickLinks.map((ql, i) => (
                <button
                  key={i}
                  onClick={() => setInput(ql.message)}
                  className="px-3 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105 hover:shadow-md"
                  style={{
                    background: accentLight,
                    color: accentDark,
                    borderColor: hexToRgba(accentColor, 0.25),
                  }}
                >
                  {ql.label}
                </button>
              ))}
            </motion.div>
          )}

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
                {message.role === "geolocation-prompt" ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" }}
                    >
                      <FontAwesomeIcon icon={faLocationCrosshairs} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ccfbf1" }}>
                        <span className="text-xs font-semibold" style={{ color: "#0f766e" }}>
                          {language === "en" ? "Geolocation" : language === "kz" ? "Геолокация" : language === "uz" ? "Geolokatsiya" : "Геолокация"}
                        </span>
                      </div>
                      <div
                        className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg border flex items-center gap-3"
                        style={{ background: "white", borderColor: "#99f6e4" }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)" }}
                        >
                          <FontAwesomeIcon icon={faLocationCrosshairs} className="text-white text-xs" />
                        </motion.div>
                        <span className="text-sm font-medium" style={{ color: "#134e4a" }}>{message.content}</span>
                      </div>
                    </div>
                  </div>
                ) : message.role === "assistant" ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: accentGrad }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: hexToRgba(accentColor, 0.15), border: `1px solid ${hexToRgba(accentColor, 0.25)}` }}>
                        <span className="text-xs font-semibold" style={{ color: accentColor }}>{ui.aiLabel}</span>
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
                              {language === "en" ? "Preliminary" : language === "kz" ? "Болжамды диагноз" : language === "uz" ? "Taxminiy tashxis" : "Примерный диагноз"}
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
                          background: embedded ? "#F1F5F9" : "rgba(255,255,255,0.055)",
                          borderColor: embedded ? "#E2E8F0" : "rgba(255,255,255,0.09)"
                        }}
                      >
                        <div className="text-sm sm:text-base break-words" style={{ color: embedded ? "#0F172A" : "rgba(255,255,255,0.88)", overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {formatAIMessage(message.content, accentColor)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : message.role === "booking-confirmation" && message.bookingConfirmation?.consultationType === "diagnostics" ? (() => {
                  const bc = message.bookingConfirmation;
                  const l = language as "en" | "ru" | "kz" | "uz";
                  const labels = {
                    title: { en: "Booking confirmed!", ru: "Запись подтверждена!", kz: "Жазылу расталды!", uz: "Yozilish tasdiqlandi!" },
                    service: { en: "Diagnostic service", ru: "Услуга диагностики", kz: "Диагностикалық қызмет", uz: "Diagnostika xizmati" },
                    date: { en: "Date", ru: "Дата", kz: "Күні", uz: "Sana" },
                    time: { en: "Time", ru: "Время", kz: "Уақыты", uz: "Vaqt" },
                    price: { en: "Price", ru: "Стоимость", kz: "Бағасы", uz: "Narxi" },
                    remind: { en: "You will receive a reminder before your appointment.", ru: "Вы получите напоминание перед визитом.", kz: "Қабылдау алдында еске салу аласыз.", uz: "Qabuldan oldin sizga eslatma yuboriladi." },
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
                        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border bg-white" style={{ borderColor: "#e1eaff" }}>
                          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                              <FontAwesomeIcon icon={faCircleCheck} className="text-white text-lg" />
                            </div>
                            <p className="text-white font-bold text-sm sm:text-base">{labels.title[l]}</p>
                          </div>
                          <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faStethoscope} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.service[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.doctorName}</p>
                              </div>
                            </div>
                            <div className="border-t border-gray-100" />
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faCalendarDays} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.date[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faClock} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.time[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedTime}</p>
                              </div>
                            </div>
                            {bc.price && (
                              <div className="border-t border-gray-100 pt-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                  <span className="text-sm font-bold" style={{ color: accentDark }}>₸</span>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">{labels.price[l]}</p>
                                  <p className="font-bold text-gray-900 text-sm">{Number(bc.price).toLocaleString()} ₸</p>
                                </div>
                              </div>
                            )}
                            <div className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                              <FontAwesomeIcon icon={faBell} className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                              <p className="text-xs text-green-800">{labels.remind[l]}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : message.role === "booking-confirmation" && message.bookingConfirmation ? (() => {
                  const bc = message.bookingConfirmation;
                  const isOfflineBooking = bc.consultationType === 'offline';
                  const labels = {
                    title:        { en: "Appointment Confirmed!", ru: "Запись подтверждена!", kz: "Жазылу расталды!", uz: "Yozilish tasdiqlandi!" },
                    booked:       { en: "You have successfully booked an appointment with", ru: "Вы успешно записались к врачу", kz: "Дәрігерге сәтті жазылдыңыз:", uz: "Shifokorga muvaffaqiyatli yozildingiz:" },
                    date:         { en: "Date", ru: "Дата", kz: "Күні", uz: "Sana" },
                    time:         { en: "Time", ru: "Время", kz: "Уақыты", uz: "Vaqt" },
                    typeOnline:   { en: "Online video consultation", ru: "Онлайн видеоконсультация", kz: "Онлайн бейне кеңес", uz: "Onlayn video konsultatsiya" },
                    typeOffline:  { en: "In-person visit", ru: "Оффлайн приём у врача", kz: "Офлайн дәрігерге баю", uz: "Shifokor qabuliga shaxsan borish" },
                    clinic:       { en: "Clinic", ru: "Клиника", kz: "Клиника", uz: "Klinika" },
                    address:      { en: "Address", ru: "Адрес", kz: "Мекенжай", uz: "Manzil" },
                    room:         { en: "Room", ru: "Кабинет", kz: "Кабинет", uz: "Xona" },
                    map:          { en: "Open on map", ru: "Открыть на карте", kz: "Картада ашу", uz: "Xaritada ochish" },
                    remind:       { en: "You will receive a reminder before your appointment.", ru: "Вы получите напоминание перед приёмом.", kz: "Қабылдау алдында еске салу аласыз.", uz: "Qabuldan oldin sizga eslatma yuboriladi." },
                    remindOnline: { en: "You will receive a reminder before your consultation.", ru: "Вы получите напоминание перед консультацией.", kz: "Кеңес алдында еске салу аласыз.", uz: "Konsultatsiyadan oldin sizga eslatma yuboriladi." },
                  };
                  const l = language as "en" | "ru" | "kz" | "uz";
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
                          style={{ background: "white", borderColor: isOfflineBooking ? "#d1fae5" : "#e1eaff" }}
                        >
                          {/* Header */}
                          <div
                            className="px-5 py-4 flex items-center gap-3"
                            style={{ background: isOfflineBooking ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                          >
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                              <FontAwesomeIcon icon={isOfflineBooking ? faHouse : faCircleCheck} className="text-white text-lg" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm sm:text-base">{labels.title[l]}</p>
                              <p className="text-white/80 text-xs">{isOfflineBooking ? labels.typeOffline[l] : labels.typeOnline[l]}</p>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="px-5 py-4 space-y-3">
                            {/* Doctor row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faUserMd} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.booked[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.doctorName}</p>
                                <p className="text-xs" style={{ color: accentColor }}>{bc.doctorType}</p>
                              </div>
                            </div>

                            <div className="border-t border-gray-100" />

                            {/* Date row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faCalendarDays} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.date[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedDate}</p>
                              </div>
                            </div>

                            {/* Time row */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                <FontAwesomeIcon icon={faClock} className="text-sm" style={{ color: accentDark }} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{labels.time[l]}</p>
                                <p className="font-bold text-gray-900 text-sm">{bc.formattedTime}</p>
                              </div>
                            </div>

                            <div className="border-t border-gray-100" />

                            {/* Offline: clinic + address + room + map */}
                            {isOfflineBooking ? (
                              <div className="space-y-2.5">
                                {bc.clinicName && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4" }}>
                                      <FontAwesomeIcon icon={faHospital} className="text-sm" style={{ color: "#059669" }} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{labels.clinic[l]}</p>
                                      <p className="font-bold text-gray-900 text-sm">{bc.clinicName}</p>
                                    </div>
                                  </div>
                                )}
                                {bc.clinicAddress && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4" }}>
                                      <FontAwesomeIcon icon={faLocationDot} className="text-sm" style={{ color: "#059669" }} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{labels.address[l]}</p>
                                      <p className="font-semibold text-gray-800 text-sm">{bc.clinicAddress}</p>
                                    </div>
                                  </div>
                                )}
                                {bc.roomNumber && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fdf4" }}>
                                      <FontAwesomeIcon icon={faDoorOpen} className="text-sm" style={{ color: "#059669" }} />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">{labels.room[l]}</p>
                                      <p className="font-bold text-gray-900 text-sm">№{bc.roomNumber}</p>
                                    </div>
                                  </div>
                                )}
                                {bc.gis2Url && (
                                  <a
                                    href={bc.gis2Url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg"
                                    style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #a7f3d0" }}
                                  >
                                    <FontAwesomeIcon icon={faMapLocationDot} className="text-xs" />
                                    {labels.map[l]}
                                  </a>
                                )}
                              </div>
                            ) : (
                              /* Online: type badge */
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accentLight }}>
                                  <FontAwesomeIcon icon={faVideo} className="text-sm" style={{ color: accentDark }} />
                                </div>
                                <p className="text-sm font-medium text-gray-700">{labels.typeOnline[l]}</p>
                              </div>
                            )}

                            {/* Reminder note */}
                            <div className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                              <FontAwesomeIcon icon={faBell} className="text-xs mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                              <p className="text-xs text-green-800">{isOfflineBooking ? labels.remind[l] : labels.remindOnline[l]}</p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-2 pt-1">
                              {!isOfflineBooking && bc.meetingId && (
                                <button
                                  onClick={() => router.push(`/video-call/patient?meetingId=${bc.meetingId}`)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                                  style={{ background: accentGrad, color: onAccent }}
                                >
                                  <FontAwesomeIcon icon={faVideo} className="text-xs" />
                                  {l === "en" ? "Join Video Consultation" : l === "kz" ? "Бейне кеңеске кіру" : l === "uz" ? "Video konsultatsiyaga kirish" : "Перейти к видеоконсультации"}
                                </button>
                              )}
                              <button
                                onClick={() => router.push("/patient/appointments")}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                style={{ background: accentLight, color: accentDark, border: `1px solid ${hexToRgba(accentColor, 0.3)}` }}
                              >
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                                {l === "en" ? "My Appointments" : l === "kz" ? "Менің кабинетім" : l === "uz" ? "Mening yozilishlarim" : "Мои записи"}
                              </button>
                              {bc.consultationId && (
                                <a
                                  href={buildWhatsAppLink(consultationWhatsAppMessage({
                                    id: bc.consultationId,
                                    doctorName: bc.doctorName,
                                    meetingId: bc.meetingId,
                                    lang: l,
                                  }))}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                  style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                                >
                                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                  {l === "en" ? "Ask via WhatsApp" : l === "kz" ? "WhatsApp арқылы сұрау" : l === "uz" ? "WhatsApp orqali so'rash" : "Спросить в WhatsApp"}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : message.role === "doctor-card" && message.doctor ? (() => {
                  // Use the UI's selected language for doctor card labels
                  const lang = language as "en" | "ru" | "kz" | "uz";

                  const labels = {
                    doctorRecommendation: { en: "Doctor Recommendation", ru: "Рекомендация врача", kz: "Дәрігер ұсынысы", uz: "Shifokor tavsiyasi" },
                    bookAppointment: { en: "Book Appointment", ru: "Записаться на прием", kz: "Жазылу", uz: "Qabulga yozilish" },
                    showOtherDoctors: { en: "Show Other Doctors", ru: "Показать других врачей", kz: "Басқа дәрігерлерді көрсету", uz: "Boshqa shifokorlarni ko'rsatish" },
                    urgentConsultation: { en: "Urgent Consultation", ru: "Срочная консультация", kz: "Шұғыл кеңес", uz: "Shoshilinch konsultatsiya" },
                    experience: { en: "years experience", ru: "лет опыта", kz: "жыл тәжірибе", uz: "yillik tajriba" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника", uz: "Klinika" }
                  };

                  // Get specialization in current language (fall back to doctor_type when the field has no translation for this language)
                  const docSpecFallback: Record<string, string> = { en: "Doctor", ru: "Врач", kz: "Дәрігер", uz: "Shifokor" };
                  const doctorSpecialization = message.doctor.specialization
                    ? (message.doctor.specialization[lang as keyof typeof message.doctor.specialization] || message.doctor.doctor_type || docSpecFallback[lang])
                    : (message.doctor.doctor_type || docSpecFallback[lang]);

                  const otherDoctorLabels = {
                    bestMatch: { en: "Best Match", ru: "Лучший выбор", kz: "Ең жақсы таңдау", uz: "Eng mos" },
                    alsoAvailable: { en: "Also available:", ru: "Также доступны:", kz: "Сонымен қатар қолжетімді:", uz: "Shuningdek mavjud:" },
                    viewAll: { en: "View all doctors →", ru: "Показать всех врачей →", kz: "Барлық дәрігерлерді көрсету →", uz: "Barcha shifokorlarni ko'rsatish →" },
                    book: { en: "Book", ru: "Записаться", kz: "Жазылу", uz: "Yozilish" },
                  };

                  const isOffline = message.consultationType === "offline";
                  const cardPrimaryGrad = isOffline
                    ? "linear-gradient(135deg, #0f766e 0%, #0d5c56 50%, #134e4a 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)";
                  const cardBorderColor = isOffline ? "#5eead4" : "#60a5fa";
                  const cardBoxShadow = isOffline
                    ? "0 20px 60px rgba(15,118,110,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset"
                    : "0 20px 60px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset";
                  const cardGlowColor = isOffline ? "#5eead4" : "#60a5fa";
                  const cardGlowColor2 = isOffline ? "#99f6e4" : "#93c5fd";
                  const dotBorderColor = isOffline ? "#134e4a" : "#1e3a8a";
                  const subTextColor = isOffline ? "#99f6e4" : "#bfdbfe";
                  const iconColor = isOffline ? "#5eead4" : "#93c5fd";
                  const btnBg = isOffline
                    ? "linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)";
                  const btnTextColor = isOffline ? "#065f46" : "#1e40af";
                  const compactCardGrad = isOffline
                    ? "linear-gradient(135deg, #0f766e 0%, #0d5c56 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)";
                  const compactBorderColor = isOffline ? "#99f6e4" : "#93c5fd";
                  const compactShadow = isOffline
                    ? "0 6px 20px rgba(15,118,110,0.25)"
                    : "0 6px 20px rgba(37,99,235,0.25)";
                  const viewAllBg = isOffline ? "rgba(15,118,110,0.08)" : "rgba(37,99,235,0.08)";
                  const viewAllColor = isOffline ? "#0f766e" : "#2563eb";
                  const viewAllBorderStyle = isOffline ? "rgba(15,118,110,0.2)" : "rgba(37,99,235,0.2)";

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: accentGrad }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: accentLight }}>
                        <span className="text-xs font-semibold" style={{ color: accentDark }}>{labels.doctorRecommendation[lang as keyof typeof labels.doctorRecommendation]}</span>
                      </div>

                      {/* ── BEST MATCH card ── */}
                      <div
                        className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 relative mb-3"
                        style={{
                          background: cardPrimaryGrad,
                          borderColor: cardBorderColor,
                          boxShadow: cardBoxShadow
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
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${cardGlowColor} 0%, transparent 70%)`, filter: "blur(40px)" }}></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${cardGlowColor2} 0%, transparent 70%)`, filter: "blur(30px)" }}></div>

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
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 animate-pulse" style={{ background: "#10b981", borderColor: dotBorderColor }}></div>
                            </div>
                            <div className="flex-1 pt-0.5">
                              <h3 className="text-white font-bold text-base sm:text-lg mb-1 leading-tight">{message.doctor.name}</h3>
                              <p className="text-xs sm:text-sm mb-2" style={{ color: subTextColor }}>{doctorSpecialization}</p>
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
                                {(message.consultationType === "offline" ? message.doctor.offline_consultation_price : message.doctor.online_consultation_price) != null && (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(16,185,129,0.18)" }}>
                                    <span className="text-emerald-200">{(message.consultationType === "offline" ? message.doctor.offline_consultation_price : message.doctor.online_consultation_price)!.toLocaleString()} ₸</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Clinic row */}
                          {message.doctor.clinic && (
                            isOffline ? (
                              <div
                                className="rounded-xl p-3 mb-4 space-y-1.5 text-xs"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
                              >
                                {/* Name + distance */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FontAwesomeIcon icon={faHospital} className="text-[10px] flex-shrink-0" style={{ color: iconColor }} />
                                    <span className="font-semibold text-white truncate">{message.doctor.clinic.name}</span>
                                  </div>
                                  {message.doctor.clinic.distance_km != null && (
                                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.25)", color: "#6ee7b7" }}>
                                      {message.doctor.clinic.distance_km} {{en:"km",ru:"км",kz:"км",uz:"km"}[lang] ?? "км"}
                                    </span>
                                  )}
                                </div>
                                {/* Address */}
                                {message.doctor.clinic.address && (
                                  <div className="flex items-start gap-1.5">
                                    <FontAwesomeIcon icon={faLocationDot} className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: iconColor }} />
                                    <span style={{ color: subTextColor }}>{message.doctor.clinic.address}</span>
                                  </div>
                                )}
                                {/* Cabinet */}
                                {message.doctor.room_number && (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: iconColor }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span style={{ color: subTextColor }}>
                                      {{en:"Cabinet",ru:"Кабинет",kz:"Кабинет",uz:"Xona"}[lang] ?? "Кабинет"} №{message.doctor.room_number}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: subTextColor }}>
                                <FontAwesomeIcon icon={faHospital} className="text-[11px] flex-shrink-0" style={{ color: iconColor }} />
                                <span className="font-medium text-white">{message.doctor.clinic.name}</span>
                                {message.doctor.clinic.city && <><span>·</span><FontAwesomeIcon icon={faLocationDot} className="text-[10px] flex-shrink-0" style={{ color: iconColor }} /><span>{message.doctor.clinic.city}</span></>}
                              </div>
                            )
                          )}

                          {/* Nearest available slot */}
                          {isSlotFuture(message.doctor.nearest_slot) && (
                            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                              <FontAwesomeIcon icon={faClock} className="text-[11px] flex-shrink-0" style={{ color: subTextColor }} />
                              <span className="text-white opacity-90">
                                {{
                                  ru: "Ближайший слот:",
                                  en: "Nearest slot:",
                                  kz: "Жақын слот:",
                                  uz: "Eng yaqin vaqt:",
                                }[lang as "ru" | "en" | "kz" | "uz"] ?? "Ближайший слот:"}
                              </span>
                              <span className="text-white font-bold">{message.doctor.nearest_slot?.label}</span>
                            </div>
                          )}

                          {/* Primary CTA */}
                          {(() => {
                            const bookingOpen = messages.some(
                              (m) => m.role === "booking-flow" && m.doctor?.id === message.doctor!.id
                            );
                            return bookingOpen ? (
                              <div
                                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.2)" }}
                              >
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>{{ ru: "Расписание открыто ↑", en: "Schedule open ↑", kz: "Кесте ашылды ↑", uz: "Jadval ochiq ↑" }[lang as "ru"|"en"|"kz"|"uz"] ?? "Расписание открыто ↑"}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleBookAppointment(message.doctor!.id, message.doctor!.name, message.doctor!, (message.consultationType as 'online' | 'offline') ?? 'online')}
                                disabled={isLoading}
                                className="w-full py-3.5 font-bold rounded-xl transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                  background: btnBg,
                                  color: btnTextColor,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                                }}
                              >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: isOffline ? "linear-gradient(to right, #f0fdfa, #ffffff)" : "linear-gradient(to right, #eff6ff, #ffffff)" }}></div>
                                <span className="relative flex items-center justify-center gap-2 text-sm sm:text-base">
                                  <span>{labels.bookAppointment[lang as keyof typeof labels.bookAppointment]}</span>
                                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                              </button>
                            );
                          })()}
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
                                ? (doc.specialization[lang as keyof typeof doc.specialization] || doc.doctor_type || docSpecFallback[lang])
                                : (doc.doctor_type || docSpecFallback[lang]);
                              return (
                                <div
                                  key={doc.id || idx}
                                  className="rounded-2xl overflow-hidden border relative"
                                  style={{
                                    background: compactCardGrad,
                                    borderColor: compactBorderColor,
                                    boxShadow: compactShadow
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
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: "#10b981", borderColor: dotBorderColor }}></div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-xs leading-tight truncate">{doc.name}</p>
                                        <p className="text-[10px] truncate" style={{ color: subTextColor }}>{docSpec}</p>
                                      </div>
                                    </div>

                                    {/* Experience + price */}
                                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                                      {doc.years_of_experience && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(255,255,255,0.15)" }}>
                                          <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[9px]" />
                                          <span className="text-white font-medium">{doc.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                        </div>
                                      )}
                                      {(message.consultationType === "offline" ? doc.offline_consultation_price : doc.online_consultation_price) != null && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(16,185,129,0.18)" }}>
                                          <span className="text-emerald-200 font-medium">{(message.consultationType === "offline" ? doc.offline_consultation_price : doc.online_consultation_price)!.toLocaleString()} ₸</span>
                                        </div>
                                      )}
                                      {isOffline && doc.clinic?.distance_km != null && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(16,185,129,0.25)" }}>
                                          <span style={{ color: "#6ee7b7" }} className="font-medium">{doc.clinic.distance_km} {{en:"km",ru:"км",kz:"км",uz:"km"}[lang]??""}</span>
                                        </div>
                                      )}
                                    </div>
                                    {isOffline && doc.room_number && (
                                      <div className="flex items-center gap-1 mb-2 text-[10px]" style={{ color: subTextColor }}>
                                        <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: iconColor }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span>{{en:"Cabinet",ru:"Каб.",kz:"Каб.",uz:"Xona"}[lang]??""} №{doc.room_number}</span>
                                      </div>
                                    )}

                                    {/* Nearest slot */}
                                    {doc.nearest_slot && new Date(`${doc.nearest_slot.date}T${doc.nearest_slot.time}:00`) > new Date() && (
                                      <div className="flex items-center gap-1 mb-2 text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                        <FontAwesomeIcon icon={faClock} className="text-[9px] flex-shrink-0" style={{ color: subTextColor }} />
                                        <span className="text-white font-semibold truncate">{doc.nearest_slot.label}</span>
                                      </div>
                                    )}

                                    {/* Book button */}
                                    {messages.some((m) => m.role === "booking-flow" && m.doctor?.id === doc.id) ? (
                                      <div
                                        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                                        style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)" }}
                                      >
                                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                        ↑
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleBookAppointment(doc.id, doc.name, doc, (message.consultationType as 'online' | 'offline') ?? 'online')}
                                        disabled={isLoading}
                                        className="w-full py-2 font-bold rounded-lg text-xs transition-all disabled:opacity-50"
                                        style={{
                                          background: btnBg,
                                          color: btnTextColor,
                                          boxShadow: "0 3px 8px rgba(0,0,0,0.15)"
                                        }}
                                      >
                                        {otherDoctorLabels.book[lang as keyof typeof otherDoctorLabels.book]} →
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* View all doctors link */}
                      <button
                        onClick={() => handleShowOtherDoctors((message.consultationType as 'online' | 'offline') ?? undefined)}
                        disabled={isLoading}
                        className="w-full py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                        style={{
                          background: viewAllBg,
                          color: viewAllColor,
                          border: `1px solid ${viewAllBorderStyle}`
                        }}
                      >
                        {otherDoctorLabels.viewAll[lang as keyof typeof otherDoctorLabels.viewAll]}
                      </button>

                      {/* Doctor name search */}
                      <DoctorSearchBox
                        lang={lang}
                        clinicSlug={clinic?.clinicSlug}
                        accentGrad={accentGrad}
                        onBook={(id, name, doc) => handleBookAppointment(id, name, doc as Parameters<typeof handleBookAppointment>[2])}
                      />
                    </div>
                  </div>
                  );
                })() : message.role === "doctors-list" && message.doctors ? (() => {
                  // Use the UI's selected language for doctors-list labels
                  const lang = language as "en" | "ru" | "kz" | "uz";

                  const isOffline = message.consultationType === "offline";
                  const labels = {
                    book: { en: "Book Appointment", ru: "Записаться на прием", kz: "Жазылу", uz: "Qabulga yozilish" },
                    bestMatch: { en: "Best Match", ru: "Лучший выбор", kz: "Ең жақсы таңдау", uz: "Eng mos" },
                    experience: { en: "years exp", ru: "лет опыта", kz: "жыл тәжірибе", uz: "yillik tajriba" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника", uz: "Klinika" },
                    cabinet: { en: "Cabinet", ru: "Кабинет", kz: "Кабинет", uz: "Xona" },
                    map: { en: "Open in 2GIS", ru: "Открыть в 2ГИС", kz: "2ГИС-та ашу", uz: "2GIS'da ochish" },
                    km: { en: "km away", ru: "км от вас", kz: "км қашықтықта", uz: "km uzoqlikda" },
                  };
                  const specialtyFallback: Record<string, string> = { en: "Doctor", ru: "Врач", kz: "Дәрігер", uz: "Shifokor" };

                  const dlCardGrad = isOffline
                    ? "linear-gradient(135deg, #0f766e 0%, #0d5c56 100%)"
                    : "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)";
                  const dlCardBorder = isOffline ? "#5eead4" : "#60a5fa";
                  const dlCardShadow = isOffline
                    ? "0 10px 40px rgba(15,118,110,0.3)"
                    : "0 10px 40px rgba(37, 99, 235, 0.3)";
                  const dlGlowColor = isOffline ? "#5eead4" : "#60a5fa";
                  const dlDotBorder = isOffline ? "#134e4a" : "#1e3a8a";
                  const dlSubText = isOffline ? "#99f6e4" : "#bfdbfe";
                  const dlIconColor = isOffline ? "#5eead4" : "#93c5fd";
                  const dlBtnBg = isOffline
                    ? "linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)";
                  const dlBtnColor = isOffline ? "#065f46" : "#1e40af";

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: accentGrad }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: accentLight }}>
                        <span className="text-xs font-semibold" style={{ color: accentDark }}>{message.content}</span>
                      </div>
                      <div className="space-y-3">
                        {message.doctors.map((doctor, idx) => {
                          // Get specialization in current language
                          const doctorSpecialization = doctor.specialization
                            ? (doctor.specialization[lang as keyof typeof doctor.specialization] || doctor.doctor_type || specialtyFallback[lang])
                            : (doctor.doctor_type || specialtyFallback[lang]);

                          return (
                            <div
                              key={doctor.id || idx}
                              className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border relative"
                              style={{
                                background: dlCardGrad,
                                borderColor: dlCardBorder,
                                boxShadow: dlCardShadow
                              }}
                            >
                              {/* Decorative elements */}
                              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${dlGlowColor} 0%, transparent 70%)`, filter: "blur(20px)" }}></div>

                              <div className="relative px-4 py-3 sm:px-5 sm:py-4">
                                {/* Best match badge for first card */}
                                {idx === 0 && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3 text-xs font-bold" style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
                                    <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[9px]" />
                                    <span className="text-amber-200">{labels.bestMatch[lang as keyof typeof labels.bestMatch]}</span>
                                  </div>
                                )}
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
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ background: "#10b981", borderColor: dlDotBorder }}></div>
                                  </div>

                                  <div className="flex-1">
                                    <h3 className="text-white font-bold text-sm sm:text-base mb-0.5 leading-tight">{doctor.name}</h3>
                                    <p className="text-xs sm:text-sm mb-1.5" style={{ color: dlSubText }}>{doctorSpecialization}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {doctor.years_of_experience && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
                                          <FontAwesomeIcon icon={faBolt} className="text-amber-300 text-[9px]" />
                                          <span className="text-white font-semibold">{doctor.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                        </div>
                                      )}
                                      {(isOffline ? doctor.offline_consultation_price : doctor.online_consultation_price) != null && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(16,185,129,0.2)" }}>
                                          <span className="text-emerald-200 font-semibold">
                                            {(isOffline ? doctor.offline_consultation_price : doctor.online_consultation_price)!.toLocaleString()} ₸
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Clinic Info */}
                                {doctor.clinic && (
                                  <div
                                    className="rounded-lg p-2.5 mb-3 space-y-1.5"
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      backdropFilter: "blur(10px)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)"
                                    }}
                                  >
                                    {/* Clinic name + distance badge */}
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-white text-xs font-semibold truncate">{doctor.clinic.name}</p>
                                      {isOffline && doctor.clinic.distance_km != null && (
                                        <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.25)", color: "#6ee7b7" }}>
                                          {doctor.clinic.distance_km} {labels.km[lang as keyof typeof labels.km]}
                                        </span>
                                      )}
                                    </div>

                                    {/* Address */}
                                    {isOffline && doctor.clinic.address && (
                                      <div className="flex items-start gap-1">
                                        <FontAwesomeIcon icon={faLocationDot} className="text-[9px] mt-0.5 flex-shrink-0" style={{ color: dlIconColor }} />
                                        <span className="text-xs leading-tight" style={{ color: dlSubText }}>{doctor.clinic.address}</span>
                                      </div>
                                    )}

                                    {/* City (for non-offline) + rating */}
                                    <div className="flex items-center justify-between gap-2">
                                      {!isOffline && doctor.clinic.city && (
                                        <div className="flex items-center gap-1">
                                          <FontAwesomeIcon icon={faLocationDot} className="text-[9px]" style={{ color: dlIconColor }} />
                                          <span className="text-xs" style={{ color: dlSubText }}>{doctor.clinic.city}</span>
                                        </div>
                                      )}
                                      {doctor.clinic.rating && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(251, 191, 36, 0.15)" }}>
                                          <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[9px]" />
                                          <span className="text-amber-200 text-xs font-bold">{doctor.clinic.rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Room number */}
                                    {isOffline && doctor.room_number && (
                                      <div className="flex items-center gap-1">
                                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: dlIconColor }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span className="text-xs" style={{ color: dlSubText }}>{labels.cabinet[lang as keyof typeof labels.cabinet]} №{doctor.room_number}</span>
                                      </div>
                                    )}

                                    {/* 2GIS link */}
                                    {isOffline && doctor.clinic.gis2_url && (
                                      <a
                                        href={doctor.clinic.gis2_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold px-2 py-1 rounded-lg w-fit transition-colors"
                                        style={{ background: "rgba(99,102,241,0.25)", color: "#c7d2fe" }}
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                                        </svg>
                                        {labels.map[lang as keyof typeof labels.map]}
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Nearest slot for alternative doctor */}
                                {isSlotFuture(doctor.nearest_slot) && (
                                  <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                    <FontAwesomeIcon icon={faClock} className="text-[11px] flex-shrink-0" style={{ color: dlSubText }} />
                                    <span className="text-white font-semibold">{doctor.nearest_slot?.label}</span>
                                  </div>
                                )}

                                {/* Book Button */}
                                <button
                                  onClick={() => handleBookAppointment(doctor.id, doctor.name, doctor, isOffline ? 'offline' : 'online')}
                                  disabled={isLoading}
                                  className="w-full py-2.5 sm:py-3 font-bold rounded-lg sm:rounded-xl transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    background: dlBtnBg,
                                    color: dlBtnColor,
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
                  // Use the UI's selected language for time-slot labels
                  const lang = language as "en" | "ru" | "kz" | "uz";

                  const labels = {
                    selectTime: { en: "Select time", ru: "Выберите время", kz: "Уақытты таңдаңыз", uz: "Vaqtni tanlang" },
                    bookSlot: { en: "Book", ru: "Забронировать", kz: "Брондау", uz: "Band qilish" },
                    noSlots: { en: "No available time slots", ru: "Нет доступного времени", kz: "Қолжетімді уақыт жоқ", uz: "Mavjud vaqt yo'q" }
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
                      kz: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
                      uz: ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"]
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
                      style={{ background: accentGrad }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: accentLight }}>
                        <span className="text-xs font-semibold" style={{ color: accentDark }}>{message.content}</span>
                      </div>

                      {Object.keys(slotsByDate).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(slotsByDate).map(([date, slots]) => (
                            <div key={date}>
                              <div className="mb-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: accentLight }}>
                                <span className="text-sm font-bold" style={{ color: accentDark }}>{formatDate(date)}</span>
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
                                      color: slot.available ? accentDark : "#94a3b8",
                                      border: slot.available ? `2px solid ${accentColor}` : "2px solid transparent",
                                      cursor: slot.available ? "pointer" : "not-allowed",
                                      boxShadow: slot.available ? `0 2px 8px ${hexToRgba(accentColor, 0.2)}` : "none"
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
                                      style={{ color: slot.available ? accentColor : "#94a3b8" }}
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
                          style={{ background: accentLight }}
                        >
                          <p className="text-sm font-semibold" style={{ color: accentDark }}>
                            {labels.noSlots[lang as keyof typeof labels.noSlots]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })() : message.role === "diagnostics-list" && message.diagnosticsServices ? (() => {
                  const lang = language as "en" | "ru" | "kz" | "uz";
                  const allServices = message.diagnosticsServices;
                  const COMPACT_LIMIT = 2;
                  const [primary, ...rest] = message.showAll ? allServices : allServices;
                  const compactServices = message.showAll ? rest : rest.slice(0, COMPACT_LIMIT);
                  const hasMore = !message.showAll && allServices.length > COMPACT_LIMIT + 1;

                  const categoryColors: Record<string, string> = {
                    lab: "#2563eb", imaging: "#7c3aed", cardio: "#dc2626",
                    neuro: "#0891b2", ortho: "#16a34a", ophtha: "#d97706",
                    peds: "#db2777", micro: "#65a30d",
                  };
                  const diagLabels = {
                    recommended:  { en: "Best Match", ru: "Рекомендуется", kz: "Ұсынылады", uz: "Tavsiya etiladi" },
                    alsoAvail:    { en: "Also available:", ru: "Также доступно:", kz: "Сонымен қатар:", uz: "Shuningdek mavjud:" },
                    book:         { en: "Book Appointment", ru: "Записаться на диагностику", kz: "Диагностикаға жазылу", uz: "Diagnostikaga yozilish" },
                    bookCompact:  { en: "Book", ru: "Записаться", kz: "Жазылу", uz: "Yozilish" },
                    showAll:      { en: `Show all ${allServices.length}`, ru: `Показать все ${allServices.length} услуг`, kz: `Барлық ${allServices.length}`, uz: `Barcha ${allServices.length}` },
                  };

                  if (!primary) return null;
                  return (
                    <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                      {/* Robot icon — matches other message types */}
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: accentGrad }}
                      >
                        <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                      </div>

                      <div className="flex-1">
                        {/* Label chip */}
                        <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: accentLight }}>
                          <span className="text-xs font-semibold" style={{ color: accentDark }}>{message.content}</span>
                        </div>

                        {/* ── PRIMARY card ── */}
                        <div
                          className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border relative mb-3"
                          style={{
                            background: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)",
                            borderColor: "#a78bfa",
                            boxShadow: "0 10px 40px rgba(109,40,217,0.3)"
                          }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)", filter: "blur(20px)" }}></div>
                          <div className="relative px-4 py-4 sm:px-5">
                            {/* Recommended badge */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full mb-3 text-xs font-bold" style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
                              <FontAwesomeIcon icon={faStar} className="text-amber-300 text-[9px]" />
                              <span className="text-amber-200">{diagLabels.recommended[lang]}</span>
                            </div>
                            <h3 className="text-white font-bold text-sm sm:text-base mb-1 leading-tight">{primary.name}</h3>
                            {primary.description && (
                              <p className="text-purple-200 text-xs mb-3 line-clamp-2">{primary.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: categoryColors[primary.category] ?? "#374151" }}>
                                {primary.category_label}
                              </span>
                              <span className="text-purple-200 text-xs">⏱ {primary.duration_minutes} мин</span>
                              {primary.price && (
                                <span className="text-white text-xs font-semibold">{Number(primary.price).toLocaleString()} ₸</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleBookDiagnosticsService(primary)}
                              className="w-full py-2.5 sm:py-3 font-bold rounded-lg sm:rounded-xl transition-all relative overflow-hidden group"
                              style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", color: "#4c1d95", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                            >
                              <span className="relative flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                                <span>{diagLabels.book[lang]}</span>
                                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* ── COMPACT additional cards ── */}
                        {compactServices.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold mb-2 px-1" style={{ color: "#6b7280" }}>
                              {diagLabels.alsoAvail[lang]}
                            </p>
                            <div className={`grid gap-2 ${compactServices.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                              {compactServices.map((svc) => (
                                <div
                                  key={svc.id}
                                  className="rounded-2xl overflow-hidden border relative"
                                  style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)", borderColor: "#c4b5fd", boxShadow: "0 6px 20px rgba(109,40,217,0.2)" }}
                                >
                                  <div className="px-3 py-3">
                                    <p className="text-white font-bold text-xs leading-tight mb-0.5">{svc.name}</p>
                                    <div className="flex flex-wrap items-center gap-1 mb-2">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white" style={{ background: categoryColors[svc.category] ?? "#374151" }}>
                                        {svc.category_label}
                                      </span>
                                      <span className="text-purple-300 text-[10px]">⏱ {svc.duration_minutes} мин</span>
                                    </div>
                                    {svc.price && (
                                      <p className="text-white text-[10px] font-semibold mb-2">{Number(svc.price).toLocaleString()} ₸</p>
                                    )}
                                    <button
                                      onClick={() => handleBookDiagnosticsService(svc)}
                                      className="w-full py-1.5 font-bold rounded-lg text-xs transition-all"
                                      style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", color: "#4c1d95", boxShadow: "0 3px 8px rgba(0,0,0,0.15)" }}
                                    >
                                      {diagLabels.bookCompact[lang]} →
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show all button */}
                        {hasMore && (
                          <button
                            onClick={() => handleShowAllDiagnostics(index)}
                            className="w-full py-2.5 text-xs font-semibold rounded-xl transition-all"
                            style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9", border: "1px solid rgba(109,40,217,0.2)" }}
                          >
                            {diagLabels.showAll[lang]} →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })() : message.role === "offline-no-doctors" ? (() => {
                  const lang = language as "en" | "ru" | "kz" | "uz";
                  const copy = {
                    title:  { en: "No offline doctors available right now", ru: "Нет доступных врачей для приёма", kz: "Офлайн дәрігерлер қол жетімді емес", uz: "Hozirda oflayn shifokorlar mavjud emas" },
                    body:   { en: "Unfortunately, no doctors with open slots are currently available for in-person visits.", ru: "К сожалению, в данный момент нет врачей с доступными слотами для приёма.", kz: "Өкінішке орай, қазіргі уақытта қабылдауға бос уақыты бар дәрігер жоқ.", uz: "Afsuski, hozirda qabulga bo'sh vaqtli shifokorlar mavjud emas." },
                    cta:    { en: "Try online consultation", ru: "Попробовать онлайн-консультацию", kz: "Онлайн кеңес алып көру", uz: "Onlayn konsultatsiya sinab ko'ring" },
                    ctaSub: { en: "Video call with a doctor in minutes", ru: "Видеозвонок с врачом за несколько минут", kz: "Бірнеше минутта дәрігермен бейне байланыс", uz: "Bir necha daqiqada shifokor bilan video qo'ng'iroq" },
                  };
                  return (
                    <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ background: accentGrad }}
                      >
                        <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                      </div>
                      <div className="flex-1">
                        <div
                          className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border"
                          style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "rgba(255,255,255,0.1)" }}
                        >
                          <div className="px-4 py-4 sm:px-5">
                            {/* Icon + title */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                                <FontAwesomeIcon icon={faHouse} className="text-red-400 text-base" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm leading-tight">{copy.title[lang]}</p>
                                <p className="text-slate-400 text-xs mt-1 leading-snug">{copy.body[lang]}</p>
                              </div>
                            </div>

                            {/* Online CTA */}
                            <button
                              onClick={() => handleConsultationTypeSelect('online')}
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl font-bold transition-all group relative overflow-hidden disabled:opacity-50"
                              style={{ background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}
                            >
                              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity"></div>
                              <div className="relative flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faVideo} className="text-white text-sm" />
                                  <span className="text-white text-sm sm:text-base">{copy.cta[lang]}</span>
                                  <span className="text-white group-hover:translate-x-0.5 transition-transform">→</span>
                                </div>
                                <span className="text-blue-200 text-[10px]">{copy.ctaSub[lang]}</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })() : message.role === "consultation-type-selector" ? (() => {
                  const isSelected = !!message.selectedConsultationType;
                  const typeConfig = [
                    { type: 'online'      as ConsultationFlow, label: { en: "Online",      ru: "Онлайн",      kz: "Онлайн",      uz: "Onlayn" },      sub: { en: "video consultation", ru: "видео-консультация", kz: "бейне кеңес", uz: "video konsultatsiya" }, icon: faVideo,        bg: "#1d4ed8" },
                    { type: 'offline'     as ConsultationFlow, label: { en: "Offline",     ru: "Оффлайн",     kz: "Оффлайн",     uz: "Oflayn" },      sub: { en: "in-person visit",   ru: "приём у врача",     kz: "дәрігерге баю", uz: "shifokor qabuli" }, icon: faHouse,        bg: "#0f766e" },
                    { type: 'diagnostics' as ConsultationFlow, label: { en: "Diagnostics", ru: "Диагностика", kz: "Диагностика", uz: "Diagnostika" }, sub: { en: "tests & exams",     ru: "анализы и обследование", kz: "талдау және тексеру", uz: "tahlil va tekshiruv" }, icon: faStethoscope, bg: "#7c3aed" },
                  ];
                  const lang = language as "en" | "ru" | "kz" | "uz";
                  const actionLabel = { en: { online: "Start", offline: "Book", diagnostics: "Book" }, ru: { online: "Начать", offline: "Записаться", diagnostics: "Записаться" }, kz: { online: "Бастау", offline: "Жазылу", diagnostics: "Жазылу" }, uz: { online: "Boshlash", offline: "Yozilish", diagnostics: "Yozilish" } };
                  return (
                    <div className="max-w-[92%] sm:max-w-[88%] flex gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}>
                        <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="px-2 py-1 rounded-lg mb-3 inline-block" style={{ background: accentLight }}>
                          <span className="text-xs font-semibold" style={{ color: accentDark }}>{message.content}</span>
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
                })() : message.role === "booking-flow" && message.doctor ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: accentGrad }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: hexToRgba(accentColor, 0.15), border: `1px solid ${hexToRgba(accentColor, 0.25)}` }}>
                        <span className="text-xs font-semibold" style={{ color: accentColor }}>{ui.aiLabel}</span>
                      </div>
                      <InlineBookingCard
                        doctor={message.doctor}
                        language={language}
                        accentColor={accentColor}
                        consultationType={message.bookingFlowConsultationType ?? "online"}
                        initialSlot={message.bookingFlowInitialSlot}
                        onBookingComplete={handleBookingComplete}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[90%] sm:max-w-[85%]">
                    <div
                      className={`rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg ${message.isChoice ? "flex items-center gap-2.5" : ""}`}
                      style={{
                        background: accentGrad,
                      }}
                    >
                      {message.isChoice && (
                        <FontAwesomeIcon icon={faCircleCheck} className="text-sm flex-shrink-0" style={{ color: onAccent }} />
                      )}
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Attached"
                          className="max-w-full rounded-xl mb-2"
                          style={{ maxHeight: "300px", objectFit: "contain" }}
                        />
                      )}
                      <p className="text-sm sm:text-base leading-relaxed break-words" style={{ color: onAccent, overflowWrap: "break-word", wordBreak: "break-word" }}>{message.content}</p>
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
                  style={{ background: accentGrad }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-xs sm:text-sm" style={{ color: onAccent }} />
                </div>
                <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border" style={{ background: embedded ? "#F1F5F9" : "rgba(255,255,255,0.055)", borderColor: embedded ? "#E2E8F0" : "rgba(255,255,255,0.09)" }}>
                  {streamingText ? (
                    <div className="text-sm sm:text-base break-words" style={{ color: embedded ? "#0F172A" : "rgba(255,255,255,0.88)", overflowWrap: "break-word", wordBreak: "break-word" }}>
                      {formatAIMessage(streamingText, accentColor)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm sm:text-base" style={{ color: accentColor }} />
                      <span className="text-sm sm:text-base" style={{ color: embedded ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.60)" }}>
                        {{ ru: "Анализирую симптомы...", en: "Analysing symptoms...", kz: "Симптомдарды талдаймын...", uz: "Simptomlarni tahlil qilmoqdaman..." }[language as "ru" | "en" | "kz" | "uz"] ?? "Анализирую симптомы..."}
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
      <div className={embedded ? "border-t flex-shrink-0" : "sticky bottom-0 backdrop-blur-xl border-t"} style={{ background: embedded ? "#FFFFFF" : "rgba(10,10,27,0.96)", borderColor: embedded ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.07)" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-[200px] max-h-[200px] rounded-xl border-2"
                style={{ borderColor: accentColor }}
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
            <div className="relative rounded-3xl border transition-all shadow-lg"
              style={{
                borderColor: embedded ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.10)",
                background: embedded ? "#F8FAFC" : "rgba(255,255,255,0.06)"
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
                  className={`flex-1 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-3xl focus:outline-none focus:ring-0 focus:border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-transparent text-xs sm:text-sm lg:text-base resize-none overflow-hidden break-words border-0 ${embedded ? "placeholder-slate-400" : "placeholder-white/25"}`}
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
                    appearance: "none",
                    color: embedded ? "#0F172A" : "rgba(255,255,255,0.86)"
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
                    background: imagePreview ? accentColor : "transparent",
                    color: imagePreview ? "white" : accentColor
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
                    color: isRecording ? "white" : accentColor
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
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                  style={{
                    background: (input.trim() || imagePreview) && !isLoading
                      ? accentGrad
                      : embedded ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.10)",
                    color: (input.trim() || imagePreview) && !isLoading ? onAccent : embedded ? "rgba(15,23,42,0.30)" : "rgba(255,255,255,0.35)"
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
                      style={{ background: accentColor }}
                    />
                  )}
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs sm:text-sm" />
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[8px] xs:text-[9px] sm:text-xs px-2" style={{ color: embedded ? "rgba(15,23,42,0.35)" : "rgba(255,255,255,0.28)" }}>
            <span className="font-medium whitespace-nowrap">{ui.enterHint}</span>
            <span className="whitespace-nowrap">•</span>
            <span className="font-medium whitespace-nowrap">{ui.shiftHint}</span>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => { setIsBookingModalOpen(false); setPreselectedDoctor(null); setBookingConsultationType('online'); }}
        onBookingComplete={handleBookingComplete}
        language={language}
        preselectedDoctor={preselectedDoctor}
        consultationType={bookingConsultationType}
      />

      {/* Diagnostics Booking Modal */}
      <DiagnosticsBookingModal
        isOpen={isDiagBookingOpen}
        onClose={() => { setIsDiagBookingOpen(false); setSelectedDiagService(null); }}
        onBookingComplete={handleDiagnosticsBookingComplete}
        language={language}
        service={selectedDiagService}
      />
    </div>
  );
}
