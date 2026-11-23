"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  Mail, Lock, Calendar, Building, X, RefreshCw,
  Eye, EyeOff, Copy, Loader2, UserPlus, CheckCircle, Search, Link2, AlertTriangle,
} from "lucide-react";
import { api } from "@/utils/api";
import PhoneInput from "@/components/ui/PhoneInput";
import SearchSelect from "../../schedule/components/SearchSelect";
import type { Patient, Clinic, PatientFormData, FoundPatient, PatientLookupResponse } from "../types/patientTypes";
import { EMPTY_PATIENT_FORM, REFERRAL_SOURCE_OPTIONS } from "../types/patientTypes";
import { usePhoneVerification, useEmailVerification } from "../hooks/usePatientVerificationCodes";
import PhoneVerificationField from "../components/PhoneVerificationField";
import EmailVerificationField from "../components/EmailVerificationField";

// ─── Patient Form Modal ─────────────────────────────────────────────────────

export function PatientFormModal({
  mode,
  initial,
  isGlobalAdmin,
  clinics,
  user,
  onClose,
  onSaved,
  onExistingPatientFound,
}: {
  mode: "create" | "edit";
  initial: Patient | null;
  isGlobalAdmin: boolean;
  clinics: Clinic[];
  user: any;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  onExistingPatientFound?: (patient: FoundPatient) => void;
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
        referral_source: initial.referral_source || "",
      };
    }
    return { ...EMPTY_PATIENT_FORM };
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Create mode no longer collects a password at all — PatientsViewSet.create
  // (common/views/admin.py) now requires the phone (and, if given, email) to
  // have just been verified via a code the PATIENT reads back to the admin,
  // same invariant self-registration enforces. Edit mode is untouched:
  // partial_update still accepts an optional password reset for an existing
  // patient, unrelated to this.
  const phoneVerification = usePhoneVerification(form.phone);
  const emailVerification = useEmailVerification(form.email);

  // Live "does this patient already exist?" check — fires while filling out
  // phone/email, well before submit, so the admin doesn't fill out the whole
  // form (name, password, address...) only to be told at the end it's a dupe.
  const [existingMatch, setExistingMatch] = useState<FoundPatient | null>(null);
  const [alreadyInClinic, setAlreadyInClinic] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const checkSeq = useRef(0);

  const set = (k: keyof PatientFormData, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const targetClinicId = isGlobalAdmin ? form.clinic_id : (user.clinic?.id ?? user.clinic_id);

  useEffect(() => {
    if (mode !== "create" || !targetClinicId) { setExistingMatch(null); return; }
    if (!isValidPhoneNumber(form.phone || "")) { setExistingMatch(null); return; }

    const seq = ++checkSeq.current;
    setCheckingExisting(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<PatientLookupResponse>('/patients/lookup/', {
          params: { phone: form.phone, email: form.email || undefined, clinic_id: targetClinicId },
        });
        if (checkSeq.current !== seq) return; // a newer check superseded this one
        if (res.data.found) {
          setExistingMatch(res.data.patient!);
          setAlreadyInClinic(res.data.already_in_clinic ?? false);
        } else {
          setExistingMatch(null);
        }
      } catch {
        if (checkSeq.current === seq) setExistingMatch(null);
      } finally {
        if (checkSeq.current === seq) setCheckingExisting(false);
      }
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone, form.email, targetClinicId, mode]);

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
      if (phoneVerification.status !== 'verified') errors.phone = 'Подтвердите телефон кодом из WhatsApp';
      if (form.email.trim() && emailVerification.status !== 'verified' && emailVerification.status !== 'skipped') {
        errors.email = 'Подтвердите email или нажмите «Указать позже»';
      }
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
        // If we can resolve a target clinic, check whether this phone/email
        // already belongs to a patient somewhere else first — offer to link
        // them instead of letting create() hard-block with "already exists".
        // Global admins with "Без клиники" selected have nothing to link
        // to, so they keep the old direct-create behavior. Re-checked here
        // (not just relying on the live inline check above) since the admin
        // may have ignored the inline banner and kept editing the fields.
        if (targetClinicId && onExistingPatientFound) {
          const lookupRes = await api.get<PatientLookupResponse>('/patients/lookup/', {
            params: { phone: form.phone, email: form.email || undefined, clinic_id: targetClinicId },
          });
          if (lookupRes.data.found) {
            if (lookupRes.data.already_in_clinic) {
              toast.info('Этот пациент уже привязан к вашей клинике');
              setSaving(false);
              return;
            }
            onExistingPatientFound(lookupRes.data.patient!);
            setSaving(false);
            onClose();
            return;
          }
        }

        const { password: _unusedPassword, ...createData } = form;
        const response = await api.post('/patients/', {
          ...createData,
          // Only ever sent once actually verified — never an unconfirmed email.
          email: emailVerification.status === 'verified' ? form.email : undefined,
        });
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
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-8 py-6 rounded-t-3xl flex items-center justify-between z-10">
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
            className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-8 pt-8">
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
              {mode === "create" ? (
                <EmailVerificationField
                  email={form.email}
                  onEmailChange={(value) => set('email', value)}
                  status={emailVerification.status}
                  onSend={emailVerification.send}
                  onVerify={emailVerification.verify}
                  onResend={emailVerification.resend}
                  otpError={emailVerification.otpError}
                  onSkip={emailVerification.skip}
                  onChangeEmail={emailVerification.changeEmail}
                />
              ) : (
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
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Телефон <span className="text-red-500">*</span>
              </label>
              {mode === "create" ? (
                <PhoneVerificationField
                  phone={form.phone}
                  onPhoneChange={(e164) => set('phone', e164)}
                  status={phoneVerification.status}
                  onSend={phoneVerification.send}
                  onVerify={phoneVerification.verify}
                  onResend={phoneVerification.resend}
                  otpError={phoneVerification.otpError}
                  onChangePhone={phoneVerification.changePhone}
                />
              ) : (
                <PhoneInput
                  value={form.phone}
                  onChange={(e164) => set('phone', e164)}
                  required
                  defaultCountry="KZ"
                />
              )}
              {checkingExisting && (
                <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                  <Search className="w-3.5 h-3.5 animate-pulse" />
                  Проверяем, нет ли уже такого пациента...
                </p>
              )}
              {!checkingExisting && existingMatch && (
                <div className={`mt-2 rounded-2xl p-4 border-2 ${alreadyInClinic ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-2.5">
                    {alreadyInClinic ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${alreadyInClinic ? 'text-amber-800' : 'text-blue-800'}`}>
                        Пациент с таким телефоном{form.email && '/email'} уже существует: {existingMatch.first_name} {existingMatch.last_name}
                      </p>
                      <p className={`text-xs mt-0.5 ${alreadyInClinic ? 'text-amber-700' : 'text-blue-700'}`}>
                        {alreadyInClinic
                          ? 'Уже привязан к вашей клинике — создавать заново не нужно.'
                          : existingMatch.clinic
                            ? `Сейчас числится в клинике «${existingMatch.clinic.name}».`
                            : 'Пока не привязан ни к одной клинике.'}
                      </p>
                      {!alreadyInClinic && onExistingPatientFound && (
                        <button
                          type="button"
                          onClick={() => { onExistingPatientFound(existingMatch); onClose(); }}
                          className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Привязать вместо создания
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password — edit mode only now (optional reset for an existing
                patient). Create mode has no password at all: the patient
                logs in via OTP (send-login-code/verify-login-code) using the
                phone/email just verified above. */}
            {mode === "edit" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Новый пароль <span className="text-gray-400 text-xs font-normal">(оставьте пустым, чтобы не менять)</span>
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
              </div>
            )}

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
                <SearchSelect
                  options={[
                    { id: 'male', label: 'Мужской' },
                    { id: 'female', label: 'Женский' },
                    { id: 'other', label: 'Другое' },
                  ]}
                  value={form.gender}
                  onChange={(v) => { if (v) set('gender', v as any); }}
                  placeholder="Выберите пол"
                />
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

            {/* Referral Source */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Откуда узнал о клинике
              </label>
              <SearchSelect
                options={REFERRAL_SOURCE_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
                value={form.referral_source}
                onChange={(v) => set('referral_source', v)}
                placeholder="Не указано"
              />
            </div>

            {/* Clinic Selection/Display (create only) */}
            {mode === "create" && (isGlobalAdmin ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Клиника <span className="text-gray-500 text-xs">(опционально)</span>
                </label>
                <SearchSelect
                  options={clinics.map((clinic) => ({ id: clinic.id, label: clinic.name }))}
                  value={form.clinic_id}
                  onChange={(v) => set('clinic_id', v)}
                  placeholder="Без клиники"
                />
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
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-white" />
                  </div>
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

            {/* Offer to link this patient to the admin's clinic when editing
                someone not yet claimed by (or linked to) it — e.g. a patient
                visible only because of booking history at this clinic. Goes
                through the same code-confirmation flow as the create-time
                "existing patient found" path. */}
            {mode === "edit" && initial && targetClinicId && onExistingPatientFound && !(
              String(initial.clinic?.id ?? '') === String(targetClinicId) ||
              (initial.additional_clinics ?? []).some(c => String(c.id) === String(targetClinicId))
            ) && (
              <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Пациент не привязан к вашей клинике</p>
                    <p className="text-xs text-gray-600">Отправьте код подтверждения, чтобы добавить его как пациента вашей клиники</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onExistingPatientFound({
                      id: initial.id,
                      first_name: initial.first_name,
                      last_name: initial.last_name,
                      email: initial.email,
                      phone: initial.phone,
                      has_email: !!initial.email,
                      clinic: initial.clinic ?? null,
                      additional_clinics: initial.additional_clinics ?? [],
                    })}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Link2 className="w-4 h-4" />
                    Привязать
                  </button>
                </div>
              </div>
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
              disabled={saving || (mode === "create" && phoneVerification.status !== 'verified')}
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
