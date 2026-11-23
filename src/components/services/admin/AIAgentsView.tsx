"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  Bot, Save, Plus, ExternalLink, Loader2, CheckCircle2, ChevronLeft, Copy, Check, Sparkles,
} from "lucide-react";
import type { AIAgent, FormState } from "./ai-agents/types/aiAgentTypes";
import { API, defaultForm, resolveUrl } from "./ai-agents/types/aiAgentTypes";
import { ChatPreview } from "./ai-agents/components/ChatPreview";
import { QuickLinksSection } from "./ai-agents/components/QuickLinksSection";
import { SuperAdminAgentsView } from "./ai-agents/views/SuperAdminAgentsView";
import { IdentitySection } from "./ai-agents/sections/IdentitySection";
import { PersonalitySection } from "./ai-agents/sections/PersonalitySection";
import { AIInstructionsSection } from "./ai-agents/sections/AIInstructionsSection";
import { AppearanceSection } from "./ai-agents/sections/AppearanceSection";

/* ── Main component ────────────────────────────────────── */

export default function AIAgentsView() {
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <IdentitySection form={form} onFieldChange={f} agent={agent} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <PersonalitySection form={form} onFieldChange={f} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <AIInstructionsSection form={form} onFieldChange={f} />
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
            <QuickLinksSection
              links={form.quick_links}
              baseUrl={agentBaseUrl}
              onChange={(links) => setForm((prev) => ({ ...prev, quick_links: links }))}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AppearanceSection
              form={form}
              onFieldChange={f}
              uploadingLogo={uploadingLogo}
              logoRef={logoRef}
              onLogoUpload={handleLogoUpload}
              onLogoDelete={handleLogoDelete}
            />
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
