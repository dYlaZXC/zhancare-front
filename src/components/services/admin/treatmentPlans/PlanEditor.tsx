"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  X, Search, Plus, Loader2, Sparkles, Trash2, CheckCircle2, XCircle,
  RotateCcw, Wallet, Calendar, Stethoscope,
} from "lucide-react";
import type { TreatmentPlan, TreatmentPlanItem, PlanSuggestion, PlanItemStatus } from "./types";
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS, formatMoney } from "./types";

interface PatientOption {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

/**
 * Create-or-edit a treatment plan. A plan is created by hand (patient +
 * optional title), then filled in with items — either typed manually, or
 * accepted from real suggestions pulled from the patient's own diagnostics
 * referrals, video consultations and in-clinic appointments (see
 * TreatmentPlanViewSet.suggestions on the backend). Nothing is ever added
 * automatically; every suggestion is an explicit click.
 */
export function PlanEditor({
  initialPlan,
  onClose,
  onSaved,
}: {
  initialPlan: TreatmentPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [plan, setPlan] = useState<TreatmentPlan | null>(initialPlan);
  const [title, setTitle] = useState(initialPlan?.title ?? "");
  const [notes, setNotes] = useState(initialPlan?.notes ?? "");
  const [creating, setCreating] = useState(false);

  // Patient picker — only used before the plan exists.
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const patientBoxRef = useRef<HTMLDivElement>(null);

  // Suggestions / manual add panel.
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab] = useState<"suggestions" | "manual">("suggestions");
  const [suggestions, setSuggestions] = useState<PlanSuggestion[] | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!patientQuery.trim()) { setPatients([]); return; }
    setPatientsLoading(true);
    const t = setTimeout(() => {
      api.get("/patients/?all=true")
        .then(res => {
          const list: PatientOption[] = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
          const q = patientQuery.trim().toLowerCase();
          setPatients(list.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.phone || "").includes(q)
          ).slice(0, 20));
        })
        .catch(() => {})
        .finally(() => setPatientsLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientBoxRef.current && !patientBoxRef.current.contains(e.target as Node)) setShowPatientDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const patientId = plan?.patient ?? selectedPatient?.id ?? null;

  const loadSuggestions = useCallback(async () => {
    if (!patientId) return;
    setSuggestionsLoading(true);
    try {
      const { data } = await api.get("/treatment-plans/suggestions/", { params: { patient_id: patientId } });
      setSuggestions(data.suggestions ?? []);
    } catch {
      toast.error("Не удалось загрузить предложения");
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (showAddPanel && addTab === "suggestions" && suggestions === null) loadSuggestions();
  }, [showAddPanel, addTab, suggestions, loadSuggestions]);

  const handleCreatePlan = async () => {
    if (!selectedPatient) { toast.error("Выберите пациента"); return; }
    setCreating(true);
    try {
      const { data } = await api.post("/treatment-plans/", { patient: selectedPatient.id, title: title.trim() });
      setPlan(data);
      toast.success("План лечения создан — добавьте позиции");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.patient?.[0] || "Не удалось создать план");
    } finally {
      setCreating(false);
    }
  };

  const saveMeta = async () => {
    if (!plan) return;
    try {
      const { data } = await api.patch(`/treatment-plans/${plan.id}/`, { title: title.trim(), notes });
      setPlan(prev => (prev ? { ...prev, ...data } : data));
    } catch {
      toast.error("Не удалось сохранить изменения");
    }
  };

  const refreshPlan = async () => {
    if (!plan) return;
    const { data } = await api.get(`/treatment-plans/${plan.id}/`);
    setPlan(data);
  };

  const addManualItem = async () => {
    if (!plan) return;
    const name = manualName.trim();
    if (!name) return;
    try {
      await api.post("/treatment-plan-items/", { plan: plan.id, name, price: manualPrice || "0" });
      setManualName("");
      setManualPrice("");
      await refreshPlan();
      toast.success("Позиция добавлена");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось добавить позицию");
    }
  };

  const addSuggestion = async (s: PlanSuggestion) => {
    if (!plan) return;
    const key = `${s.source}-${s.source_id}`;
    setAddingKey(key);
    try {
      const payload: Record<string, unknown> = {
        plan: plan.id, name: s.name, price: s.price ?? "0", doctor: s.doctor,
      };
      if (s.source === "diagnostics_referral") payload.diagnostics_appointment = s.source_id;
      if (s.source === "consultation") payload.consultation = s.source_id;
      if (s.source === "clinic_appointment") payload.clinic_appointment = s.source_id;
      await api.post("/treatment-plan-items/", payload);
      setSuggestions(prev => (prev ?? []).filter(x => !(x.source === s.source && x.source_id === s.source_id)));
      await refreshPlan();
      toast.success("Позиция добавлена из истории пациента");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.source?.[0] || "Не удалось добавить позицию");
    } finally {
      setAddingKey(null);
    }
  };

  const markStatus = async (item: TreatmentPlanItem, newStatus: PlanItemStatus) => {
    setBusyItemId(item.id);
    try {
      await api.post(`/treatment-plan-items/${item.id}/mark-status/`, { status: newStatus });
      await refreshPlan();
    } catch {
      toast.error("Не удалось изменить статус");
    } finally {
      setBusyItemId(null);
    }
  };

  const recordPayment = async (item: TreatmentPlanItem) => {
    const raw = paymentDrafts[item.id];
    const amount = parseFloat(raw || "");
    if (!amount || amount <= 0) { toast.error("Укажите сумму больше нуля"); return; }
    setBusyItemId(item.id);
    try {
      await api.post(`/treatment-plan-items/${item.id}/record-payment/`, { amount });
      setPaymentDrafts(prev => ({ ...prev, [item.id]: "" }));
      await refreshPlan();
      toast.success("Оплата зафиксирована");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Не удалось зафиксировать оплату");
    } finally {
      setBusyItemId(null);
    }
  };

  const deleteItem = async (item: TreatmentPlanItem) => {
    if (!window.confirm(`Удалить позицию «${item.name}»?`)) return;
    setBusyItemId(item.id);
    try {
      await api.delete(`/treatment-plan-items/${item.id}/`);
      await refreshPlan();
    } catch {
      toast.error("Не удалось удалить позицию");
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold" style={{ color: "#1e263e" }}>
            {plan ? "План лечения" : "Новый план лечения"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {!plan && (
            <div ref={patientBoxRef} className="relative">
              <label className="block text-sm font-semibold mb-2" style={{ color: "#1e263e" }}>
                Пациент <span className="text-red-500">*</span>
              </label>
              {selectedPatient ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                    {selectedPatient.phone && <p className="text-xs text-gray-500">{selectedPatient.phone}</p>}
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setPatientQuery(""); }} className="text-emerald-600 hover:text-emerald-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" value={patientQuery}
                      onChange={e => { setPatientQuery(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Поиск по имени или телефону..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                    />
                    {patientsLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                  </div>
                  {showPatientDropdown && patients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {patients.map(p => (
                        <button
                          key={p.id} type="button"
                          onClick={() => { setSelectedPatient(p); setShowPatientDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</span>
                          {p.phone && <span className="text-xs text-gray-400">{p.phone}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#1e263e" }}>Название / диагноз</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              onBlur={plan ? saveMeta : undefined}
              placeholder="Например: Лечение гастрита"
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {plan && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#1e263e" }}>Заметки</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveMeta} rows={2}
                className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          )}

          {!plan ? (
            <button
              onClick={handleCreatePlan} disabled={creating || !selectedPatient}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" }}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Создать план
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-semibold" style={{ color: "#1e263e" }}>
                  Позиции плана {plan.items.length > 0 && <span className="text-gray-400 font-normal">({plan.items.length})</span>}
                </p>
                <button
                  onClick={() => setShowAddPanel(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {showAddPanel ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {showAddPanel ? "Скрыть" : "Добавить позицию"}
                </button>
              </div>

              {showAddPanel && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setAddTab("suggestions")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${addTab === "suggestions" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500"}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Из истории пациента
                    </button>
                    <button
                      onClick={() => setAddTab("manual")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${addTab === "manual" ? "bg-white text-blue-600 shadow-sm border border-gray-200" : "text-gray-500"}`}
                    >
                      Вручную
                    </button>
                  </div>

                  {addTab === "suggestions" ? (
                    suggestionsLoading || suggestions === null ? (
                      <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                    ) : suggestions.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-400">
                        Нет направлений/консультаций, которые ещё не добавлены ни в один план
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {suggestions.map(s => {
                          const key = `${s.source}-${s.source_id}`;
                          return (
                            <div key={key} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                                <p className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1"><Stethoscope className="w-3 h-3" />{SOURCE_LABELS[s.source]}</span>
                                  {s.doctor_name && <span>· {s.doctor_name}</span>}
                                  {s.scheduled_at && (
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(s.scheduled_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                  {s.price != null && <span className="font-semibold text-gray-500">{formatMoney(s.price, s.currency)}</span>}
                                </p>
                              </div>
                              <button
                                onClick={() => addSuggestion(s)} disabled={addingKey === key}
                                className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-50"
                              >
                                {addingKey === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text" value={manualName} onChange={e => setManualName(e.target.value)}
                        placeholder="Название позиции..."
                        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
                      />
                      <input
                        type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)}
                        placeholder="Цена"
                        className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
                      />
                      <button
                        onClick={addManualItem} disabled={!manualName.trim()}
                        className="flex-shrink-0 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {plan.items.length === 0 && !showAddPanel && (
                  <p className="text-center py-6 text-sm text-gray-400">Позиций пока нет — нажмите «Добавить позицию»</p>
                )}
                {plan.items.map(item => {
                  const colors = STATUS_COLORS[item.status];
                  const busy = busyItemId === item.id;
                  return (
                    <div key={item.id} className={`rounded-xl border ${colors.border} ${colors.bg} px-3.5 py-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                            <span>{SOURCE_LABELS[item.source]}</span>
                            {item.doctor_name && <span>· {item.doctor_name}</span>}
                            <span className={`font-semibold ${colors.text}`}>{STATUS_LABELS[item.status]}</span>
                          </p>
                        </div>
                        <button onClick={() => deleteItem(item)} disabled={busy} className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {formatMoney(item.price, item.currency)} · оплачено {formatMoney(item.paid_amount, item.currency)}
                          {parseFloat(item.owed_amount) > 0 && (
                            <span className="text-red-500 font-semibold"> · к доплате {formatMoney(item.owed_amount, item.currency)}</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {item.status !== "completed" && (
                          <button onClick={() => markStatus(item, "completed")} disabled={busy}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                            <CheckCircle2 className="w-3 h-3" /> Выполнено
                          </button>
                        )}
                        {item.status !== "no_show" && (
                          <button onClick={() => markStatus(item, "no_show")} disabled={busy}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50">
                            <XCircle className="w-3 h-3" /> Не пришёл
                          </button>
                        )}
                        {item.status !== "planned" && (
                          <button onClick={() => markStatus(item, "planned")} disabled={busy}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50">
                            <RotateCcw className="w-3 h-3" /> Вернуть в план
                          </button>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <input
                            type="number" placeholder="Оплата"
                            value={paymentDrafts[item.id] ?? ""}
                            onChange={e => setPaymentDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-20 px-2 py-1 text-[11px] rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none"
                          />
                          <button onClick={() => recordPayment(item)} disabled={busy}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50">
                            <Wallet className="w-3 h-3" /> Внести
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex justify-end gap-2">
          <button onClick={() => { onSaved(); onClose(); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border-2 border-gray-200 transition-colors">
            Готово
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default PlanEditor;
