"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Edit, Loader2, UserPlus, X } from "lucide-react";
import type { StaffMember, StaffFormData, Clinic, WeeklySchedules } from "../types/staffTypes";
import { EMPTY_STAFF_FORM } from "../types/staffTypes";
import { BasicInfoTab } from "../form/BasicInfoTab";
import { FinanceTab } from "../form/FinanceTab";

const DAY_TO_WEEKDAY: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
};
const WEEKDAY_TO_DAY: Record<number, string> = {
  0: 'monday', 1: 'tuesday', 2: 'wednesday', 3: 'thursday', 4: 'friday', 5: 'saturday', 6: 'sunday',
};

function defaultDay(start: string, end: string, enabled = false) {
  return { start, end, enabled };
}
function emptyWeek() {
  return {
    online: {
      monday: defaultDay('09:00', '18:00'), tuesday: defaultDay('09:00', '18:00'),
      wednesday: defaultDay('09:00', '18:00'), thursday: defaultDay('09:00', '18:00'),
      friday: defaultDay('09:00', '18:00'), saturday: defaultDay('10:00', '14:00'),
      sunday: defaultDay('10:00', '14:00'),
    },
    offline: {
      monday: defaultDay('09:00', '18:00'), tuesday: defaultDay('09:00', '18:00'),
      wednesday: defaultDay('09:00', '18:00'), thursday: defaultDay('09:00', '18:00'),
      friday: defaultDay('09:00', '18:00'), saturday: defaultDay('10:00', '14:00'),
      sunday: defaultDay('10:00', '14:00'),
    },
  };
}
function currentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday.toLocaleDateString('sv-SE');
}

// Build weeklySchedules (JSON per-week format) from a member's DoctorSchedule
// rows, so an untouched edit round-trips back through buildSchedulesArray()
// to the exact same rows — this is the contract that keeps editing a staff
// member from wiping their existing schedule.
function weeklySchedulesFromMember(member: StaffMember): WeeklySchedules {
  const weekStartDate = currentWeekStart();
  const weekEntry = emptyWeek();
  const scheduleRows = member.schedules || [];
  for (const row of scheduleRows) {
    const dayName = WEEKDAY_TO_DAY[row.weekday];
    if (dayName && (row.consultation_type === 'online' || row.consultation_type === 'offline')) {
      (weekEntry[row.consultation_type] as Record<string, { start: string; end: string; enabled: boolean }>)[dayName] =
        { start: row.start_time.slice(0, 5), end: row.end_time.slice(0, 5), enabled: row.is_active };
    }
  }
  return { [weekStartDate]: weekEntry };
}

// Convert weeklySchedules (JSON per-week format) → DoctorSchedule rows array
function buildSchedulesArray(weeklySchedules: WeeklySchedules) {
  // Merge all configured weeks — sort by week start date so later weeks override earlier ones
  // for the SAME day when explicitly enabled. Disabled days in a later week never remove
  // a day that was enabled in an earlier week (additive merge).
  const merged = new Map<string, { consultation_type: string; weekday: number; start_time: string; end_time: string; is_active: boolean }>();
  const sortedEntries = Object.entries(weeklySchedules).sort(([a], [b]) => a.localeCompare(b));
  for (const [, weekEntry] of sortedEntries) {
    for (const type of ['online', 'offline'] as const) {
      const dayMap = weekEntry[type];
      if (!dayMap) continue;
      for (const [day, cfg] of Object.entries(dayMap)) {
        const weekday = DAY_TO_WEEKDAY[day] ?? 0;
        const key = `${type}-${weekday}`;
        if (cfg.enabled) {
          // Later weeks override time settings for the same day
          merged.set(key, { consultation_type: type, weekday, start_time: cfg.start, end_time: cfg.end, is_active: true });
        }
        // Disabled in a later week does NOT remove a day enabled in an earlier week
      }
    }
  }
  return Array.from(merged.values());
}

// ─── Staff Form Modal ────────────────────────────────────────────────────────

export function StaffFormModal({
  mode,
  initial,
  clinics,
  isGlobalAdmin,
  clinicCurrency,
  diagServices,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: StaffMember | null;
  clinics: Clinic[];
  isGlobalAdmin: boolean;
  clinicCurrency: string;
  diagServices: { id: number; name: string; price: number | null }[];
  user: any;
  onClose: () => void;
  onSaved: (member: StaffMember) => void;
}) {
  const [form, setForm] = useState<StaffFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        first_name: initial.first_name ?? '',
        last_name: initial.last_name ?? '',
        email: initial.email ?? '',
        phone: initial.phone,
        password: '',
        role: initial.role,
        clinic_id: initial.clinic?.id?.toString() || '',
        gender: (initial.gender || '') as '' | 'male' | 'female' | 'other',
        birth_date: initial.birth_date || '',
        address: initial.address || '',
        city: initial.city || '',
        language: Array.isArray(initial.language) ? initial.language : (initial.language ? [initial.language as string] : ['ru']),
        years_of_experience: initial.years_of_experience?.toString() || '',
        offline_consultation_price: initial.offline_consultation_price?.toString() || '',
        online_consultation_price: initial.online_consultation_price?.toString() || '',
        offline_doctor_share_percent: initial.offline_doctor_share_percent?.toString() || '50',
        online_doctor_share_percent: initial.online_doctor_share_percent?.toString() || '50',
        offline_payment_preference: initial.offline_payment_preference || 'pay_at_clinic',
        online_payment_preference: initial.online_payment_preference || 'pay_at_clinic',
        preferred_consultation_duration: initial.preferred_consultation_duration?.toString() || '',
        room_number: initial.room_number || '',
      };
    }
    return { ...EMPTY_STAFF_FORM };
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationKey, setValidationKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [mouseDownTarget, setMouseDownTarget] = useState<EventTarget | null>(null);

  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  const [specializations, setSpecializations] = useState<string[]>(() => {
    if (mode === "edit" && initial?.specialization) {
      const arr = initial.specialization.split(',').map(s => s.trim()).filter(s => s);
      return arr.length > 0 ? arr : [''];
    }
    return [''];
  });

  const [diagCommissions, setDiagCommissions] = useState<{ service_id: string; doctor_share_percent: string }[]>(
    () => (initial?.diagnostics_commissions || []).map(c => ({
      service_id: String(c.service_id),
      doctor_share_percent: String(c.doctor_share_percent),
    }))
  );

  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'finance'>('basic');
  const FINANCE_ERROR_KEYS: string[] = []; // none of the validated fields currently live in the Финансы tab
  const hasFinanceErrors = Object.keys(formErrors).some(k => FINANCE_ERROR_KEYS.includes(k));
  const hasBasicErrors = Object.keys(formErrors).some(k => !FINANCE_ERROR_KEYS.includes(k));

  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedules>(() =>
    mode === "edit" && initial ? weeklySchedulesFromMember(initial) : {}
  );

  const set = (k: keyof StaffFormData, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const clearError = (field: string) => {
    if (formErrors[field]) setFormErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '!@#$%&*';
    const all = lower + upper + digits + special;
    let pass = lower[Math.floor(Math.random() * lower.length)]
      + upper[Math.floor(Math.random() * upper.length)]
      + digits[Math.floor(Math.random() * digits.length)]
      + special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < 12; i++) pass += all[Math.floor(Math.random() * all.length)];
    pass = pass.split('').sort(() => Math.random() - 0.5).join('');
    set('password', pass);
    setShowPassword(true);
    if (formErrors.password) setFormErrors(prev => { const next = { ...prev }; delete next.password; return next; });
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard.writeText(form.password);
    toast.success('Пароль скопирован');
  };

  const handleSpecializationChange = (index: number, value: string) => {
    setSpecializations(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const addSpecialization = () => setSpecializations(prev => [...prev, '']);
  const removeSpecialization = (index: number) => setSpecializations(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  const addDiagCommission = () => setDiagCommissions(prev => [...prev, { service_id: '', doctor_share_percent: '20' }]);
  const removeDiagCommission = (index: number) => setDiagCommissions(prev => prev.filter((_, i) => i !== index));
  const handleDiagCommissionChange = (index: number, field: 'service_id' | 'doctor_share_percent', value: string) => {
    setDiagCommissions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.first_name.trim()) errors.first_name = 'Введите имя';
    if (!form.last_name.trim()) errors.last_name = 'Введите фамилию';
    if (!form.email.trim()) errors.email = 'Введите email';
    if (!form.phone.trim()) errors.phone = 'Введите номер телефона';
    if (mode === "create") {
      if (!form.password.trim()) errors.password = 'Введите пароль';
      else if (form.password.length < 8) errors.password = 'Минимум 8 символов';
    } else if (form.password && form.password.length < 8) {
      errors.password = 'Минимум 8 символов';
    }

    // Validate consultation duration for doctors
    if (form.role === 'doctor') {
      const duration = form.preferred_consultation_duration;
      if (!duration || Number(duration) < 5 || Number(duration) > 180) {
        errors.preferredConsultationDuration = 'Укажите длительность консультации (5-180 минут)';
      }
    }

    // Clinic is optional - global admins can choose to assign or not assign a clinic
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) setValidationKey(k => k + 1);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const specializationString = specializations.map(s => s.trim()).filter(s => s).join(', ');
      const commonFields = {
        specialization: specializationString,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        address: form.address || null,
        city: form.city || null,
        language: form.language || 'ru',
        years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
        offline_consultation_price: form.offline_consultation_price ? Number(form.offline_consultation_price) : null,
        online_consultation_price: form.online_consultation_price ? Number(form.online_consultation_price) : null,
        offline_doctor_share_percent: form.offline_doctor_share_percent ? Number(form.offline_doctor_share_percent) : 50,
        online_doctor_share_percent: form.online_doctor_share_percent ? Number(form.online_doctor_share_percent) : 50,
        offline_payment_preference: form.offline_payment_preference,
        online_payment_preference: form.online_payment_preference,
        preferred_consultation_duration: form.preferred_consultation_duration ? Number(form.preferred_consultation_duration) : null,
        room_number: form.room_number || null,
        schedules: buildSchedulesArray(weeklySchedules),
        diagnostics_commissions: diagCommissions
          .filter(r => r.service_id)
          .map(r => ({ service_id: Number(r.service_id), doctor_share_percent: Number(r.doctor_share_percent) || 0 })),
      };

      let res;
      if (mode === "create") {
        const payload = { ...form, ...commonFields, require_password_change: requirePasswordChange };
        res = await api.post("/staff/", payload);
        toast.success(`${form.role === 'doctor' ? 'Доктор' : 'Медсестра'} успешно добавлен(а)!`);
      } else {
        const updateData: any = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          ...commonFields,
        };
        if (form.password) updateData.password = form.password;
        if (isGlobalAdmin && form.clinic_id) updateData.clinic_id = form.clinic_id;
        res = await api.patch(`/staff/${initial!.id}/`, updateData);
        toast.success(`Данные сотрудника успешно обновлены!`);
      }
      onSaved(res.data);
    } catch (err: any) {
      console.error(mode === "create" ? "Error adding staff:" : "Error updating staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message
        || (mode === "create" ? "Не удалось добавить сотрудника" : "Не удалось обновить данные сотрудника");
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setMouseDownTarget(e.target);
  };
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownTarget === e.target) onClose();
    setMouseDownTarget(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
              {mode === "create" ? "Добавить Сотрудника" : "Редактировать Сотрудника"}
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === "create"
                ? "Заполните форму для добавления нового доктора или медсестры"
                : `Измените данные ${initial?.first_name} ${initial?.last_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-8 pt-8">
          <div className="space-y-6">
            {/* Form tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              {([
                { id: 'basic', label: 'Основное' },
                { id: 'finance', label: 'Финансы' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeFormTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {((tab.id === 'basic' && hasBasicErrors) || (tab.id === 'finance' && hasFinanceErrors)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>

            {activeFormTab === 'basic' && (
              <BasicInfoTab
                mode={mode}
                form={form}
                set={set}
                formErrors={formErrors}
                validationKey={validationKey}
                clearError={clearError}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(s => !s)}
                onGeneratePassword={generatePassword}
                onCopyPassword={copyPassword}
                requirePasswordChange={requirePasswordChange}
                onToggleRequirePasswordChange={() => setRequirePasswordChange(v => !v)}
                isLanguageDropdownOpen={isLanguageDropdownOpen}
                onToggleLanguageDropdown={() => setIsLanguageDropdownOpen(v => !v)}
                languageDropdownRef={languageDropdownRef}
                specializations={specializations}
                onSpecializationChange={handleSpecializationChange}
                onAddSpecialization={addSpecialization}
                onRemoveSpecialization={removeSpecialization}
                isGlobalAdmin={isGlobalAdmin}
                clinics={clinics}
                user={user}
                initial={initial}
              />
            )}

            {activeFormTab === 'finance' && (
              <FinanceTab
                form={form}
                set={set}
                clinicCurrency={clinicCurrency}
                diagCommissions={diagCommissions}
                diagServices={diagServices}
                onAddDiagCommission={addDiagCommission}
                onRemoveDiagCommission={removeDiagCommission}
                onDiagCommissionChange={handleDiagCommissionChange}
              />
            )}
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 z-10 -mx-8 mt-8 flex gap-4 rounded-b-3xl border-t-2 border-gray-100 bg-white px-8 pt-6 pb-8">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === "create" ? "Добавление..." : "Сохранение..."}
                </>
              ) : mode === "create" ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Добавить
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
