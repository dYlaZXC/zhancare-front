"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, Plus, Search, MessageCircle, ListChecks, CalendarPlus, Trash2 } from "lucide-react";

import type { Deal, DealStage } from "./types";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, SOURCE_LABELS, formatMoney, waLink } from "./types";
import { DealFormModal } from "./DealFormModal";
import { TaskFormModal } from "../tasks/modals/TaskFormModal";

/**
 * "Сделки" — basic v1 Kanban board (see backend Deal model's own docstring
 * for why it's deliberately simple). No drag-and-drop yet (no dnd library
 * in this project) — moving a deal between stages is a plain dropdown on
 * the card, good enough for a first pass; a real drag-and-drop board is
 * exactly the kind of "make it better later" the product owner flagged.
 */
export function DealsView({ user }: { user: any }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [taskModalDeal, setTaskModalDeal] = useState<Deal | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/deals/");
      setDeals(Array.isArray(data) ? data : (data?.results ?? []));
    } catch {
      toast.error("Не удалось загрузить сделки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      if (scope === "mine" && user?.id && d.assigned_to_user_id !== user.id) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.phone.includes(q);
    });
  }, [deals, search, scope, user?.id]);

  const byStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = { unsorted: [], booked: [], confirmed: [], arrived: [], paid: [] };
    for (const d of filtered) map[d.stage]?.push(d);
    return map;
  }, [filtered]);

  const moveStage = async (deal: Deal, stage: DealStage) => {
    setBusyId(deal.id);
    try {
      const { data } = await api.patch(`/deals/${deal.id}/`, { stage });
      setDeals(prev => prev.map(d => (d.id === deal.id ? data : d)));
    } catch {
      toast.error("Не удалось перенести сделку");
    } finally {
      setBusyId(null);
    }
  };

  const deleteDeal = async (deal: Deal) => {
    if (!window.confirm(`Удалить сделку «${deal.name}»?`)) return;
    setBusyId(deal.id);
    try {
      await api.delete(`/deals/${deal.id}/`);
      setDeals(prev => prev.filter(d => d.id !== deal.id));
    } catch {
      toast.error("Не удалось удалить сделку");
    } finally {
      setBusyId(null);
    }
  };

  const handleTaskSaved = (task: any) => {
    setTaskModalDeal(null);
    if (task.deal) {
      setDeals(prev => prev.map(d => (d.id === task.deal ? { ...d, tasks_total: d.tasks_total + 1 } : d)));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>Сделки</h1>
            <p className="text-gray-600">Управление заявками и сделками</p>
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
            Мои сделки
          </button>
          <div className="relative flex-1 min-w-[220px] max-w-xs ml-auto">
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_ORDER.map(stage => {
            const items = byStage[stage];
            const total = items.reduce((s, d) => s + parseFloat(d.amount || "0"), 0);
            const colors = STAGE_COLORS[stage];
            return (
              <div key={stage} className="flex-shrink-0 w-72 rounded-2xl border border-gray-100 bg-gray-50/60 flex flex-col max-h-[75vh]">
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text }}>{STAGE_LABELS[stage]}</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{formatMoney(total)}</p>
                  <p className="text-xs text-gray-400">{items.length} {items.length === 1 ? "сделка" : "сделок"}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
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

                          <div className="space-y-1.5 mt-2.5">
                            {stage !== "booked" && (
                              <button onClick={() => moveStage(deal, "booked")} disabled={busy}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors">
                                <CalendarPlus className="w-3.5 h-3.5" /> Назначить приём
                              </button>
                            )}
                            <button onClick={() => setTaskModalDeal(deal)} disabled={busy}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-50 transition-colors">
                              <ListChecks className="w-3.5 h-3.5" /> Создать задачу
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50">
                            <select value={deal.stage} onChange={e => moveStage(deal, e.target.value as DealStage)} disabled={busy}
                              className="text-[11px] text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer disabled:opacity-50">
                              {STAGE_ORDER.map(s => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                              ))}
                            </select>
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
        <DealFormModal onClose={() => setShowCreate(false)} onSaved={(deal) => { setDeals(prev => [deal, ...prev]); setShowCreate(false); }} />
      )}

      {taskModalDeal && (
        <TaskFormModal mode="create" initial={null} dealId={taskModalDeal.id}
          onClose={() => setTaskModalDeal(null)} onSaved={handleTaskSaved} />
      )}
    </div>
  );
}

export default DealsView;
