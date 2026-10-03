"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Loader2, Plus, Search, MessageCircle, ListChecks, Trash2,
  Pencil, Check, X, ChevronLeft, ChevronRight, ChevronDown, Sparkles,
} from "lucide-react";

import type { PathOfPatient, PathOfPatientStage } from "./types";
import { SOURCE_LABELS, STAGE_COLOR_PRESETS, formatMoney, waLink } from "./types";
import { PathOfPatientFormModal } from "./PathOfPatientFormModal";
import { TaskFormModal } from "../tasks/modals/TaskFormModal";

/**
 * "Путь пациента" — basic v1 Kanban board (see backend PathOfPatient/
 * PathOfPatientStage's own docstrings for why it's deliberately simple).
 * Stages are per-clinic and customizable, but the 6-stage starter funnel
 * (`is_default`) is permanent — can be renamed/recolored but never deleted
 * or reordered — with 2 of them wired to real system events: AI-agent
 * leads (path_of_patient.services.capture_ai_agent_lead) and real bookings
 * (sync_patient_path_card) land in their own dedicated stage instead of
 * generic intake, as long as that stage keeps its default label. A clinic
 * can still add its own extra stages on top, which behave exactly like the
 * original fully-custom stages always have.
 *
 * No drag-and-drop yet (no dnd library in this project) — moving a card
 * between stages is a dropdown on the card, reordering stages is a pair of
 * arrow buttons; good enough for a first pass, a real drag-and-drop board
 * is exactly the kind of "make it better later" the product owner flagged.
 */
export function PathOfPatientView({ user }: { user: any }) {
  const [deals, setDeals] = useState<PathOfPatient[]>([]);
  const [stages, setStages] = useState<PathOfPatientStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [taskModalDeal, setTaskModalDeal] = useState<PathOfPatient | null>(null);

  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [stageBusyId, setStageBusyId] = useState<number | null>(null);
  const [addingStage, setAddingStage] = useState(false);
  const [newStageLabel, setNewStageLabel] = useState("");
  const [addingStageBusy, setAddingStageBusy] = useState(false);
  const addStagePopoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addingStage) return;
    const handler = (e: MouseEvent) => {
      if (addStagePopoverRef.current && !addStagePopoverRef.current.contains(e.target as Node)) {
        setAddingStage(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addingStage]);

  // Only one card's stage-picker can be open at a time. The panel itself is
  // portaled to document.body (see render below) so it can escape the
  // card column's overflow-y-auto — anchored inside it, an absolutely
  // positioned panel got silently clipped the moment it needed to extend
  // past the column's own scroll bounds. Position is computed from the
  // trigger button's real screen position, same convention as
  // schedule/components/SearchSelect.tsx.
  const [stageMenuDealId, setStageMenuDealId] = useState<number | null>(null);
  const [stageMenuPos, setStageMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const stageMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const stageMenuPanelRef = useRef<HTMLDivElement>(null);

  const updateStageMenuPosition = useCallback(() => {
    const trigger = stageMenuTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setStageMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useLayoutEffect(() => {
    if (stageMenuDealId === null) return;
    updateStageMenuPosition();
    const handleScroll = () => updateStageMenuPosition();
    const handleResize = () => updateStageMenuPosition();
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [stageMenuDealId, updateStageMenuPosition]);

  useEffect(() => {
    if (stageMenuDealId === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        stageMenuTriggerRef.current && !stageMenuTriggerRef.current.contains(target) &&
        stageMenuPanelRef.current && !stageMenuPanelRef.current.contains(target)
      ) {
        setStageMenuDealId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stageMenuDealId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dealsRes, stagesRes] = await Promise.all([api.get("/path-of-patient/"), api.get("/path-of-patient-stages/")]);
      setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : (dealsRes.data?.results ?? []));
      const stageList: PathOfPatientStage[] = Array.isArray(stagesRes.data) ? stagesRes.data : (stagesRes.data?.results ?? []);
      setStages([...stageList].sort((a, b) => a.order - b.order));
    } catch {
      toast.error("Не удалось загрузить путь пациента");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      if (scope === "mine" && user?.id && d.assigned_to_user_id !== user.id) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.phone.includes(q);
    });
  }, [deals, search, scope, user?.id]);

  const byStage = useMemo(() => {
    const map: Record<number, PathOfPatient[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of filtered) { if (map[d.stage]) map[d.stage].push(d); }
    return map;
  }, [filtered, stages]);

  const moveStage = async (deal: PathOfPatient, stageId: number) => {
    setBusyId(deal.id);
    try {
      const { data } = await api.patch(`/path-of-patient/${deal.id}/`, { stage: stageId });
      setDeals(prev => prev.map(d => (d.id === deal.id ? data : d)));
      setStages(prev => prev.map(s => {
        if (s.id === deal.stage) return { ...s, deals_count: Math.max(0, s.deals_count - 1) };
        if (s.id === stageId) return { ...s, deals_count: s.deals_count + 1 };
        return s;
      }));
    } catch {
      toast.error("Не удалось перенести карточку");
    } finally {
      setBusyId(null);
    }
  };

  const deleteDeal = async (deal: PathOfPatient) => {
    if (!window.confirm(`Удалить карточку «${deal.name}»?`)) return;
    setBusyId(deal.id);
    try {
      await api.delete(`/path-of-patient/${deal.id}/`);
      setDeals(prev => prev.filter(d => d.id !== deal.id));
      setStages(prev => prev.map(s => (s.id === deal.stage ? { ...s, deals_count: Math.max(0, s.deals_count - 1) } : s)));
    } catch {
      toast.error("Не удалось удалить карточку");
    } finally {
      setBusyId(null);
    }
  };

  const handleTaskSaved = (task: any) => {
    setTaskModalDeal(null);
    if (task.path_of_patient) {
      setDeals(prev => prev.map(d => (d.id === task.path_of_patient ? { ...d, tasks_total: d.tasks_total + 1 } : d)));
    }
  };

  // ── Stage management ──────────────────────────────────────────────
  const startEditStage = (stage: PathOfPatientStage) => { setEditingStageId(stage.id); setEditLabel(stage.label); };

  const saveStageLabel = async (stage: PathOfPatientStage) => {
    const label = editLabel.trim();
    if (!label) { setEditingStageId(null); return; }
    if (label === stage.label) { setEditingStageId(null); return; }
    setStageBusyId(stage.id);
    try {
      const { data } = await api.patch(`/path-of-patient-stages/${stage.id}/`, { label });
      setStages(prev => prev.map(s => (s.id === stage.id ? { ...s, ...data } : s)));
      setDeals(prev => prev.map(d => (d.stage === stage.id ? { ...d, stage_label: data.label } : d)));
    } catch {
      toast.error("Не удалось переименовать этап");
    } finally {
      setStageBusyId(null);
      setEditingStageId(null);
    }
  };

  const changeStageColor = async (stage: PathOfPatientStage, color: string) => {
    setStageBusyId(stage.id);
    try {
      const { data } = await api.patch(`/path-of-patient-stages/${stage.id}/`, { color });
      setStages(prev => prev.map(s => (s.id === stage.id ? { ...s, ...data } : s)));
      setDeals(prev => prev.map(d => (d.stage === stage.id ? { ...d, stage_color: data.color } : d)));
    } catch {
      toast.error("Не удалось изменить цвет");
    } finally {
      setStageBusyId(null);
    }
  };

  const deleteStage = async (stage: PathOfPatientStage) => {
    if (stage.is_default) {
      toast.error("Нельзя удалить базовый этап — переименуйте его вместо этого");
      return;
    }
    if (stage.deals_count > 0) {
      toast.error("Сначала перенесите карточки из этого этапа в другой");
      return;
    }
    if (!window.confirm(`Удалить этап «${stage.label}»?`)) return;
    setStageBusyId(stage.id);
    try {
      await api.delete(`/path-of-patient-stages/${stage.id}/`);
      setStages(prev => prev.filter(s => s.id !== stage.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось удалить этап");
    } finally {
      setStageBusyId(null);
    }
  };

  const moveStageOrder = async (stage: PathOfPatientStage, direction: -1 | 1) => {
    const idx = stages.findIndex(s => s.id === stage.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= stages.length) return;
    const other = stages[swapIdx];
    setStageBusyId(stage.id);
    try {
      await Promise.all([
        api.patch(`/path-of-patient-stages/${stage.id}/`, { order: other.order }),
        api.patch(`/path-of-patient-stages/${other.id}/`, { order: stage.order }),
      ]);
      setStages(prev => prev
        .map(s => {
          if (s.id === stage.id) return { ...s, order: other.order };
          if (s.id === other.id) return { ...s, order: stage.order };
          return s;
        })
        .sort((a, b) => a.order - b.order));
    } catch {
      toast.error("Не удалось изменить порядок этапов");
    } finally {
      setStageBusyId(null);
    }
  };

  const addStage = async () => {
    const label = newStageLabel.trim();
    if (!label) return;
    setAddingStageBusy(true);
    try {
      const color = STAGE_COLOR_PRESETS[stages.length % STAGE_COLOR_PRESETS.length];
      const { data } = await api.post("/path-of-patient-stages/", { label, color });
      setStages(prev => [...prev, data].sort((a, b) => a.order - b.order));
      setNewStageLabel("");
      setAddingStage(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.label?.[0] || "Не удалось добавить этап");
    } finally {
      setAddingStageBusy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Путь пациента</h1>
            <p className="text-gray-600">Заявки от первого обращения до оплаты</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" }}>
            <Plus className="w-5 h-5" />
            Добавить
          </motion.button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setScope("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scope === "all" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
            Общие
          </button>
          <button onClick={() => setScope("mine")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${scope === "mine" ? "bg-blue-50 text-blue-600 border border-blue-200" : "text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
            Мои карточки
          </button>

          <div className="relative ml-auto" ref={addStagePopoverRef}>
            <button onClick={() => setAddingStage(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:text-blue-500 transition-colors">
              <Plus className="w-4 h-4" /> Добавить этап
            </button>
            {addingStage && (
              <div className="absolute z-30 top-full right-0 mt-2 w-64 rounded-2xl border-2 border-gray-200 bg-white shadow-lg p-3 space-y-2">
                <input
                  value={newStageLabel} onChange={e => setNewStageLabel(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === "Enter") addStage(); if (e.key === "Escape") setAddingStage(false); }}
                  placeholder="Название этапа..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setAddingStage(false)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 border border-gray-200">
                    Отмена
                  </button>
                  <button onClick={addStage} disabled={!newStageLabel.trim() || addingStageBusy}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50">
                    {addingStageBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Добавить"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {stages.map((stage, idx) => {
            const items = byStage[stage.id] ?? [];
            const total = items.reduce((s, d) => s + parseFloat(d.amount || "0"), 0);
            const isStageBusy = stageBusyId === stage.id;
            return (
              <div key={stage.id} className="flex-shrink-0 w-72 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col max-h-[75vh]">
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 group/header">
                  {editingStageId === stage.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveStageLabel(stage); if (e.key === "Escape") setEditingStageId(null); }}
                        className="flex-1 min-w-0 px-2 py-1 text-xs font-bold rounded-lg border border-blue-300 focus:outline-none"
                      />
                      <button onClick={() => saveStageLabel(stage)} disabled={isStageBusy} className="flex-shrink-0 text-emerald-600 hover:text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingStageId(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                        <p className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: stage.color }}>{stage.label}</p>
                        {stage.is_default && (
                          <Sparkles className="w-3 h-3 text-gray-300 flex-shrink-0" aria-label="Базовый этап — нельзя удалить или переместить" />
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => moveStageOrder(stage, -1)} disabled={idx === 0 || isStageBusy || stage.is_default} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveStageOrder(stage, 1)} disabled={idx === stages.length - 1 || isStageBusy || stage.is_default} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button onClick={() => startEditStage(stage)} className="text-gray-300 hover:text-blue-500">
                          <Pencil className="w-3 h-3" />
                        </button>
                        {!stage.is_default && (
                          <button onClick={() => deleteStage(stage)} disabled={isStageBusy} className="text-gray-300 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {editingStageId === stage.id && (
                    <div className="flex items-center gap-1 mt-2">
                      {STAGE_COLOR_PRESETS.map(c => (
                        <button key={c} onClick={() => changeStageColor(stage, c)}
                          className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                          style={{ background: c, borderColor: c === stage.color ? "#1e263e" : "transparent" }} />
                      ))}
                    </div>
                  )}

                  <p className="text-lg font-bold text-gray-800 mt-1.5">{formatMoney(total)}</p>
                  <p className="text-xs text-gray-400">{items.length} {items.length === 1 ? "карточка" : "карточек"}</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-2.5 space-y-2.5 bg-gray-50/60 rounded-b-2xl">
                  {items.length === 0 ? (
                    <p className="text-center py-6 text-xs text-gray-300">Пусто</p>
                  ) : (
                    items.map(deal => {
                      const busy = busyId === deal.id;
                      return (
                        <div key={deal.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{deal.name}</p>
                              <p className="text-[11px] text-gray-400">{SOURCE_LABELS[deal.source]}</p>
                            </div>
                            <button onClick={() => deleteDeal(deal)} disabled={busy}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-base font-bold text-gray-900 mt-1.5">{formatMoney(deal.amount)}</p>

                          {deal.phone && (
                            <a href={waLink(deal.phone)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 mt-1 transition-colors">
                              {deal.phone}
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </a>
                          )}

                          <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1.5">
                            <ListChecks className="w-3 h-3" />
                            {deal.tasks_completed}/{deal.tasks_total} заданий
                          </p>

                          <button onClick={() => setTaskModalDeal(deal)} disabled={busy}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-2.5 rounded-lg text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 transition-colors">
                            <ListChecks className="w-3.5 h-3.5" /> Создать задачу
                          </button>

                          <div className="mt-2.5 pt-2 border-t border-gray-50">
                            {(() => {
                              const currentStage = stages.find(s => s.id === deal.stage);
                              const open = stageMenuDealId === deal.id;
                              return (
                                <>
                                  <button
                                    type="button"
                                    ref={open ? stageMenuTriggerRef : undefined}
                                    onClick={() => setStageMenuDealId(open ? null : deal.id)}
                                    disabled={busy}
                                    className="w-full flex items-center justify-between gap-1 px-1.5 py-1 -mx-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                  >
                                    <span className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: currentStage?.color }} />
                                      <span className="text-[11px] font-semibold truncate" style={{ color: currentStage?.color }}>
                                        {currentStage?.label || "—"}
                                      </span>
                                    </span>
                                    <ChevronDown className={`w-3 h-3 text-gray-300 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                                  </button>
                                  {open && stageMenuPos && typeof document !== "undefined" && createPortal(
                                    <AnimatePresence>
                                      <motion.div
                                        ref={stageMenuPanelRef}
                                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.12 }}
                                        className="fixed z-[9999] bg-white rounded-xl shadow-lg border border-gray-100 py-1 max-h-56 overflow-y-auto"
                                        style={{ top: stageMenuPos.top, left: stageMenuPos.left, width: stageMenuPos.width }}
                                      >
                                        {stages.map(s => (
                                          <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => { setStageMenuDealId(null); if (s.id !== deal.stage) moveStage(deal, s.id); }}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left hover:bg-gray-50 transition-colors ${s.id === deal.stage ? "bg-gray-50" : ""}`}
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                            <span className="truncate font-medium" style={{ color: s.color }}>{s.label}</span>
                                            {s.id === deal.stage && <Check className="w-3 h-3 ml-auto text-emerald-500 flex-shrink-0" />}
                                          </button>
                                        ))}
                                      </motion.div>
                                    </AnimatePresence>,
                                    document.body
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] text-gray-400">{deal.assigned_to_name || "Не назначено"}</span>
                            <span className="text-[11px] text-gray-300">
                              {new Date(deal.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <PathOfPatientFormModal onClose={() => setShowCreate(false)} onSaved={(deal) => {
          setDeals(prev => [deal, ...prev]);
          setStages(prev => prev.map(s => (s.id === deal.stage ? { ...s, deals_count: s.deals_count + 1 } : s)));
          setShowCreate(false);
        }} />
      )}

      {taskModalDeal && (
        <TaskFormModal mode="create" initial={null} pathOfPatientId={taskModalDeal.id}
          onClose={() => setTaskModalDeal(null)} onSaved={handleTaskSaved} />
      )}
    </div>
  );
}

export default PathOfPatientView;
