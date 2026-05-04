"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Bot,
  Save,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Tag,
  MessageSquare,
  Brain,
  Palette,
  Sparkles,
  Send,
  Copy,
  Check,
  ChevronLeft,
  Camera,
  Trash2,
  Building2,
  Search,
  Settings2,
  CircleCheck,
  CircleX,
  Link,
  Plus as PlusIcon,
  GripVertical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://127.0.0.1:8000";
const resolveUrl = (url: string) => (url.startsWith("http") ? url : `${BACKEND}${url}`);

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

interface QuickLink {
  label: string;
  message: string;
}

interface AIAgent {
  id: number;
  clinic_id: number;
  slug: string;
  agent_name: string;
  welcome_message: string;
  system_prompt_extra: string;
  quick_links: QuickLink[];
  primary_color: string;
  logo_url: string;
  is_active: boolean;
  public_url: string;
  created_at: string;
  updated_at: string;
}

type FormState = Omit<AIAgent, "id" | "clinic_id" | "public_url" | "created_at" | "updated_at">;

const defaultForm: FormState = {
  slug: "",
  agent_name: "AI Ассистент",
  welcome_message: "",
  system_prompt_extra: "",
  quick_links: [],
  primary_color: "#8b5cf6",
  logo_url: "",
  is_active: true,
};

const PRESET_COLORS = [
  "#8b5cf6", "#3772ff", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#0ea5e9", "#6366f1",
];

/* ── Small helpers ─────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
      {children}
    </span>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  icon: Icon,
  monospace,
  hint,
  hintHref,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  monospace?: boolean;
  hint?: string;
  hintHref?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-purple-500 transition-colors pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all duration-200 hover:border-gray-300 ${monospace ? "font-mono" : ""}`}
        />
      </div>
      {hint && (
        hintHref ? (
          <a
            href={hintHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-700 hover:underline pl-1 transition-colors w-fit"
          >
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            {hint}
          </a>
        ) : (
          <p className="text-[11px] text-gray-400 pl-1">{hint}</p>
        )
      )}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  monospace,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  monospace?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all duration-200 hover:border-gray-300 resize-none leading-relaxed ${monospace ? "font-mono text-xs" : ""}`}
      />
      {hint && <p className="text-[11px] text-gray-400 pl-1">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: color + "15" }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ── Live preview ──────────────────────────────────────── */

function ChatPreview({ form }: { form: FormState }) {
  const color = form.primary_color || "#8b5cf6";
  const name = form.agent_name || "AI Ассистент";
  const welcome =
    form.welcome_message ||
    "Здравствуйте! Я ваш персональный AI ассистент. Расскажите о ваших симптомах, и я постараюсь помочь.";

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-100" style={{ minHeight: 340 }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: color }}>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          {form.logo_url ? (
            <img
              src={form.logo_url}
              alt=""
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style");
              }}
            />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none truncate">{name}</p>
          <p className="text-white/70 text-[10px] mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
            Онлайн
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-white/50 flex-shrink-0" />
      </div>

      {/* Messages */}
      <div className="flex-1 bg-gray-50 px-4 py-4 space-y-3">
        {/* AI bubble */}
        <div className="flex gap-2.5 items-end">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: color }}
          >
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div
            className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm text-gray-700 leading-relaxed shadow-sm"
            style={{ background: "#fff", border: "1px solid #f0f0f0" }}
          >
            {welcome.length > 120 ? welcome.slice(0, 120) + "…" : welcome}
          </div>
        </div>

        {/* User bubble */}
        <div className="flex justify-end">
          <div
            className="max-w-[70%] px-3.5 py-2.5 rounded-2xl rounded-br-sm text-sm text-white leading-relaxed shadow-sm"
            style={{ background: color }}
          >
            У меня болит голова и температура 38°
          </div>
        </div>

        {/* Typing indicator */}
        <div className="flex gap-2.5 items-end">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: color }}
          >
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: color, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-400">
          Напишите симптомы…
        </div>
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ background: color }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

/* ── Super admin list types ────────────────────────────── */

interface ClinicRow {
  clinic_id: number;
  clinic_name: string;
  clinic_logo: string | null;
  agent: AIAgent | null;
}

/* ── Super admin list view ─────────────────────────────── */

function SuperAdminAgentsView({
  onSelectClinic,
}: {
  onSelectClinic: (clinicId: number, clinicName: string, clinicLogo: string | null) => void;
}) {
  const [rows, setRows] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API}/clinic-ai-agents/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setRows(await res.json());
        else toast.error("Ошибка загрузки агентов");
      } catch {
        toast.error("Не удалось подключиться к серверу");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) =>
    r.clinic_name.toLowerCase().includes(search.toLowerCase())
  );

  const configured = rows.filter((r) => r.agent).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">AI Агенты</h1>
            <p className="text-sm text-gray-400">
              {configured} из {rows.length} клиник настроено
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клинике…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Всего клиник</p>
          <p className="text-2xl font-black text-gray-800">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Настроено</p>
          <p className="text-2xl font-black text-emerald-600">{configured}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Активных</p>
          <p className="text-2xl font-black text-purple-600">
            {rows.filter((r) => r.agent?.is_active).length}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Ничего не найдено</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((row, i) => (
              <motion.div
                key={row.clinic_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
              >
                {/* Clinic logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {row.clinic_logo ? (
                    <img src={row.clinic_logo} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Clinic name + agent info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{row.clinic_name}</p>
                  {row.agent ? (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 truncate">
                        {row.agent.agent_name}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs font-mono text-gray-400 truncate">
                        /{row.agent.slug}/
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 mt-0.5">Агент не настроен</p>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0 hidden sm:block">
                  {row.agent ? (
                    row.agent.is_active ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100">
                        <CircleCheck className="w-3 h-3" /> Активен
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100">
                        <CircleX className="w-3 h-3" /> Отключён
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100">
                      Не настроен
                    </span>
                  )}
                </div>

                {/* Color dot */}
                {row.agent?.primary_color && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm hidden sm:block"
                    style={{ background: row.agent.primary_color }}
                  />
                )}

                {/* Configure button */}
                <button
                  onClick={() => onSelectClinic(row.clinic_id, row.clinic_name, row.clinic_logo)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0"
                  style={{
                    background: row.agent
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                  }}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {row.agent ? "Настроить" : "Создать"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Quick Links section ────────────────────────────────── */

function QuickLinksSection({
  links,
  baseUrl,
  onChange,
}: {
  links: QuickLink[];
  baseUrl: string | null;
  onChange: (links: QuickLink[]) => void;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const addLink = () =>
    onChange([...links, { label: "", message: "" }]);

  const updateLink = (idx: number, field: keyof QuickLink, value: string) => {
    const next = links.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    onChange(next);
  };

  const removeLink = (idx: number) =>
    onChange(links.filter((_, i) => i !== idx));

  const copyLink = (idx: number, message: string) => {
    if (!baseUrl || !message) return;
    const url = window.location.origin + baseUrl + "?q=" + encodeURIComponent(message);
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#10b98115" }}>
            <Link className="w-4 h-4" style={{ color: "#10b981" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Быстрые ссылки</p>
            <p className="text-xs text-gray-400">Ссылки с авто-сообщением — пациент открывает и ИИ сразу отвечает</p>
          </div>
        </div>
        <button
          onClick={addLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Добавить
        </button>
      </div>

      {/* Links list */}
      <div className="px-6 py-5 space-y-3">
        {links.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Link className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Нет быстрых ссылок</p>
            <p className="text-xs text-gray-300 max-w-xs">
              Добавьте ссылку — пациент переходит по ней и ИИ сразу получает ваш вопрос
            </p>
            <button
              onClick={addLink}
              className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Создать первую ссылку
            </button>
          </div>
        ) : (
          links.map((link, idx) => {
            const linkUrl = baseUrl && link.message
              ? window.location.origin + baseUrl + "?q=" + encodeURIComponent(link.message)
              : null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="group flex gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <GripVertical className="w-4 h-4 text-gray-200 mt-2.5 flex-shrink-0 cursor-grab" />

                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Label */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Название ссылки</span>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => updateLink(idx, "label", e.target.value)}
                      placeholder="Например: О специалистах"
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/8 transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Авто-сообщение</span>
                    <textarea
                      rows={2}
                      value={link.message}
                      onChange={(e) => updateLink(idx, "message", e.target.value)}
                      placeholder="Расскажи о врачах и специалистах клиники"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/8 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Generated URL */}
                  {linkUrl && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 space-y-2">
                      <p className="font-mono text-[10px] text-emerald-700 break-all leading-relaxed">{linkUrl}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyLink(idx, link.message)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 transition-all"
                        >
                          {copiedIdx === idx ? (
                            <><Check className="w-3 h-3 text-emerald-600" /> Скопировано</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Копировать</>
                          )}
                        </button>
                        <a
                          href={baseUrl + "?q=" + encodeURIComponent(link.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> Открыть
                        </a>
                      </div>
                    </div>
                  )}
                  {link.message && !baseUrl && (
                    <p className="text-[10px] text-amber-500">Сначала задайте URL Slug агента</p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeLink(idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export default function AIAgentsView() {
  const { user } = useAuth();
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  // super admin: null = show list, number = show form for that clinic
  const [superAdminClinicId, setSuperAdminClinicId] = useState<string>("");
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  // super admin drill-down
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [selectedClinicName, setSelectedClinicName] = useState<string>("");
  const [selectedClinicLogo, setSelectedClinicLogo] = useState<string | null>(null);
  // authoritative super admin flag from clinic-stats (same source as AdminProfileDashboard)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  const applyAgent = (data: AIAgent) => {
    setAgent(data);
    setIsNew(false);
    setClinicId(data.clinic_id);
    setForm({
      slug: data.slug,
      agent_name: data.agent_name,
      welcome_message: data.welcome_message,
      system_prompt_extra: data.system_prompt_extra,
      quick_links: data.quick_links ?? [],
      primary_color: data.primary_color,
      logo_url: data.logo_url,
      is_active: data.is_active,
    });
  };

  const fetchAgent = useCallback(async (clinicId?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const url = clinicId
        ? `${API}/clinic-ai-agent/?clinic_id=${clinicId}`
        : `${API}/clinic-ai-agent/`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        setAgent(null);
        setIsNew(true);
        setForm(defaultForm);
      } else if (res.ok) {
        applyAgent(await res.json());
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Ошибка загрузки агента");
      }
    } catch {
      toast.error("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // Fetch role + clinic_id + existing logo — always called on mount
  const fetchClinicStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/clinic-stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Authoritative role detection — same field used in AdminProfileDashboard
        setIsSuperAdmin(data.is_super_admin ?? false);
        if (data.clinic_info?.id) {
          setClinicId(data.clinic_info.id);
        }
        if (data.clinic_info?.logo) {
          const logoUrl = resolveUrl(data.clinic_info.logo);
          // Only fill in if the agent has no logo configured yet
          setForm((prev) => ({ ...prev, logo_url: prev.logo_url || logoUrl }));
        }
      } else {
        setIsSuperAdmin(false);
      }
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  // Step 1: always determine role on mount
  useEffect(() => {
    fetchClinicStats();
  }, []); // eslint-disable-line

  // Step 2: once role is known, fetch agent (clinic admin only); super admin sees list
  useEffect(() => {
    if (isSuperAdmin === false) {
      fetchAgent();
    } else if (isSuperAdmin === true) {
      setLoading(false);
    }
  }, [isSuperAdmin]); // eslint-disable-line

  // When super admin drills into a clinic, load that clinic's agent
  useEffect(() => {
    if (isSuperAdmin && selectedClinicId) {
      setSuperAdminClinicId(String(selectedClinicId));
      setClinicId(selectedClinicId);
      fetchAgent(String(selectedClinicId));
    }
  }, [isSuperAdmin, selectedClinicId]); // eslint-disable-line

  // Pre-populate logo from clinic row whenever form has no logo (new agent OR agent with empty logo_url)
  useEffect(() => {
    if (selectedClinicLogo) {
      setForm((prev) => ({ ...prev, logo_url: prev.logo_url || selectedClinicLogo }));
    }
  }, [agent, selectedClinicLogo]); // fires after fetchAgent resolves (agent changes)

  // Logo upload → clinic-logo endpoint (same as profile page)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5 МБ.");
      return;
    }
    const uploadId = isSuperAdmin ? parseInt(superAdminClinicId) : clinicId;
    if (!uploadId) { toast.error("Сначала сохраните агента или укажите ID клиники"); return; }

    setUploadingLogo(true);
    // Show instant local preview
    f("logo_url", URL.createObjectURL(file));
    try {
      const token = localStorage.getItem("access_token");
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`${API}/clinic-logo/${uploadId}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        f("logo_url", data.logo ? resolveUrl(data.logo) : "");
        toast.success("Логотип загружен");
      } else {
        toast.error("Не удалось загрузить логотип");
        f("logo_url", "");
      }
    } catch {
      toast.error("Ошибка загрузки");
      f("logo_url", "");
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const handleLogoDelete = async () => {
    const uploadId = isSuperAdmin ? parseInt(superAdminClinicId) : clinicId;
    if (!uploadId) return;
    setUploadingLogo(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/clinic-logo/${uploadId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        f("logo_url", "");
        toast.success("Логотип удалён");
      } else {
        toast.error("Не удалось удалить логотип");
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const method = isNew ? "POST" : "PATCH";
      const baseUrl = `${API}/clinic-ai-agent/`;
      const url =
        isSuperAdmin && superAdminClinicId
          ? `${baseUrl}?clinic_id=${superAdminClinicId}`
          : baseUrl;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        applyAgent(await res.json());
        toast.success(isNew ? "AI агент создан!" : "Изменения сохранены!");
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const err = await res.json();
        const detail =
          typeof err === "object"
            ? Object.entries(err)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" | ")
            : "Ошибка сохранения";
        toast.error(detail);
      }
    } catch {
      toast.error("Не удалось подключиться к серверу");
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const agentBaseUrl = form.slug ? `/consultation/symptoms/${form.slug}/` : null;
  const agentUrl = agentBaseUrl;

  const copyUrl = () => {
    if (!agentUrl) return;
    navigator.clipboard.writeText(window.location.origin + agentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Role still loading ──────────────────────────────── */
  if (isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  /* ── Super admin: show clinic list until one is selected ─ */
  if (isSuperAdmin && !selectedClinicId) {
    return (
      <SuperAdminAgentsView
        onSelectClinic={(id, name, logo) => {
          setSelectedClinicLogo(logo);
          setSelectedClinicName(name);
          setSelectedClinicId(id);
        }}
      />
    );
  }

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)" }}
          >
            <Bot className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Back button for super admin drill-down */}
          {isSuperAdmin && selectedClinicId && (
            <button
              onClick={() => setSelectedClinicId(null)}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {isSuperAdmin && selectedClinicName
                ? selectedClinicName
                : "AI Агент клиники"}
            </h1>
            <p className="text-sm text-gray-400">
              {isSuperAdmin
                ? isNew ? "Создайте первого AI агента для этой клиники" : "Конфигурация AI агента"
                : isNew ? "Настройте и запустите вашего первого AI агента" : "Управление конфигурацией AI агента"}
            </p>
          </div>
        </div>

        {/* Status + Save */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {agent && (
            <button
              onClick={() => f("is_active", !form.is_active)}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                form.is_active
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                  : "text-gray-400 bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  form.is_active ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              {form.is_active ? "Активен" : "Отключён"}
            </button>
          )}

          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : isNew ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saved ? "Сохранено" : isNew ? "Создать" : "Сохранить"}</span>
          </motion.button>
        </div>
      </div>


      {/* ── Main two-column layout ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">

        {/* LEFT — form ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Identity */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Section title="Идентификация" subtitle="Имя агента и его публичный URL" icon={Tag} color="#8b5cf6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Имя агента</Label>
                  <Input
                    value={form.agent_name}
                    onChange={(v) => f("agent_name", v)}
                    placeholder="AI Ассистент"
                    icon={Bot}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>URL Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(v) => f("slug", v)}
                    placeholder="my-clinic"
                    icon={Tag}
                    monospace
                    hint={form.slug ? `/consultation/symptoms/${form.slug}/` : undefined}
                    hintHref={form.slug ? `/consultation/symptoms/${form.slug}/` : undefined}
                  />
                </div>
              </div>

              {/* Mobile active toggle */}
              {agent && (
                <div className="sm:hidden flex items-center justify-between pt-1">
                  <span className="text-sm text-gray-600 font-medium">Агент активен</span>
                  <button
                    onClick={() => f("is_active", !form.is_active)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_active ? "bg-emerald-500" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.is_active ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
                  </button>
                </div>
              )}
            </Section>
          </motion.div>

          {/* Personality */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section title="Персонаж" subtitle="Как агент общается с пациентами" icon={MessageSquare} color="#3772ff">
              <div className="space-y-1.5">
                <Label>Приветственное сообщение</Label>
                <Textarea
                  value={form.welcome_message}
                  onChange={(v) => f("welcome_message", v)}
                  placeholder="Здравствуйте! Я AI ассистент вашей клиники. Расскажите о ваших симптомах, и я постараюсь помочь."
                  rows={3}
                  hint="Если пусто — используется стандартное приветствие"
                />
              </div>
            </Section>
          </motion.div>

          {/* AI Instructions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Section title="Инструкции AI" subtitle="Специализация, ограничения и правила поведения" icon={Brain} color="#0ea5e9">
              <div className="space-y-1.5">
                <Label>Дополнительный промпт</Label>
                <Textarea
                  value={form.system_prompt_extra}
                  onChange={(v) => f("system_prompt_extra", v)}
                  placeholder={`Клиника специализируется на кардиологии и педиатрии.\nРекомендуй только врачей этой клиники.\nПри серьёзных симптомах настаивай на срочной консультации кардиолога.`}
                  rows={7}
                  monospace
                  hint="Добавляется к базовому системному промпту ZhanCare"
                />
              </div>
            </Section>
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
            <QuickLinksSection
              links={form.quick_links as QuickLink[]}
              baseUrl={agentBaseUrl}
              onChange={(links) => setForm((prev) => ({ ...prev, quick_links: links }))}
            />
          </motion.div>

          {/* Appearance */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section title="Внешний вид" subtitle="Цвет бренда и логотип в чате" icon={Palette} color="#f59e0b">

              <div className="space-y-1.5">
                <Label>Основной цвет</Label>
                <div className="flex items-center gap-3">
                  {/* Presets */}
                  <div className="flex gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => f("primary_color", c)}
                        className="w-7 h-7 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 flex-shrink-0"
                        style={{
                          background: c,
                          boxShadow:
                            form.primary_color === c
                              ? `0 0 0 2px white, 0 0 0 4px ${c}`
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                  {/* Color input + hex */}
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => f("primary_color", e.target.value)}
                      className="w-9 h-9 rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 bg-white"
                      title="Свой цвет"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={(e) => f("primary_color", e.target.value)}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 outline-none focus:border-purple-400 transition-all"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <Label>Логотип клиники</Label>
                <div className="flex items-center gap-4 mt-2 p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  {/* Preview */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center shadow-sm">
                      {form.logo_url ? (
                        <img
                          src={form.logo_url}
                          alt="Логотип"
                          className="w-full h-full object-contain p-1.5"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-300" />
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => logoRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Info + buttons */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 mb-0.5">Логотип клиники</p>
                    <p className="text-xs text-gray-400 mb-3">
                      JPG, PNG, WEBP — до 5 МБ. Тот же логотип что и в профиле клиники.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => logoRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-40"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {form.logo_url ? "Заменить" : "Загрузить"}
                      </button>
                      {form.logo_url && (
                        <button
                          onClick={handleLogoDelete}
                          disabled={uploadingLogo}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </Section>
          </motion.div>

          {/* Desktop active toggle (card) */}
          {agent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 hidden sm:flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Статус агента</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.is_active
                      ? "Пациенты могут открыть агента по ссылке"
                      : "Агент скрыт — ссылка недоступна для пациентов"}
                  </p>
                </div>
                <button
                  onClick={() => f("is_active", !form.is_active)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${form.is_active ? "bg-emerald-500" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.is_active ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT — sticky preview ───────────────────────── */}
        <div className="xl:sticky xl:top-6 space-y-4 self-start">

          {/* Live preview */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Предпросмотр</p>
                  <p className="text-xs text-gray-400">Живой просмотр</p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Live
                </span>
              </div>
              <div className="p-4">
                <ChatPreview form={form} />
              </div>
            </div>
          </motion.div>

          {/* URL card */}
          <AnimatePresence>
            {agentUrl && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Публичная ссылка
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={copyUrl}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Скопировано" : "Копировать"}
                    </button>
                    <a
                      href={agentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                      style={{ background: form.primary_color }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Открыть
                    </a>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 font-mono text-xs text-gray-600 break-all">
                  {agentUrl}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tip */}
          <div
            className="rounded-2xl px-5 py-4 border"
            style={{
              background: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
              borderColor: "#ede9fe",
            }}
          >
            <p className="text-xs font-bold text-purple-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Совет
            </p>
            <p className="text-[11px] text-purple-600 leading-relaxed">
              Чем точнее вы опишете специализацию клиники в поле «Инструкции AI» — тем точнее агент будет рекомендовать ваших врачей пациентам.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
