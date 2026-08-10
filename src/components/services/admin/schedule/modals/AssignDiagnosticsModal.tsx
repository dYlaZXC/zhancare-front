"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Search, X, Clock, Check, Loader2, Plus, RefreshCw, Eye, EyeOff, Copy,
  FlaskConical, ScanLine, Heart, Brain, Bone, Eye as EyeIcon, Baby,
  Microscope, ClipboardList, Stethoscope,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  'flask-conical':  FlaskConical,
  'scan-line':      ScanLine,
  'heart':          Heart,
  'brain':          Brain,
  'bone':           Bone,
  'eye':            EyeIcon,
  'baby':           Baby,
  'microscope':     Microscope,
  'clipboard-list': ClipboardList,
  'stethoscope':    Stethoscope,
};
function getIcon(icon: string): React.ElementType {
  return ICON_MAP[icon] ?? ClipboardList;
}

interface Slot { start: string; end: string }

interface AssignDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: number;
  serviceName: string;
  serviceCategoryLabel: string;
  serviceColor: string;
  serviceIcon: string;
  slot: Slot | null;
  allSlots: Slot[];
  date: string;
  onAssigned: () => void;
}

export default function AssignDiagnosticsModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  serviceCategoryLabel,
  serviceColor,
  serviceIcon,
  slot,
  allSlots,
  date,
  onAssigned,
}: AssignDiagnosticsModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(slot);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string; phone?: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [newPatientPassword, setNewPatientPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setNewPatientPassword(pwd);
  };

  const copyPassword = () => {
    if (newPatientPassword) { navigator.clipboard.writeText(newPatientPassword); toast.success('Пароль скопирован'); }
  };

  const handleCreatePatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim() || !newPatientForm.phone.trim()) {
      toast.error('Заполните обязательные поля: имя, фамилия, телефон'); return;
    }
    if (!newPatientPassword || newPatientPassword.length < 8) {
      toast.error('Введите пароль (минимум 8 символов)'); return;
    }
    setCreatingPatient(true);
    try {
      const response = await api.post('/patients/', {
        ...newPatientForm, password: newPatientPassword, require_password_change: requirePasswordChange,
      });
      const created = response.data;
      setPatients(prev => [...prev, created]);
      setSelectedPatient({ id: created.id, name: `${created.first_name} ${created.last_name}`, phone: created.phone });
      setShowNewPatientForm(false);
      setNewPatientForm({ first_name: '', last_name: '', phone: '' });
      setNewPatientPassword('');
      setRequirePasswordChange(true);
      toast.success(`Пациент ${created.first_name} ${created.last_name} создан и выбран`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || Object.values(err?.response?.data || {})[0] as string || 'Ошибка создания пациента');
    } finally {
      setCreatingPatient(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSlot(slot);
    setSelectedPatient(null);
    setPatientSearch('');
    setNotes('');
    setShowNewPatientForm(false);
    setNewPatientForm({ first_name: '', last_name: '', phone: '' });
    setNewPatientPassword('');
    setRequirePasswordChange(true);

    setPatientsLoading(true);
    api.get('/patients/?all=true')
      .then(res => setPatients(Array.isArray(res.data) ? res.data : res.data?.results ?? []))
      .catch(() => toast.error('Не удалось загрузить список пациентов'))
      .finally(() => setPatientsLoading(false));
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(e.target as Node))
        setShowPatientDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredPatients = patientSearch.trim()
    ? patients.filter(p => {
        const name = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const q = patientSearch.toLowerCase();
        return name.includes(q) || phone.includes(q);
      })
    : patients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { toast.error('Выберите пациента'); return; }
    if (!selectedSlot) { toast.error('Выберите время'); return; }
    setSubmitting(true);
    try {
      await api.post('/diagnostics/appointments/', {
        service_id: serviceId,
        patient_id: selectedPatient.id,
        scheduled_time: `${date}T${selectedSlot.start}:00`,
        notes,
      });
      toast.success('Запись успешно создана!');
      onAssigned();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Не удалось создать запись');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const Icon = getIcon(serviceIcon);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#1e263e' }}>Новая запись</h3>
            <p className="text-sm text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

            {/* Service info */}
            <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${serviceColor}cc, ${serviceColor})` }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{serviceName}</p>
              </div>
              <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg text-white"
                style={{ background: serviceColor }}>
                {serviceCategoryLabel}
              </span>
            </div>

            {/* Slot picker */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
                Время приёма <span className="text-red-500">*</span>
              </label>
              {allSlots.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Нет свободных слотов на этот день
                </div>
              ) : (
                <>
                  {/* Nearest / selected slot — big featured card */}
                  {(() => {
                    const featured = selectedSlot ?? allSlots[0];
                    const isSelected = selectedSlot?.start === featured.start;
                    return (
                      <button type="button" onClick={() => setSelectedSlot(featured)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 mb-3 transition-all ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white'
                        }`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white/20' : 'bg-white shadow-sm'
                        }`}>
                          <Clock className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold leading-tight">Ближайший: {featured.start}</p>
                          <p className={`text-xs mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-400'}`}>
                            до {featured.end}
                          </p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 ml-auto text-white" />}
                      </button>
                    );
                  })()}

                  {/* Full slot grid */}
                  {allSlots.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allSlots.map((s, i) => {
                        const isSel = selectedSlot?.start === s.start;
                        return (
                          <button key={i} type="button" onClick={() => setSelectedSlot(s)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                              isSel
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}>
                            {s.start}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Patient search */}
            <div ref={patientSearchRef} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: '#1e263e' }}>
                  Пациент <span className="text-red-500">*</span>
                </label>
                {!selectedPatient && (
                  <button type="button"
                    onClick={() => { setShowNewPatientForm(v => !v); setPatientSearch(''); }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                      showNewPatientForm ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}>
                    {showNewPatientForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {showNewPatientForm ? 'Отмена' : 'Новый пациент'}
                  </button>
                )}
              </div>

              {showNewPatientForm && (
                <div className="mb-3 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Новый пациент</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Имя <span className="text-red-500">*</span></label>
                      <input type="text" value={newPatientForm.first_name}
                        onChange={e => setNewPatientForm(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="Имя"
                        className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Фамилия <span className="text-red-500">*</span></label>
                      <input type="text" value={newPatientForm.last_name}
                        onChange={e => setNewPatientForm(p => ({ ...p, last_name: e.target.value }))}
                        placeholder="Фамилия"
                        className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Телефон <span className="text-red-500">*</span></label>
                      <input type="tel" value={newPatientForm.phone}
                        onChange={e => setNewPatientForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Пароль <span className="text-red-500">*</span></label>
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <input type={showNewPassword ? 'text' : 'password'}
                            value={newPatientPassword}
                            onChange={e => setNewPatientPassword(e.target.value)}
                            placeholder="Минимум 8 символов"
                            className="w-full pl-3 pr-8 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-mono" />
                          <button type="button" onClick={() => setShowNewPassword(v => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button type="button" onClick={generatePassword}
                          className="p-2 rounded-xl border-2 border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-600 transition-all" title="Сгенерировать">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={copyPassword}
                          className="p-2 rounded-xl border-2 border-gray-200 hover:border-green-400 text-gray-500 hover:text-green-600 transition-all" title="Скопировать">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={requirePasswordChange}
                      onChange={e => setRequirePasswordChange(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600" />
                    <span className="text-xs text-gray-600 font-medium">Потребовать смену пароля при первом входе</span>
                  </label>
                  <button type="button" onClick={handleCreatePatient} disabled={creatingPatient}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}>
                    {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creatingPatient ? 'Создание...' : 'Создать и выбрать'}
                  </button>
                </div>
              )}

              {selectedPatient ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                    {selectedPatient.phone && <p className="text-xs text-gray-500">{selectedPatient.phone}</p>}
                  </div>
                  <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-200 text-emerald-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {patientsLoading
                      ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    }
                    <input ref={patientInputRef} type="text" value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setShowPatientDropdown(true); }}
                      onFocus={() => {
                        if (patientInputRef.current) setDropdownRect(patientInputRef.current.getBoundingClientRect());
                        setShowPatientDropdown(true);
                      }}
                      placeholder={patientsLoading ? 'Загрузка пациентов...' : `Поиск среди ${patients.length} пациентов...`}
                      disabled={patientsLoading}
                      className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm transition-colors disabled:bg-gray-50 disabled:text-gray-400" />
                  </div>
                  {showPatientDropdown && !patientsLoading && dropdownRect && (
                    <div style={{
                      position: 'fixed',
                      top: dropdownRect.bottom + 4,
                      left: dropdownRect.left,
                      width: dropdownRect.width,
                      zIndex: 9999,
                    }}
                      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {filteredPatients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Нет пациентов</div>
                      ) : (
                        filteredPatients.slice(0, 20).map(p => (
                          <button key={p.id} type="button"
                            onClick={() => {
                              setSelectedPatient({ id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone });
                              setPatientSearch('');
                              setShowPatientDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {`${p.first_name[0]}${p.last_name[0]}`.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                              {p.phone && <p className="text-xs text-gray-400">{p.phone}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>Примечания</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Дополнительная информация о записи..."
                className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-colors" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={submitting || !selectedPatient || !selectedSlot}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Создание...</> : 'Создать запись'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
