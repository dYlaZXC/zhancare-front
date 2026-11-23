"use client";

import { Dispatch, SetStateAction } from "react";
import { Loader2, Mail, Phone, Plus, Stethoscope, User, X, Calendar as CalendarIcon, MapPin } from "lucide-react";
import SearchSelect from "../../../components/SearchSelect";
import type { Patient } from "../types/addEventTypes";
import { REFERRAL_SOURCE_OPTIONS } from "../../../../patient-management/types/patientTypes";
import PhoneVerificationField from "../../../../patient-management/components/PhoneVerificationField";
import EmailVerificationField from "../../../../patient-management/components/EmailVerificationField";
import type { VerificationStatus } from "../../../../patient-management/hooks/usePatientVerificationCodes";

export type { VerificationStatus };

export interface NewPatientForm {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  referral_source: string;
}

export function PatientSection({
  patients,
  patientId,
  onPatientChange,
  showNewPatientForm,
  onToggleNewPatientForm,
  newPatientForm,
  onNewPatientFormChange,
  creatingPatient,
  onCreatePatient,
  phoneStatus,
  onSendPhoneCode,
  onVerifyPhoneCode,
  onResendPhoneCode,
  phoneOtpError,
  onChangePhone,
  emailStatus,
  onSendEmailCode,
  onVerifyEmailCode,
  onResendEmailCode,
  emailOtpError,
  onSkipEmail,
  onChangeEmail,
}: {
  patients: Patient[];
  patientId: string;
  onPatientChange: (id: string) => void;
  showNewPatientForm: boolean;
  onToggleNewPatientForm: () => void;
  newPatientForm: NewPatientForm;
  onNewPatientFormChange: Dispatch<SetStateAction<NewPatientForm>>;
  creatingPatient: boolean;
  onCreatePatient: () => void;
  phoneStatus: VerificationStatus;
  onSendPhoneCode: () => void;
  onVerifyPhoneCode: (code: string) => Promise<void>;
  onResendPhoneCode: () => Promise<boolean>;
  phoneOtpError: string | null;
  onChangePhone: () => void;
  emailStatus: VerificationStatus;
  onSendEmailCode: () => void;
  onVerifyEmailCode: (code: string) => Promise<void>;
  onResendEmailCode: () => Promise<boolean>;
  emailOtpError: string | null;
  onSkipEmail: () => void;
  onChangeEmail: () => void;
}) {
  const patient = patients.find(p => String(p.id) === patientId);

  const canSubmit = phoneStatus === "verified" && (emailStatus === "verified" || emailStatus === "skipped" || !newPatientForm.email.trim());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold" style={{ color: '#1e263e' }}>
          Пациент <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={onToggleNewPatientForm}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${showNewPatientForm ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          {showNewPatientForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showNewPatientForm ? 'Отмена' : 'Новый пациент'}
        </button>
      </div>

      {showNewPatientForm ? (
        <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Новый пациент</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Имя <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newPatientForm.first_name}
                onChange={e => onNewPatientFormChange(p => ({ ...p, first_name: e.target.value }))}
                placeholder="Имя"
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Фамилия <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newPatientForm.last_name}
                onChange={e => onNewPatientFormChange(p => ({ ...p, last_name: e.target.value }))}
                placeholder="Фамилия"
                className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Phone — must be verified via WhatsApp code before the patient can be created */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Телефон <span className="text-red-500">*</span></label>
              <PhoneVerificationField
                phone={newPatientForm.phone}
                onPhoneChange={(e164) => onNewPatientFormChange(p => ({ ...p, phone: e164 }))}
                status={phoneStatus}
                onSend={onSendPhoneCode}
                onVerify={onVerifyPhoneCode}
                onResend={onResendPhoneCode}
                otpError={phoneOtpError}
                onChangePhone={onChangePhone}
              />
            </div>

            {/* Email — optional, same Confirm/Skip pattern as self-registration */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <EmailVerificationField
                email={newPatientForm.email}
                onEmailChange={(value) => onNewPatientFormChange(p => ({ ...p, email: value }))}
                status={emailStatus}
                onSend={onSendEmailCode}
                onVerify={onVerifyEmailCode}
                onResend={onResendEmailCode}
                otpError={emailOtpError}
                onSkip={onSkipEmail}
                onChangeEmail={onChangeEmail}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Откуда узнал о клинике</label>
              <SearchSelect
                options={REFERRAL_SOURCE_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
                value={newPatientForm.referral_source}
                onChange={(v) => onNewPatientFormChange(p => ({ ...p, referral_source: v }))}
                placeholder="Не указано"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onCreatePatient}
            disabled={creatingPatient || !canSubmit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
          >
            {creatingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creatingPatient ? 'Создание...' : 'Создать и выбрать'}
          </button>
        </div>
      ) : (
        <SearchSelect
          options={patients.map(p => ({ id: p.id, label: `${p.first_name} ${p.last_name}`, subtitle: p.email }))}
          value={patientId}
          onChange={onPatientChange}
          placeholder="Выберите пациента..."
          required
        />
      )}

      {/* Patient info card */}
      {patientId && patient && (
        <div className="mt-3 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50/40">
          <div className="flex items-center gap-2 mb-2.5">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">Информация о пациенте</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {patient.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
            )}
            {patient.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.birth_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>{patient.birth_date}</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>{patient.gender === 'M' ? 'Мужчина' : patient.gender === 'F' ? 'Женщина' : patient.gender}</span>
              </div>
            )}
            {(patient.address || patient.city) && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>{[patient.address, patient.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {patient.clinic && (
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <Stethoscope className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>{patient.clinic.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
