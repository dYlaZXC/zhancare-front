"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Building2, Gift, CreditCard, Wallet, Search } from "lucide-react";
import { api } from "@/utils/api";
import { SubscriptionPlan } from "./SubscriptionPlanFormModal";

interface PatientOption { id: number; email: string | null; first_name: string | null; last_name: string | null; }

const PAYMENT_OPTIONS: { type: string; label: string; sub: string; Icon: any }[] = [
  { type: "pay_at_clinic", label: "В клинике", sub: "Оплата при визите", Icon: Building2 },
  { type: "free", label: "Бесплатно", sub: "Без оплаты", Icon: Gift },
  { type: "full_prepay", label: "Полная предоплата", sub: "100% заранее", Icon: CreditCard },
  { type: "partial_prepay", label: "Частичная", sub: "Депозит заранее", Icon: Wallet },
];

export function SellSubscriptionModal({
  initialPatient, onClose, onSold,
}: {
  initialPatient?: PatientOption | null;
  onClose: () => void;
  onSold: () => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient || null);
  const [planId, setPlanId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState("pay_at_clinic");
  const [prepayAmount, setPrepayAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/subscriptions/plans/").then(res => setPlans((res.data.results || res.data).filter((p: SubscriptionPlan) => p.is_active)));
    if (!initialPatient) {
      api.get("/patients/").then(res => setPatients(res.data));
    }
  }, [initialPatient]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [patients, patientSearch]);

  const plan = plans.find(p => p.id === planId) || null;

  const submit = async () => {
    if (!patient || !plan) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/subscriptions/patient-subscriptions/", {
        plan_id: plan.id, patient_id: patient.id, payment_type: paymentType,
        ...(paymentType === "partial_prepay" ? { prepay_amount: prepayAmount } : {}),
      });
      onSold();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось продать абонемент");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>Продать абонемент</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div className="space-y-4">
          {!initialPatient && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Пациент</label>
              {patient ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border-2 border-blue-200 bg-blue-50">
                  <span className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</span>
                  <button onClick={() => setPatient(null)} className="text-xs text-blue-600">Изменить</button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Поиск по имени или email"
                    className="w-full pl-9 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
                  />
                  {filteredPatients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredPatients.map(p => (
                        <button
                          key={p.id} onClick={() => { setPatient(p); setPatientSearch(""); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          {p.first_name} {p.last_name} <span className="text-gray-400">{p.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Тариф</label>
            <select
              value={planId ?? ""} onChange={e => setPlanId(Number(e.target.value) || null)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
            >
              <option value="">Выберите тариф</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price} {p.currency}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Тип оплаты</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.filter(o => o.type !== "free" || !plan || plan.price === 0).map(({ type, label, sub, Icon }) => {
                const selected = paymentType === type;
                return (
                  <button
                    key={type} type="button" onClick={() => setPaymentType(type)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left ${selected ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? "text-blue-600" : "text-gray-400"}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {paymentType === "partial_prepay" && (
              <input
                type="number" value={prepayAmount} onChange={e => setPrepayAmount(e.target.value)}
                placeholder="Сумма предоплаты" className="w-full mt-2 px-3 py-2 rounded-xl border-2 border-amber-200 text-sm"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600">Отмена</button>
          <button
            onClick={submit} disabled={saving || !patient || !plan}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            {saving ? "Оформление..." : "Продать"}
          </button>
        </div>
      </div>
    </div>
  );
}
