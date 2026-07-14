"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import Image from "next/image";
import { Message } from "./types";
import { useChat } from "./hooks/useChat";
import ChatMessages from "./ChatMessages";
import BookingModal from "./BookingModal";
import ZhanBotLogoKZ from "@/assets/ZhanBotAi.png";
import JonBotLogoUZ from "@/assets/zhanbot_uz.png";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  ArrowUp,
  Mic,
  MoreHorizontal,
  Share2,
  ChevronDown,
  HelpCircle,
  Settings,
  LogOut,
  Sparkles,
  X,
  Stethoscope,
} from "lucide-react";
import { FaUser, FaThermometerHalf, FaBrain, FaPills, FaVirus, FaHeartbeat } from "react-icons/fa";

// ─── Types ───────────────────────────────────────────────
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const MAX_SESSIONS = 30;
const sessionKey = (uid: number | string) => `zhancare_sessions_${uid}`;

// ─── Helpers ─────────────────────────────────────────────
function timeAgo(iso: string, lang: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return lang === "ru" ? "только что" : lang === "kz" ? "жаңа ғана" : "just now";
  if (diff < 3600) { const m = Math.floor(diff / 60); return lang === "ru" ? `${m} мин` : `${m}m`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return lang === "ru" ? `${h} ч` : `${h}h`; }
  const d = Math.floor(diff / 86400);
  if (d === 1) return lang === "ru" ? "вчера" : lang === "kz" ? "кеше" : "yesterday";
  return lang === "ru" ? `${d} дн` : `${d}d`;
}

// ─── i18n ────────────────────────────────────────────────
const t = {
  ru: {
    newChat: "Новый чат",
    searchPlaceholder: "Поиск чатов...",
    recent: "Недавние",
    community: "Сообщество",
    help: "Помощь",
    settings: "Настройки",
    logout: "Выйти",
    noChats: "Нет чатов",
    bannerTitle: "Консультируйте без ограничений",
    bannerSub: "Неограниченный доступ к ИИ-анализу",
    bannerCta: "Подробнее",
    greeting: (n: string) => `Привет, ${n}!`,
    subtitle: "Опишите симптомы — получите рекомендации за 30 секунд",
    inputPlaceholder: "Опишите ваши симптомы...",
    online: "Онлайн",
    version: "ZhanBot.AI 1.0",
    cards: [
      { icon: "🔬", title: "Анализ симптомов", desc: "Клинический анализ ваших симптомов за секунды" },
      { icon: "👨‍⚕️", title: "Подобрать врача", desc: "ИИ найдёт подходящего специалиста для вас" },
      { icon: "💊", title: "Вопросы о лечении", desc: "Задайте вопрос о препаратах и процедурах" },
    ],
    chips: [
      { short: "Температура", full: "Температура и озноб" },
      { short: "Головная боль", full: "Сильная головная боль" },
      { short: "Простуда", full: "Насморк и боль в горле" },
      { short: "Боль", full: "Боль в груди при дыхании" },
      { short: "Лекарства", full: "Какое лекарство принять" },
    ],
    bookLabel: "Записаться к врачу",
  },
  en: {
    newChat: "New chat",
    searchPlaceholder: "Search chats...",
    recent: "Recent",
    community: "Community",
    help: "Help",
    settings: "Settings",
    logout: "Log out",
    noChats: "No chats yet",
    bannerTitle: "Unlimited AI access",
    bannerSub: "Get full access to AI medical analysis",
    bannerCta: "Learn more",
    greeting: (n: string) => `Hello, ${n}!`,
    subtitle: "Describe your symptoms — get recommendations in 30 seconds",
    inputPlaceholder: "Describe your symptoms...",
    online: "Online",
    version: "ZhanBot.AI 1.0",
    cards: [
      { icon: "🔬", title: "Symptom Analysis", desc: "Clinical analysis of your symptoms in seconds" },
      { icon: "👨‍⚕️", title: "Find a Doctor", desc: "AI matches you with the right specialist" },
      { icon: "💊", title: "Treatment Help", desc: "Ask about medications and procedures" },
    ],
    chips: [
      { short: "Fever", full: "Fever and chills" },
      { short: "Headache", full: "Severe headache" },
      { short: "Cold", full: "Runny nose and sore throat" },
      { short: "Chest pain", full: "Chest pain when breathing" },
      { short: "Medicine", full: "What medicine should I take" },
    ],
    bookLabel: "Book a Doctor",
  },
  kz: {
    newChat: "Жаңа чат",
    searchPlaceholder: "Чаттарды іздеу...",
    recent: "Соңғы",
    community: "Қоғамдастық",
    help: "Көмек",
    settings: "Параметрлер",
    logout: "Шығу",
    noChats: "Чат жоқ",
    bannerTitle: "Шексіз AI қолжетімділігі",
    bannerSub: "AI медициналық талдауға толық қолжетімділік",
    bannerCta: "Толығырақ",
    greeting: (n: string) => `Сәлем, ${n}!`,
    subtitle: "Симптомдарды сипаттаңыз — 30 секундта ұсыныстар алыңыз",
    inputPlaceholder: "Симптомдарыңызды сипаттаңыз...",
    online: "Желіде",
    version: "ZhanBot.AI 1.0",
    cards: [
      { icon: "🔬", title: "Симптом талдауы", desc: "Секундтарда клиникалық талдау" },
      { icon: "👨‍⚕️", title: "Дәрігер табу", desc: "AI сізге сәйкес маман табады" },
      { icon: "💊", title: "Емдеу сұрақтары", desc: "Дәрілер мен процедуралар туралы сұраңыз" },
    ],
    chips: [
      { short: "Температура", full: "Температура және дірілдеу" },
      { short: "Бас ауруы", full: "Қатты бас ауруы" },
      { short: "Суық тию", full: "Мұрын ағуы және жұтқыншақ ауруы" },
      { short: "Ауырсыну", full: "Тыныс алғанда кеуде ауруы" },
      { short: "Дәрі", full: "Қандай дәрі ішу керек" },
    ],
    bookLabel: "Дәрігерге жазылу",
  },
  uz: {
    newChat: "Yangi chat",
    searchPlaceholder: "Chatlarni qidirish...",
    recent: "So'nggi",
    community: "Jamiyat",
    help: "Yordam",
    settings: "Sozlamalar",
    logout: "Chiqish",
    noChats: "Chatlar yo'q",
    bannerTitle: "Cheksiz AI kirish",
    bannerSub: "AI tibbiy tahlilga to'liq kirish",
    bannerCta: "Ko'proq",
    greeting: (n: string) => `Salom, ${n}!`,
    subtitle: "Simptomlaringizni tasvirlang — 30 soniyada tavsiyalar",
    inputPlaceholder: "Simptomlaringizni tasvirlang...",
    online: "Onlayn",
    version: "ZhanBot.AI 1.0",
    cards: [
      { icon: "🔬", title: "Simptomlar tahlili", desc: "Soniyalarda klinik tahlil" },
      { icon: "👨‍⚕️", title: "Shifokor topish", desc: "AI siz uchun mutaxassis topadi" },
      { icon: "💊", title: "Davolash savollari", desc: "Dori va protseduralar haqida so'rang" },
    ],
    chips: [
      { short: "Harorat", full: "Harorat va qaltirash" },
      { short: "Bosh og'rig'i", full: "Kuchli bosh og'rig'i" },
      { short: "Shamollash", full: "Burun bitishi va tomoq og'rig'i" },
      { short: "Og'riq", full: "Nafas olganda ko'krak og'rig'i" },
      { short: "Dori", full: "Qaysi dorini ichish kerak" },
    ],
    bookLabel: "Shifokorga yozilish",
  },
};

const chipIcons = [FaThermometerHalf, FaBrain, FaVirus, FaHeartbeat, FaPills];

// ─── Component ───────────────────────────────────────────
export default function PatientChatLayout() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { brand } = useBrand();
  const isUzbek = brand.id === "uz" || language === "uz";
  const ZhanBotLogo = isUzbek ? JonBotLogoUZ : ZhanBotLogoKZ;
  const lang = (t[language as keyof typeof t] ?? t.ru);

  // ── Session state ──
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const key = user ? sessionKey(user.id) : null;
  const genId = () => `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const startNewSession = useCallback(() => {
    setActiveSessionId(genId());
    setMessages([]);
    setInput("");
    setImagePreview(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sessions
  useEffect(() => {
    if (!key) { startNewSession(); return; }
    try {
      const raw = localStorage.getItem(key);
      const parsed: ChatSession[] = raw ? JSON.parse(raw) : [];
      setSessions(parsed);
      if (parsed.length > 0) {
        const latest = parsed[0];
        setActiveSessionId(latest.id);
        setMessages(latest.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else {
        startNewSession();
      }
    } catch { startNewSession(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Auto-save session
  useEffect(() => {
    if (!activeSessionId || !key) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSessions(prev => {
        const firstUser = messages.find(m => m.sender === "user");
        const title = firstUser
          ? firstUser.text.slice(0, 44) + (firstUser.text.length > 44 ? "…" : "")
          : lang.newChat;
        const now = new Date().toISOString();
        const exists = prev.some(s => s.id === activeSessionId);
        const updated = exists
          ? prev.map(s => s.id === activeSessionId ? { ...s, title, messages, updatedAt: now } : s)
          : [{ id: activeSessionId, title, messages, createdAt: now, updatedAt: now }, ...prev];
        const sorted = [...updated].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const limited = sorted.slice(0, MAX_SESSIONS);
        localStorage.setItem(key, JSON.stringify(limited));
        return limited;
      });
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId, key]);

  const loadSession = (s: ChatSession) => {
    setActiveSessionId(s.id);
    setMessages(s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    setInput("");
    setImagePreview(null);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      if (key) localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
    if (sessionId === activeSessionId) startNewSession();
  };

  // Chat hook
  const { streaming, streamingMessageId, handleSend: onSend, handleImageUpload } = useChat({
    messages, setMessages, input, setInput, imagePreview, setImagePreview, language, messagesContainerRef,
  });

  const handleSend = () => {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }
  };

  const handleBookAppointment = () => setIsBookingModalOpen(true);

  const handleBookingComplete = useCallback(
    (d: { doctorName: string; doctorType: string; scheduledTime: string; meetingId?: string }) => {
      const date = new Date(d.scheduledTime);
      const locale = { kz: "kk-KZ", en: "en-US", uz: "uz-UZ", ru: "ru-RU" }[language] ?? "ru-RU";
      const fd = date.toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const ft = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      const link = d.meetingId
        ? language === "ru" ? `\n🔗 **Ссылка:** [Войти](/video-call/patient?meetingId=${d.meetingId})` : `\n🔗 **Link:** [Join](/video-call/patient?meetingId=${d.meetingId})`
        : "";
      const text = language === "en"
        ? `✅ **Confirmed!** Appointment with **${d.doctorName}** (${d.doctorType})\n📅 ${fd} · 🕐 ${ft}${link}`
        : `✅ **Запись подтверждена!** К **${d.doctorName}** (${d.doctorType})\n📅 ${fd} · 🕐 ${ft}${link}`;
      setMessages(prev => [...prev, { id: `bk_${Date.now()}`, sender: "bot", text, timestamp: new Date(), showDoctorButton: false }]);
    },
    [language]
  );

  const filtered = searchQuery
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  const firstName = user?.first_name || (language === "ru" ? "пользователь" : "there");
  const hasMessages = messages.length > 0;
  const canSend = !streaming && (!!input.trim() || !!imagePreview);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: "#0A0A1B" }}>

      {/* ── SIDEBAR ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{ background: "#0D0D22", borderRight: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex flex-col h-full w-[288px]">

              {/* Logo row */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <Image src={ZhanBotLogo} alt="ZhanBot.AI" width={130} height={36} className="h-7 w-auto" priority />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.60)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* New chat button */}
              <div className="px-3 pb-2">
                <button
                  onClick={startNewSession}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/90 group transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)` }}
                    >
                      <Plus size={11} className="text-white" />
                    </div>
                    <span>{lang.newChat}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.30)" }}>⌘</kbd>
                    <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.30)" }}>N</kbd>
                  </div>
                </button>
              </div>

              {/* Search */}
              <div className="px-3 pb-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Search size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={lang.searchPlaceholder}
                    className="flex-1 bg-transparent text-[13px] outline-none min-w-0"
                    style={{ color: "rgba(255,255,255,0.70)" }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ color: "rgba(255,255,255,0.25)" }}>
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Community link */}
              <div className="px-3 pb-2">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors text-left"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  <MessageSquare size={14} />
                  {lang.community}
                </button>
              </div>

              {/* Divider */}
              <div className="mx-4 mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              {/* Sessions list */}
              <div className="flex-1 overflow-y-auto px-3 min-h-0" style={{ scrollbarWidth: "none" }}>
                {sessions.length > 0 && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: "rgba(255,255,255,0.20)" }}>
                    {lang.recent}
                  </p>
                )}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <MessageSquare size={20} style={{ color: "rgba(255,255,255,0.10)" }} />
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>{lang.noChats}</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filtered.map(session => {
                      const isActive = session.id === activeSessionId;
                      return (
                        <div
                          key={session.id}
                          onClick={() => loadSession(session)}
                          onMouseEnter={() => setHoveredSession(session.id)}
                          onMouseLeave={() => setHoveredSession(null)}
                          className="group relative flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: isActive ? "rgba(79,127,255,0.10)" : hoveredSession === session.id ? "rgba(255,255,255,0.04)" : "transparent",
                            borderLeft: `2px solid ${isActive ? "#4F7FFF" : "transparent"}`,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[13px] truncate"
                              style={{ color: isActive ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.52)" }}
                            >
                              {session.title}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.20)" }}>
                              {timeAgo(session.updatedAt, language)}
                            </p>
                          </div>
                          <button
                            onClick={e => deleteSession(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all flex-shrink-0"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.80)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.25)"; }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Promo banner */}
              <div className="mx-3 mb-3">
                <div
                  className="px-4 py-3.5 rounded-2xl relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(30,45,140,0.80) 0%, rgba(20,20,50,0.90) 100%)", border: "1px solid rgba(79,127,255,0.20)" }}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full" style={{ background: "radial-gradient(circle, rgba(79,127,255,0.15) 0%, transparent 70%)" }} />
                  <Sparkles size={14} className="mb-2" style={{ color: "#6AA2FF" }} />
                  <p className="text-[13px] font-semibold text-white mb-0.5">{lang.bannerTitle}</p>
                  <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>{lang.bannerSub}</p>
                  <button
                    className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                    style={{ background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)` }}
                  >
                    {lang.bannerCta} →
                  </button>
                </div>
              </div>

              {/* Bottom links */}
              <div className="px-3 pb-4 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="pt-3" />
                {[
                  { icon: HelpCircle, label: lang.help },
                  { icon: Settings, label: lang.settings },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-left transition-colors"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.70)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}

                {/* User row */}
                {user && (
                  <div className="flex items-center gap-3 px-3 py-2 mt-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${brand.secondary || "#001E80"}, ${brand.primary || "#4F7FFF"})` }}
                    >
                      {user.first_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.70)" }}>
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                    <button style={{ color: "rgba(255,255,255,0.22)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.70)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.22)"; }}
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN AREA ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#111128" }}>

        {/* Top bar — like EchoAI */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(17,17,40,0.90)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors mr-1"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
              >
                <ChevronRight size={15} />
              </button>
            )}
            {/* Model selector */}
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.10)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Stethoscope size={14} style={{ color: "#6AA2FF" }} />
              {lang.version}
              <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              <Share2 size={14} />
            </button>
            <button
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}
            >
              <MoreHorizontal size={14} />
            </button>
            {/* User avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)`, boxShadow: "0 0 0 2px rgba(79,127,255,0.25)" }}
            >
              {user?.first_name?.[0]?.toUpperCase() ?? <FaUser size={12} />}
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!hasMessages ? (
            /* ── EMPTY STATE (EchoAI style) ── */
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-2xl flex flex-col items-center"
              >
                {/* Greeting */}
                <motion.h1
                  className="text-3xl font-bold text-center mb-2"
                  style={{ color: "rgba(255,255,255,0.92)" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  {lang.greeting(firstName)}
                </motion.h1>
                <motion.p
                  className="text-base text-center mb-1"
                  style={{ color: "rgba(255,255,255,0.38)" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14 }}
                >
                  {lang.subtitle}
                </motion.p>

                {/* ── Large input box (EchoAI style) ── */}
                <motion.div
                  className="w-full mt-8 mb-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.20 }}
                >
                  <div
                    className="w-full rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.30)",
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      placeholder={lang.inputPlaceholder}
                      rows={3}
                      disabled={streaming}
                      className="w-full bg-transparent outline-none resize-none px-5 pt-5 pb-2 text-sm leading-relaxed placeholder-white/20"
                      style={{ color: "rgba(255,255,255,0.86)", minHeight: 80, maxHeight: 180 }}
                    />
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <label
                        className="flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer transition-colors"
                        style={{ color: "rgba(255,255,255,0.30)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLLabelElement).style.color = "rgba(255,255,255,0.70)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = "transparent"; (e.currentTarget as HTMLLabelElement).style.color = "rgba(255,255,255,0.30)"; }}
                      >
                        <Plus size={16} />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                          style={{ color: "rgba(255,255,255,0.28)" }}
                        >
                          <Mic size={15} />
                        </button>
                        <motion.button
                          onClick={handleSend}
                          disabled={!canSend}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all"
                          style={
                            canSend
                              ? { background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)`, boxShadow: "0 4px 16px rgba(63,87,255,0.35)" }
                              : { background: "rgba(255,255,255,0.06)", opacity: 0.4, cursor: "not-allowed" }
                          }
                          whileHover={canSend ? { scale: 1.08 } : {}}
                          whileTap={canSend ? { scale: 0.93 } : {}}
                        >
                          <ArrowUp size={15} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── 3 Category cards (EchoAI style) ── */}
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  {lang.cards.map((card, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.07 }}
                      onClick={() => { setInput(card.title); textareaRef.current?.focus(); }}
                      className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(79,127,255,0.08)", borderColor: "rgba(79,127,255,0.20)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: "rgba(79,127,255,0.12)", border: "1px solid rgba(79,127,255,0.18)" }}
                      >
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.80)" }}>{card.title}</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{card.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Chips */}
                <motion.div
                  className="flex flex-wrap justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {lang.chips.map((chip, i) => {
                    const Icon = chipIcons[i];
                    return (
                      <motion.button
                        key={i}
                        onClick={() => { setInput(chip.full); textareaRef.current?.focus(); }}
                        disabled={streaming}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.50)" }}
                        whileHover={!streaming ? { scale: 1.04, y: -1, backgroundColor: "rgba(79,127,255,0.10)", borderColor: "rgba(79,127,255,0.25)", color: "rgba(255,255,255,0.85)" } : {}}
                        whileTap={!streaming ? { scale: 0.97 } : {}}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.52 + i * 0.05 }}
                      >
                        <Icon size={10} style={{ color: "#6AA2FF", flexShrink: 0 }} />
                        {chip.short}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            </div>
          ) : (
            /* ── MESSAGES VIEW ── */
            <div className="flex-1 flex flex-col min-h-0 px-4 pt-4">
              <ChatMessages
                messages={messages}
                streaming={streaming}
                streamingMessageId={streamingMessageId}
                language={language}
                messagesContainerRef={messagesContainerRef}
                onBookAppointment={handleBookAppointment}
                expanded={true}
              />
            </div>
          )}

          {/* ── INPUT (messages view only) ── */}
          {hasMessages && (
            <div className="flex-shrink-0 px-4 pb-4 pt-2">
              <div
                className="flex items-end gap-2 px-4 py-3 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.20)",
                }}
              >
                <label
                  className="flex-shrink-0 cursor-pointer w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLLabelElement).style.color = "rgba(255,255,255,0.65)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = "transparent"; (e.currentTarget as HTMLLabelElement).style.color = "rgba(255,255,255,0.28)"; }}
                >
                  <Paperclip size={15} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={lang.inputPlaceholder}
                  rows={1}
                  disabled={streaming}
                  className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
                  style={{ color: "rgba(255,255,255,0.86)", maxHeight: 120 }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={
                    canSend
                      ? { background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)`, boxShadow: "0 4px 16px rgba(63,87,255,0.35)" }
                      : { background: "rgba(255,255,255,0.06)", opacity: 0.4, cursor: "not-allowed" }
                  }
                  whileHover={canSend ? { scale: 1.08 } : {}}
                  whileTap={canSend ? { scale: 0.93 } : {}}
                >
                  <ArrowUp size={15} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingComplete={handleBookingComplete}
        language={language}
      />
    </div>
  );
}
