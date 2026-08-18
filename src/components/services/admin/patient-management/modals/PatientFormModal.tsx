"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Mail, Lock, Calendar, Building, XCircle, RefreshCw,
  Eye, EyeOff, Copy, Loader2, UserPlus, CheckCircle,
} from "lucide-react";
import { api } from "@/utils/api";
import PhoneInput from "@/components/ui/PhoneInput";
import type { Patient, Clinic, PatientFormData } from "../types/patientTypes";
import { EMPTY_PATIENT_FORM } from "../types/patientTypes";

import bnClinicLogo from "@/assets/clinics_logos/bn-clinica.png";
import ayalaClinicLogo from "@/assets/clinics_logos/ayala_clinic.png";

// ─── Patient Form Modal ─────────────────────────────────────────────────────

export function PatientFormModal({
  mode,
  initial,
  isGlobalAdmin,
  clinics,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: Patient | null;
  isGlobalAdmin: boolean;
  clinics: Clinic[];
  user: any;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
}) {
  const [form, setForm] = useState<PatientFormData>(() => {
    if (mode === "edit" && initial) {
      return {
        first_name: initial.first_name ?? "",
        last_name: initial.last_name ?? "",
        email: initial.email ?? "",
        phone: initial.phone,
        password: "",
        birth_date: initial.birth_date || "",
        gender: initial.gender || "male",
        address: initial.address || "",
        city: initial.city || "",
        clinic_id: initial.clinic?.id?.toString() || "",
      };
    }
    return { ...EMPTY_PATIENT_FORM };
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);

  const set = (k: keyof PatientFormData, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const focusColor = mode === "create" ? "focus:border-green-500" : "focus:border-blue-500";
  const accentText = mode === "create" ? "text-green-600 hover:text-green-700" : "text-blue-600 hover:text-blue-700";

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
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard.writeText(form.password);
    toast.success('Пароль скопирован');
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!form.first_name.trim()) errors.first_name = 'Введите имя';
    if (!form.last_name.trim()) errors.last_name = 'Введите фамилию';
    if (!form.phone.trim()) errors.phone = 'Введите номер телефона';

    if (mode === "create") {
      if (!form.password.trim()) errors.password = 'Введите пароль';
      else if (form.password.length < 8) errors.password = 'Минимум 8 символов';
    } else if (form.password && form.password.length < 8) {
      errors.password = 'Минимум 8 символов';
    }

    // ✅ Clinic is optional - global admins can choose to assign or not assign a clinic
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const response = await api.post('/patients/', { ...form, require_password_change: requirePasswordChange });
        toast.success("Пациент успешно добавлен!");
        onSaved(response.data);
      } else {
        const { password, ...updateData } = form;
        const finalData = password ? { ...updateData, password } : updateData;
        const response = await api.patch(`/patients/${initial!.id}/`, finalData);
        toast.success("Данные пациента успешно обновлены!");
        onSaved(response.data);
      }
    } catch (err: any) {
      console.error(mode === "create" ? "Error adding patient:" : "Error updating patient:", err);
      toast.error(err.response?.data?.error || err.message || (mode === "create" ? "Не удалось добавить пациента" : "Не удалось обновить данные пациента"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1e263e' }}>
              {mode === "create" ? "Добавить Пациента" : "Редактировать Пациента"}
            </h2>
            <p className="text-gray-600 mt-1">
              {mode === "create"
                ? "Заполните форму для регистрации нового пациента"
                : `Обновите данные пациента ${initial?.first_name} ${initial?.last_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Имя <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => set('first_name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Фамилия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  placeholder="Введите фамилию"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Телефон <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                value={form.phone}
                onChange={(e164) => set('phone', e164)}
                required
                defaultCountry="KZ"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {mode === "create" ? (
                    <>Пароль <span className="text-red-500">*</span></>
                  ) : (
                    <>Новый пароль <span className="text-gray-400 text-xs font-normal">(оставьте пустым, чтобы не менять)</span></>
                  )}
                </label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${accentText}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Сгенерировать
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required={mode === "create"}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={`w-full pl-12 pr-20 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors font-mono`}
                  placeholder="Минимум 8 символов"
                  minLength={8}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title={showPassword ? "Скрыть" : "Показать"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Скопировать пароль"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Force password change checkbox (create only) */}
              {mode === "create" && (
                <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none group">
                  <div
                    onClick={() => setRequirePasswordChange(v => !v)}
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                      requirePasswordChange
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-300 group-hover:border-green-400'
                    }`}
                  >
                    {requirePasswordChange && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    Потребовать смену пароля при первом входе
                  </span>
                </label>
              )}
            </div>

            {/* Birth Date & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Дата рождения
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => set('birth_date', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Пол
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value as any)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                >
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другое</option>
                </select>
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Адрес
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  placeholder="Улица, дом"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Город
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 ${focusColor} focus:outline-none transition-colors`}
                  placeholder="Название города"
                />
              </div>
            </div>

            {/* Clinic Selection/Display (create only) */}
            {mode === "create" && (isGlobalAdmin ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Клиника <span className="text-gray-500 text-xs">(опционально)</span>
                </label>
                <select
                  value={form.clinic_id}
                  onChange={(e) => set('clinic_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors"
                >
                  <option value="">Без клиники</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Глобальные администраторы могут назначить пациента в любую клинику или оставить без клиники
                </p>
              </div>
            ) : (user.clinic?.name || user.clinic_id) && (
              <div className="rounded-2xl p-4 border-2 border-green-100 bg-green-50">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Клиника <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {(user.clinic?.id === 913 || user.clinic?.name?.toLowerCase().includes('ayala')) ? (
                    <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-green-200 shadow-md">
                      <Image src={ayalaClinicLogo} alt="Ayala Clinic" width={80} height={28} className="object-contain" priority={false} />
                    </div>
                  ) : (user.clinic?.name?.toLowerCase().includes('bn') || user.clinic?.name?.toLowerCase().includes('бн')) ? (
                    <div className="flex-shrink-0 bg-white p-2 rounded-xl border-2 border-green-200 shadow-md">
                      <Image src={bnClinicLogo} alt="BN Clinic" width={80} height={28} className="object-contain" priority={false} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-gray-800">{user.clinic?.name || 'Ваша клиника'}</p>
                    <p className="text-sm text-gray-600">Администратор клиники</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-100 rounded-xl">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Новый пациент будет автоматически назначен в вашу клинику
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Footer */}
          <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-100">
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
              className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: mode === "create"
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              }}
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
                  <CheckCircle className="w-5 h-5" />
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
