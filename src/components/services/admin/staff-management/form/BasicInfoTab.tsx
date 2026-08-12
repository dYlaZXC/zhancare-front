"use client";

import { RefObject } from "react";
import {
  Mail, Lock, Calendar, MapPin, Globe, Award, ChevronDown, X,
  RefreshCw, Eye, EyeOff, Copy, Stethoscope, Heart, Plus, CheckCircle,
} from "lucide-react";
import PhoneInputUI from "@/components/ui/PhoneInput";
import SearchSelect from "../../schedule/components/SearchSelect";
import { ClinicLogo } from "../components/ClinicLogo";
import { ClinicSearchDropdown } from "../components/ClinicSearchDropdown";
import { SpecializationInput } from "../components/SpecializationInput";
import { LANGUAGES } from "../types/staffTypes";
import type { StaffFormData, StaffMember, Clinic } from "../types/staffTypes";

export function BasicInfoTab({
  mode,
  form,
  set,
  formErrors,
  validationKey,
  clearError,
  showPassword,
  onTogglePassword,
  onGeneratePassword,
  onCopyPassword,
  requirePasswordChange,
  onToggleRequirePasswordChange,
  isLanguageDropdownOpen,
  onToggleLanguageDropdown,
  languageDropdownRef,
  specializations,
  onSpecializationChange,
  onAddSpecialization,
  onRemoveSpecialization,
  isGlobalAdmin,
  clinics,
  user,
  initial,
}: {
  mode: "create" | "edit";
  form: StaffFormData;
  set: (k: keyof StaffFormData, v: any) => void;
  formErrors: Record<string, string>;
  validationKey: number;
  clearError: (field: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  onGeneratePassword: () => void;
  onCopyPassword: () => void;
  requirePasswordChange: boolean;
  onToggleRequirePasswordChange: () => void;
  isLanguageDropdownOpen: boolean;
  onToggleLanguageDropdown: () => void;
  languageDropdownRef: RefObject<HTMLDivElement>;
  specializations: string[];
  onSpecializationChange: (index: number, value: string) => void;
  onAddSpecialization: () => void;
  onRemoveSpecialization: (index: number) => void;
  isGlobalAdmin: boolean;
  clinics: Clinic[];
  user: any;
  initial: StaffMember | null;
}) {
  return (
    <>
      {/* Role Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Роль <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => set('role', 'doctor')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              form.role === 'doctor'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Stethoscope
              className={`w-8 h-8 mx-auto mb-2 ${
                form.role === 'doctor' ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            <p className="font-semibold text-gray-700">Доктор</p>
          </button>
          <button
            type="button"
            onClick={() => set('role', 'nurse')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              form.role === 'nurse'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Heart
              className={`w-8 h-8 mx-auto mb-2 ${
                form.role === 'nurse' ? 'text-purple-500' : 'text-gray-400'
              }`}
            />
            <p className="font-semibold text-gray-700">Медсестра</p>
          </button>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => { set('first_name', e.target.value); clearError('first_name'); }}
            className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.first_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
            placeholder="Введите имя"
          />
          {formErrors.first_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Фамилия <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => { set('last_name', e.target.value); clearError('last_name'); }}
            className={`w-full px-4 py-3 rounded-xl border-2 ${formErrors.last_name ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
            placeholder="Введите фамилию"
          />
          {formErrors.last_name && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={form.email}
            onChange={(e) => { set('email', e.target.value); clearError('email'); }}
            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${formErrors.email ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors`}
            placeholder="example@clinic.kz"
          />
        </div>
        {formErrors.email && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Телефон <span className="text-red-500">*</span>
        </label>
        <PhoneInputUI
          value={form.phone}
          onChange={(e164) => { set('phone', e164); clearError('phone'); }}
          placeholder="+7 (700) 123-45-67"
          error={formErrors.phone || undefined}
        />
      </div>

      {/* Password */}
      {mode === "create" ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Пароль <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={onGeneratePassword}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
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
              onChange={(e) => { set('password', e.target.value); clearError('password'); }}
              className={`w-full pl-12 pr-20 py-3 rounded-xl border-2 ${formErrors.password ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:outline-none transition-colors font-mono`}
              placeholder="Минимум 8 символов"
              minLength={8}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button
                type="button"
                onClick={onTogglePassword}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? "Скрыть" : "Показать"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onCopyPassword}
                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                title="Скопировать пароль"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          {formErrors.password && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.password}</p>}

          {/* Force password change checkbox */}
          <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none group">
            <div
              onClick={onToggleRequirePasswordChange}
              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                requirePasswordChange
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-300 group-hover:border-blue-400'
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
        </div>
      ) : (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Новый пароль <span className="text-gray-500 text-xs">(оставьте пустым, чтобы не менять)</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Оставьте пустым для сохранения текущего"
              minLength={8}
            />
          </div>
        </div>
      )}

      {/* Gender and Birth Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Пол
          </label>
          <SearchSelect
            options={[
              { id: 'male', label: 'Мужской' },
              { id: 'female', label: 'Женский' },
              { id: 'other', label: 'Другой' },
            ]}
            value={form.gender}
            onChange={(val) => set('gender', val as '' | 'male' | 'female' | 'other')}
            placeholder="Не указан"
          />
        </div>
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Address and City */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Адрес
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Улица, дом"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Город
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Например: Алматы"
          />
        </div>
      </div>

      {/* Language and Experience */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-600" />
            Языки
          </label>
          <div className="relative" ref={languageDropdownRef}>
            <div
              onClick={onToggleLanguageDropdown}
              className="min-h-[3rem] px-4 py-2 border-2 border-gray-200 rounded-2xl bg-white flex flex-wrap items-center gap-2 cursor-pointer hover:border-gray-300 transition-colors"
            >
              {form.language.length > 0 ? (
                form.language.map((langValue) => {
                  const lang = LANGUAGES.find(l => l.value === langValue);
                  if (!lang) return null;
                  return (
                    <div
                      key={lang.value}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{lang.emoji}</span>
                      <span>{lang.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          set('language', form.language.filter(l => l !== lang.value));
                        }}
                        className="ml-1 hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="text-gray-400 text-sm">Выберите языки...</span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isLanguageDropdownOpen && (
              <div className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {LANGUAGES.map((lang) => {
                  const isSelected = form.language.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          set('language', form.language.filter(l => l !== lang.value));
                        } else {
                          set('language', [...form.language, lang.value]);
                        }
                      }}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.emoji}</span>
                      <span className="flex-1 text-sm font-medium">{lang.label}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Опыт работы (лет)
          </label>
          <div className="relative">
            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              min="0"
              max="70"
              value={form.years_of_experience}
              onChange={(e) => set('years_of_experience', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Preferred Consultation Duration */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Длительность консультации <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            min="5"
            max="180"
            step="5"
            value={form.preferred_consultation_duration}
            onChange={(e) => set('preferred_consultation_duration', e.target.value)}
            className={`w-full pl-4 pr-16 py-3 rounded-xl border-2 ${
              formErrors.preferredConsultationDuration ? 'border-red-500' : 'border-gray-200'
            } focus:border-blue-500 focus:outline-none transition-colors`}
            placeholder="30"
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">минут</span>
        </div>
        {formErrors.preferredConsultationDuration && (
          <p className="text-xs text-red-500 mt-1">
            {formErrors.preferredConsultationDuration}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          💡 Рекомендуемая длительность одной консультации (5-180 минут)
        </p>
      </div>

      {/* Room Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Номер кабинета
        </label>
        <input
          type="text"
          value={form.room_number}
          onChange={(e) => set('room_number', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          placeholder="Например: 7B, 700, 7F-D"
          maxLength={20}
        />
      </div>

      {/* Specialization - Multiple inputs with + and - buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            Специализация
          </label>
          <button
            type="button"
            onClick={onAddSpecialization}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
        <div className="space-y-3">
          {specializations.map((spec, index) => (
            <SpecializationInput
              key={index}
              value={spec}
              index={index}
              onChange={onSpecializationChange}
              placeholder={form.role === 'doctor' ? 'Например: Кардиолог' : 'Например: Процедурная медсестра'}
              showRemove={specializations.length > 1}
              onRemove={onRemoveSpecialization}
            />
          ))}
        </div>
        {specializations.length > 0 && specializations.some(s => s.trim()) && (
          <p className="text-xs text-gray-500 mt-2">
            Добавлено специализаций: {specializations.filter(s => s.trim()).length}
          </p>
        )}
      </div>

      {/* Clinic Selection/Display */}
      {mode === "create" ? (
        isGlobalAdmin ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
            </label>
            <ClinicSearchDropdown
              clinics={clinics}
              value={form.clinic_id}
              onChange={(val) => { set('clinic_id', val); clearError('clinic_id'); }}
              hasError={!!formErrors.clinic_id}
            />
            {formErrors.clinic_id && <p key={validationKey} className="animate-shake text-red-500 text-xs mt-1">{formErrors.clinic_id}</p>}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span>💡</span> Глобальные администраторы могут назначить сотрудника в любую клинику
            </p>
          </div>
        ) : (user.clinic?.name || user.clinic_id) && (
          <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Клиника <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <ClinicLogo logo={user.clinic?.logo} name={user.clinic?.name} />
              <div>
                <p className="text-base font-bold text-gray-800">{user.clinic?.name || 'Ваша клиника'}</p>
                <p className="text-sm text-gray-600">Администратор клиники</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded-xl">
              <p className="text-sm text-blue-800 font-medium">
                ✓ Новый сотрудник будет автоматически назначен в вашу клинику
              </p>
            </div>
          </div>
        )
      ) : (
        isGlobalAdmin ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Клиника {clinics.length > 0 && <span className="text-red-500">*</span>}
            </label>
            <ClinicSearchDropdown
              clinics={clinics}
              value={form.clinic_id}
              onChange={(val) => { set('clinic_id', val); clearError('clinic_id'); }}
              hasError={!!formErrors.clinic_id}
            />
            {formErrors.clinic_id && <p className="text-red-500 text-xs mt-1">{formErrors.clinic_id}</p>}
          </div>
        ) : (initial?.clinic?.name || user.clinic?.name) && (
          <div className="rounded-2xl p-4 border-2 border-blue-100 bg-blue-50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Клиника
            </label>
            <div className="flex items-center gap-3">
              <ClinicLogo
                logo={initial?.clinic?.logo || user.clinic?.logo}
                name={initial?.clinic?.name || user.clinic?.name}
              />
              <div>
                <p className="text-base font-bold text-gray-800">
                  {initial?.clinic?.name || user.clinic?.name || 'Текущая клиника'}
                </p>
                <p className="text-sm text-gray-600">Клиника сотрудника</p>
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
}
