"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Search } from "lucide-react";
import { api } from "@/utils/api";

interface PatientOption { id: number; email: string; first_name: string; last_name: string; }

export function AddParticipantModal({
  classSessionId, onClose, onAdded,
}: {
  classSessionId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [search, setSearch] = useState("");
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [subId, setSubId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.get("/patients/").then(res => setPatients(res.data)); }, []);

  useEffect(() => {
    if (!patient) { setSubs([]); return; }
    api.get("/subscriptions/patient-subscriptions/", { params: { patient_id: patient.id } }).then(res => {
      const list = (res.data.results || res.data).filter((s: any) => s.status === "active");
      setSubs(list);
      setSubId(list[0]?.id ?? null);
    });
  }, [patient]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return patients.filter(p => `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(q)).slice(0, 8);
  }, [patients, search]);

  const submit = async () => {
    if (!patient || !subId) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/subscriptions/class-sessions/${classSessionId}/book/`, {
        patient_id: patient.id, patient_subscription_id: subId,
      });
      onAdded();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Не удалось записать пациента");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1e263e" }}>Добавить участника</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        {patient ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border-2 border-blue-200 bg-blue-50 mb-3">
            <span className="text-sm font-medium text-gray-900">{patient.first_name} {patient.last_name}</span>
            <button onClick={() => setPatient(null)} className="text-xs text-blue-600">Изменить</button>
          </div>
        ) : (
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск пациента"
              className="w-full pl-9 px-3 py-2 rounded-xl border-2 border-gray-200 text-sm"
            />
            {filtered.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filtered.map(p => (
                  <button key={p.id} onClick={() => { setPatient(p); setSearch(""); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                    {p.first_name} {p.last_name} <span className="text-gray-400">{p.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {patient && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Абонемент</label>
            <select value={subId ?? ""} onChange={e => setSubId(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm">
              {subs.length === 0 && <option value="">Нет активных абонементов</option>}
              {subs.map(s => <option key={s.id} value={s.id}>{s.plan_name_snapshot}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-600">Отмена</button>
          <button
            onClick={submit} disabled={saving || !patient || !subId}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            {saving ? "Запись..." : "Записать"}
          </button>
        </div>
      </div>
    </div>
  );
}
