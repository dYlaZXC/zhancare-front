"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import Image from "next/image";
import AISymptomsChecker from "./AISymptomsChecker";
import type { ClinicContext } from "@/lib/ai";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

type SavedMessage = { role: "user" | "assistant"; content: string; imageUrl?: string };

const MAX_SESSIONS = 20;
const sessionKey = (uid: number | null) =>
  uid ? `zhancare_consult_sessions_${uid}` : "zhancare_consult_sessions_guest";
const msgKey = (uid: number | null, sid: string) =>
  `zhancare_consult_msgs_${uid ?? "guest"}_${sid}`;

function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (lang === "en") {
    if (m < 1) return "just now";
    if (h < 1) return `${m}m`;
    if (d < 1) return `${h}h`;
    return `${d}d`;
  }
  if (lang === "kz") {
    if (m < 1) return "қазір";
    if (h < 1) return `${m} мин`;
    if (d < 1) return `${h} сағ`;
    return `${d} күн`;
  }
  if (lang === "uz") {
    if (m < 1) return "hozir";
    if (h < 1) return `${m} min`;
    if (d < 1) return `${h} soat`;
    return `${d} kun`;
  }
  // ru default
  if (m < 1) return "только что";
  if (h < 1) return `${m} мин`;
  if (d < 1) return `${h} ч`;
  return `${d} дн`;
}

const LABELS = {
  ru: { newChat: "Новый чат", search: "Поиск чатов...", community: "Сообщество", help: "Помощь", settings: "Настройки", recent: "Недавние", promo: "Консультируйте без ограничений", promoSub: "Неограниченный доступ к ИИ-анализу симптомов", promoCta: "Подробнее →", back: "Назад", guest: "Гость", greeting: "Привет", greetingGuest: "Привет!", greetingSub: "Опишите симптомы — получите рекомендации за 30 секунд", inputPlaceholder: "Опишите ваши симптомы...", card1: "Анализ симптомов", card1d: "Клинический анализ ваших симптомов за секунды", card2: "Подобрать врача", card2d: "ИИ найдёт подходящего специалиста для вас", card3: "Вопросы о лечении", card3d: "Задайте вопрос о препаратах и процедурах", chips: ["Температура", "Головная боль", "Простуда", "Боль в груди", "Лекарства"] },
  en: { newChat: "New chat", search: "Search chats...", community: "Community", help: "Help", settings: "Settings", recent: "Recent", promo: "Consult without limits", promoSub: "Unlimited AI symptom analysis access", promoCta: "Learn more →", back: "Back", guest: "Guest", greeting: "Hello", greetingGuest: "Hello!", greetingSub: "Describe your symptoms — get recommendations in 30 seconds", inputPlaceholder: "Describe your symptoms...", card1: "Symptom Analysis", card1d: "Clinical analysis of your symptoms in seconds", card2: "Find a Doctor", card2d: "AI will find the right specialist for you", card3: "Treatment Questions", card3d: "Ask about medications and procedures", chips: ["Fever", "Headache", "Cold", "Chest pain", "Medications"] },
  kz: { newChat: "Жаңа чат", search: "Іздеу...", community: "Қауымдастық", help: "Көмек", settings: "Параметрлер", recent: "Жақында", promo: "Шексіз кеңес алыңыз", promoSub: "ЖИ симптомдарды талдауға шексіз қол жеткізу", promoCta: "Толығырақ →", back: "Артқа", guest: "Қонақ", greeting: "Сәлем", greetingGuest: "Сәлем!", greetingSub: "Симптомдарды сипаттаңыз — 30 секундта ұсыныстар алыңыз", inputPlaceholder: "Симптомдарыңызды сипаттаңыз...", card1: "Симптомдарды талдау", card1d: "Симптомдарыңызды секундтар ішінде клиникалық талдау", card2: "Дәрігер таңдау", card2d: "ЖИ сізге тиісті маманды табады", card3: "Емдеу сұрақтары", card3d: "Препараттар мен процедуралар туралы сұраңыз", chips: ["Температура", "Бас ауруы", "Суық тию", "Кеуде ауруы", "Дәрілер"] },
  uz: { newChat: "Yangi chat", search: "Chatlarni izlash...", community: "Jamoa", help: "Yordam", settings: "Sozlamalar", recent: "Yaqinda", promo: "Cheksiz maslahat oling", promoSub: "AI simptom tahlilga cheksiz kirish", promoCta: "Batafsil →", back: "Orqaga", guest: "Mehmon", greeting: "Salom", greetingGuest: "Salom!", greetingSub: "Simptomlarni tasvirlang — 30 soniyada tavsiyalar oling", inputPlaceholder: "Simptomlaringizni tasvirlang...", card1: "Simptom tahlili", card1d: "Simptomlaringizni soniyalar ichida klinik tahlil qilish", card2: "Shifokor tanlash", card2d: "AI siz uchun mutaxassisni topadi", card3: "Davolash savollari", card3d: "Dorilar va protseduralar haqida so'rang", chips: ["Harorat", "Bosh og'rig'i", "Shamollash", "Ko'krak og'rig'i", "Dorilar"] },
};

export default function SymptomsPageLayout({ clinic }: { clinic?: ClinicContext }) {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { brand, appLogo } = useBrand();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [initialMsg, setInitialMsg] = useState("");
  const [emptyInput, setEmptyInput] = useState("");
  const [emptyImagePreview, setEmptyImagePreview] = useState<string | null>(null);
  const emptyFileInputRef = useRef<HTMLInputElement>(null);
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<SavedMessage[]>([]);

  // keep refs in sync for use inside callbacks without stale closures
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const userIdRef = useRef(user?.id ?? null);
  userIdRef.current = user?.id ?? null;
  const sidebarBgRef = useRef<HTMLDivElement>(null);

  const L = LABELS[language as keyof typeof LABELS] ?? LABELS.ru;
  const botName = brand.id === "uz" || language === "uz" ? "JonBot.Ai" : "ZhanBot.AI";

  // Load sessions from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(sessionKey(user?.id ?? null));
    if (raw) {
      try { setSessions(JSON.parse(raw)); } catch { /* corrupt data */ }
    }
  }, [user?.id]);

  // Responsive sidebar: open on desktop, closed/overlay on mobile
  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const handleMessagesChange = (msgs: SavedMessage[]) => {
    const sid = activeSessionIdRef.current;
    if (!sid) return;
    localStorage.setItem(msgKey(userIdRef.current, sid), JSON.stringify(msgs));
  };

  const startChat = (msg: string, imageUrl?: string) => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: msg.slice(0, 40) || (imageUrl ? "📎 Анализ изображения" : "Новый чат"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newSession, ...sessionsRef.current].slice(0, MAX_SESSIONS);
    localStorage.setItem(sessionKey(user?.id ?? null), JSON.stringify(next));
    setSessions(next);
    setActiveSessionId(newSession.id);
    setLoadedMessages([]);
    setEmptyInput("");
    setEmptyImagePreview(null);
    setInitialMsg(msg);
    setInitialImage(imageUrl ?? null);
    setChatStarted(true);
    setChatKey(k => k + 1);
    if (isMobile) setSidebarOpen(false);
  };

  const startNewSession = () => {
    setInitialMsg("");
    setChatStarted(false);
    setEmptyInput("");
    setActiveSessionId(null);
    setLoadedMessages([]);
    setChatKey(k => k + 1);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = sessionsRef.current.filter(s => s.id !== id);
    localStorage.setItem(sessionKey(user?.id ?? null), JSON.stringify(next));
    setSessions(next);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setChatStarted(false);
      setLoadedMessages([]);
      setChatKey(k => k + 1);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userInitial = user ? (user.first_name?.[0] ?? "П").toUpperCase() : "Г";
  const userName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : L.guest;

  const iconBtn = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "rgba(255,255,255,0.28)",
  } as const;

  const iconBtnLight = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "rgba(15,23,42,0.40)",
  } as const;

  return (
    <div className="fixed inset-0 z-[60] flex overflow-hidden" style={{ background: "#0A0A1B" }}>

      {/* ── Mobile backdrop ──────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[61] bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
        <motion.aside
          key="sidebar"
          initial={isMobile ? { x: -288 } : { width: 0, opacity: 0 }}
          animate={isMobile ? { x: 0 } : { width: 288, opacity: 1 }}
          exit={isMobile ? { x: -288 } : { width: 0, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.8 }}
          className={`flex flex-col flex-shrink-0 ${isMobile ? "fixed inset-y-0 left-0 z-[62]" : "relative overflow-hidden"}`}
          style={{ borderRight: "1px solid rgba(55,114,255,0.15)" }}
        >
          {/* inner shell — keeps content at full width; owns background + mouse-move effect */}
          <div
            ref={sidebarBgRef}
            style={{ width: 288, minWidth: 288, background: "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)" }}
            className="flex flex-col h-full relative"
            onMouseMove={e => {
              if (sidebarBgRef.current) sidebarBgRef.current.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, rgba(55,114,255,0.22) 0%, transparent 52%), linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)`;
            }}
            onMouseLeave={() => {
              if (sidebarBgRef.current) sidebarBgRef.current.style.background = "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)";
            }}
          >
          {/* Ambient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-8 left-6 w-28 h-28 rounded-full blur-xl opacity-60" style={{ background: "radial-gradient(circle, rgba(55,114,255,0.18) 0%, transparent 70%)", animation: "pulse 4s ease-in-out infinite" }} />
            <div className="absolute bottom-24 right-3 w-20 h-20 rounded-full blur-lg opacity-50" style={{ background: "radial-gradient(circle, rgba(50,103,230,0.22) 0%, transparent 70%)", animation: "bounce 3s ease-in-out infinite" }} />
          </div>
          {/* Logo + collapse */}
          <div className="flex items-center justify-between px-4 pt-5 pb-5 relative z-10 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <Image src={appLogo} alt={brand.name} width={200} height={52} className="h-11 w-auto max-w-[172px] object-contain drop-shadow-md" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.60)" }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
          </div>
          {/* New chat */}
          <div className="px-3 pt-4 pb-2 relative z-10">
            <button
              onClick={startNewSession}
              className="w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-300 overflow-hidden"
              style={{ background: "rgba(55,114,255,0.08)", border: "1px solid rgba(55,114,255,0.25)", color: "rgba(255,255,255,0.80)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.18)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(55,114,255,0.45)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(55,114,255,0.25)"; }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #3267e6 0%, #1e4099 100%)" }}>
                  <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                {L.newChat}
              </div>
              <div className="flex gap-1">
                <kbd className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.38)", fontFamily: "inherit" }}>⌘</kbd>
                <kbd className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.38)", fontFamily: "inherit" }}>N</kbd>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 pointer-events-none" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2 relative z-10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder={L.search}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder-white/30"
                style={{ color: "rgba(255,255,255,0.75)" }}
              />
            </div>
          </div>

          {/* Community */}
          <div className="px-3 pb-1 relative z-10">
            <button
              className="w-full group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] text-left transition-all duration-300 overflow-hidden"
              style={{ background: "rgba(55,114,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              {L.community}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 pointer-events-none" />
            </button>
          </div>

          <div className="relative z-10" style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 16px 10px" }} />

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto px-3 min-h-0 relative z-10" style={{ scrollbarWidth: "none" }}>
            {filteredSessions.length > 0 && (
              <p className="text-[10px] font-semibold uppercase px-2 mb-2" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
                {L.recent}
              </p>
            )}
            {filteredSessions.map(session => {
              const isActive = activeSessionId === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem(msgKey(user?.id ?? null, session.id));
                      setLoadedMessages(raw ? JSON.parse(raw) : []);
                    } catch { setLoadedMessages([]); }
                    setInitialMsg("");
                    setActiveSessionId(session.id);
                    setChatStarted(true);
                    setChatKey(k => k + 1);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className="group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all duration-300 overflow-hidden"
                  style={{
                    background: isActive ? "rgba(55,114,255,0.15)" : "transparent",
                    border: isActive ? "1px solid rgba(55,114,255,0.40)" : "1px solid transparent",
                    boxShadow: isActive ? "0 0 16px rgba(55,114,255,0.12)" : "none",
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "rgba(55,114,255,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; } }}
                >
                  {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-sm" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate font-medium" style={{ color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.60)" }}>
                      {session.title}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                      {timeAgo(session.updatedAt, language)}
                    </div>
                  </div>
                  {isActive && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse group-hover:hidden" />}
                  <button
                    onClick={e => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity"
                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.50)", border: "none", cursor: "pointer" }}
                  >
                    <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Promo banner */}
          <div className="mx-3 mb-3 p-3.5 rounded-2xl relative overflow-hidden z-10"
               style={{ background: "linear-gradient(135deg, rgba(18,38,58,0.92) 0%, rgba(41,53,143,0.88) 100%)", border: "1px solid rgba(55,114,255,0.28)" }}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(55,114,255,0.22) 0%, transparent 70%)" }} />
            <svg width="13" height="13" fill="none" stroke="#6AA2FF" strokeWidth="1.8" viewBox="0 0 24 24" className="mb-1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <div className="text-[12px] font-semibold mb-0.5 text-white">{L.promo}</div>
            <div className="text-[11px] mb-2.5" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{L.promoSub}</div>
            <button className="group relative text-[11px] font-semibold px-3 py-1.5 rounded-xl text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #3267e6 0%, #1e4099 100%)", border: "1px solid rgba(55,114,255,0.35)", cursor: "pointer", boxShadow: "0 4px 14px rgba(55,114,255,0.28)" }}>
              {L.promoCta}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700" />
            </button>
          </div>

          {/* Footer */}
          <div className="border-t px-3 pt-2.5 pb-3 relative z-10" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="space-y-1 mb-2">
              {([
                { label: L.help, icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                { label: L.settings, icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
              ] as { label: string; icon: React.ReactNode }[]).map(item => (
                <button key={item.label}
                  className="w-full group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-left transition-all duration-300 overflow-hidden"
                  style={{ background: "rgba(55,114,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.50)", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(55,114,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)" }}>{item.icon}</div>
                  <span>{item.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 pointer-events-none" />
                </button>
              ))}
            </div>
            <button
              onClick={() => router.back()}
              className="group relative w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl text-white font-semibold text-[13px] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)", border: "1px solid rgba(220,38,38,0.30)", cursor: "pointer", boxShadow: "0 4px 14px rgba(185,28,28,0.25)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)"; }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="group-hover:rotate-12 transition-transform duration-300"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {L.back}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700 pointer-events-none" />
            </button>
          </div>
          </div>
        </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ background: "#FAFCFF" }}>

        {/* Topbar */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center justify-between flex-shrink-0 px-5 py-2.5"
          style={{ background: "rgba(250,252,255,0.96)", borderBottom: "1px solid rgba(15,23,42,0.08)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-2">
            {/* Hamburger (mobile always) / expand chevron (desktop, sidebar closed) */}
            {(!sidebarOpen || isMobile) && (
              <button
                onClick={() => setSidebarOpen(v => !v)}
                style={iconBtnLight}
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-1 transition-colors hover:bg-black/[0.05]"
              >
                {isMobile
                  ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                  : <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                }
              </button>
            )}

            {/* Model pill */}
            <button
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all hover:bg-black/[0.04]"
              style={{ background: "transparent", border: "1px solid rgba(15,23,42,0.10)", color: "rgba(15,23,42,0.55)", cursor: "pointer" }}
            >
              <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] rounded flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${brand.primary || "#4F7FFF"} 0%, #6AA2FF 100%)` }}>
                <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <span className="hidden xs:inline">{botName}</span>
              <span className="xs:hidden">{botName.split(".")[0]}</span>
              <span className="hidden sm:inline"> 1.0</span>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share */}
            <button
              style={iconBtnLight}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/[0.05]"
              aria-label="Поделиться"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>

            {/* More */}
            <button
              style={iconBtnLight}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-black/[0.05]"
              aria-label="Ещё"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)`, boxShadow: `0 0 0 2px rgba(79,127,255,0.25)` }}
            >
              {userInitial}
            </div>
          </div>
        </motion.div>

        {/* Empty state or chat */}
        <AnimatePresence mode="wait" initial={false}>
        {chatStarted ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="flex-1 min-h-0 overflow-hidden flex flex-col"
          >
            <AISymptomsChecker
              key={chatKey}
              clinic={clinic}
              embedded
              initialInput={initialMsg}
              initialImageUrl={initialImage ?? undefined}
              autoSend={!!initialMsg || !!initialImage}
              initialMessages={loadedMessages.length > 0 ? loadedMessages : undefined}
              onMessagesChange={handleMessagesChange}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="flex-1 overflow-y-auto flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 pt-6 pb-8 relative"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full" style={{ background: "radial-gradient(circle at center, rgba(79,127,255,.06) 0%, transparent 65%)" }} />
            <div className="w-full max-w-[620px] flex flex-col items-center relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
                className="text-[22px] sm:text-[30px] font-bold text-center mb-1.5 sm:mb-2"
                style={{ color: "#0F172A", letterSpacing: "-0.5px" }}
              >
                {user ? `${L.greeting}, ${user.first_name}!` : L.greetingGuest}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
                className="text-[13px] sm:text-[14px] text-center mb-5 sm:mb-7 px-2"
                style={{ color: "rgba(15,23,42,0.45)", lineHeight: 1.6 }}
              >
                {L.greetingSub}
              </motion.p>

              {/* Big input */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18, ease: "easeOut" }}
                className="w-full mb-4 sm:mb-5 rounded-[18px] sm:rounded-[20px] overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 4px 32px rgba(79,127,255,0.09)" }}
              >
                <textarea
                  rows={2}
                  value={emptyInput}
                  onChange={e => setEmptyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (emptyInput.trim() || emptyImagePreview) startChat(emptyInput.trim(), emptyImagePreview ?? undefined); } }}
                  placeholder={L.inputPlaceholder}
                  className="w-full block bg-transparent border-none outline-none resize-none px-4 sm:px-5 pt-4 sm:pt-5 pb-2 text-[14px] leading-relaxed placeholder-slate-400"
                  style={{ color: "#0F172A", minHeight: 60 }}
                />
                {emptyImagePreview && (
                  <div className="px-4 pt-2 relative inline-block">
                    <img src={emptyImagePreview} alt="preview" className="h-14 w-14 object-cover rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.12)" }} />
                    <button
                      onClick={() => { setEmptyImagePreview(null); if (emptyFileInputRef.current) emptyFileInputRef.current.value = ""; }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] leading-none"
                      style={{ border: "none", cursor: "pointer" }}
                    >✕</button>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 sm:px-4 py-2" style={{ borderTop: "1px solid rgba(15,23,42,0.07)" }}>
                  <input
                    ref={emptyFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { alert("Файл слишком большой. Максимум 5MB"); return; }
                      const reader = new FileReader();
                      reader.onloadend = () => setEmptyImagePreview(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    onClick={() => emptyFileInputRef.current?.click()}
                    style={{ background: emptyImagePreview ? `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)` : "transparent", border: "none", color: emptyImagePreview ? "white" : "rgba(15,23,42,0.38)", cursor: "pointer" }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <button style={{ background: "transparent", border: "none", color: "rgba(15,23,42,0.38)", cursor: "pointer" }} className="w-8 h-8 rounded-xl flex items-center justify-center">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                    <button
                      onClick={() => { if (emptyInput.trim() || emptyImagePreview) startChat(emptyInput.trim(), emptyImagePreview ?? undefined); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                      style={(emptyInput.trim() || emptyImagePreview) ? { background: `linear-gradient(135deg, ${brand.secondary || "#001E80"} 0%, ${brand.primary || "#4F7FFF"} 100%)`, boxShadow: "0 4px 16px rgba(63,87,255,.35)", border: "none", cursor: "pointer" } : { background: "rgba(15,23,42,0.07)", border: "none", cursor: "not-allowed", opacity: 0.45 }}
                    >
                      <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Cards — horizontal rows on mobile, 3-col grid on desktop */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-2.5 w-full mb-4 sm:mb-5">
                {([
                  {
                    icon: <svg width="18" height="18" fill="none" stroke="#4F7FFF" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M9 3h6"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/></svg>,
                    title: L.card1, desc: L.card1d
                  },
                  {
                    icon: <svg width="18" height="18" fill="none" stroke="#4F7FFF" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
                    title: L.card2, desc: L.card2d
                  },
                  {
                    icon: <svg width="18" height="18" fill="none" stroke="#4F7FFF" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 3h6l1 2H8L9 3z"/><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 9v6M9 12h6"/></svg>,
                    title: L.card3, desc: L.card3d
                  },
                ]).map((card, i) => (
                  <motion.button
                    key={card.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.22 + i * 0.07, ease: "easeOut" }}
                    onClick={() => startChat(card.title)}
                    className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5 px-3.5 py-3 sm:p-4 rounded-2xl sm:rounded-[18px] text-left transition-all"
                    style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.09)", cursor: "pointer", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,127,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,127,255,0.22)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(15,23,42,0.09)"; }}
                  >
                    <div className="w-9 h-9 flex-shrink-0 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(79,127,255,0.10)", border: "1px solid rgba(79,127,255,0.18)" }}>{card.icon}</div>
                    <div className="flex-1 sm:flex-none min-w-0">
                      <div className="text-[13px] font-semibold leading-snug" style={{ color: "#0F172A" }}>{card.title}</div>
                      <div className="text-[11px] leading-snug mt-0.5 sm:mt-1 line-clamp-2" style={{ color: "rgba(15,23,42,0.50)" }}>{card.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.45 }}
                className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
              >
                {L.chips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => startChat(chip)}
                    className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-[12px]"
                    style={{ background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.09)", color: "rgba(15,23,42,0.55)", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,127,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,127,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.color = "#0F172A"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(15,23,42,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(15,23,42,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(15,23,42,0.55)"; }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4F7FFF" }} />
                    {chip}
                  </button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
