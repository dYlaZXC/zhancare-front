"use client";

import { useState, useCallback, FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, User, Lock, Loader2, Shield } from "lucide-react";
import AuthInput from "./AuthInput";
import PhoneAuthInput from "./PhoneAuthInput";
import PdfViewerModal from "../PdfViewerModal";

interface RegisterFormProps {
  translations: any;
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading: boolean;
  language?: string;
}

export interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  consentPersonalData: boolean;
  consentInformAgreement: boolean;
  consentOffer: boolean;
}

const RegisterForm = ({ translations, onSubmit, loading, language = "en" }: RegisterFormProps) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    consentPersonalData: false,
    consentInformAgreement: false,
    consentOffer: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterFormData>>({});

  // PDF Modal state
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });

  // Helper function to get PDF path based on language
  const getPdfPath = (docType: string) => {
    const langSuffix = language === "ru" ? "rus" : language === "kz" ? "kaz" : "eng";
    return `/docs/${docType}_${langSuffix}.pdf`;
  };

  // Helper function to open PDF modal
  const openPdfModal = (docType: string, title: string) => {
    setPdfModal({
      isOpen: true,
      url: getPdfPath(docType),
      title,
    });
  };

  // Helper function to close PDF modal
  const closePdfModal = () => {
    setPdfModal({
      isOpen: false,
      url: "",
      title: "",
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = useCallback((): boolean => {
    const errors: Partial<RegisterFormData> = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "Имя обязательно";
    }

    if (!formData.last_name.trim()) {
      errors.last_name = "Фамилия обязательна";
    }

    if (!formData.email || !validateEmail(formData.email)) {
      errors.email = "Введите корректный email адрес";
    }

    if (!formData.password || !validatePassword(formData.password)) {
      errors.password = "Пароль должен содержать минимум 8 символов";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
    }

    if (!formData.consentPersonalData) {
      errors.consentPersonalData = "Обязательное согласие" as any;
    }

    if (!formData.consentInformAgreement) {
      errors.consentInformAgreement = "Обязательное согласие" as any;
    }

    if (!formData.consentOffer) {
      errors.consentOffer = "Обязательное согласие" as any;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));

    // Clear error when user checks the checkbox
    if (validationErrors[name as keyof RegisterFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          name="first_name"
          placeholder={translations.firstName}
          icon={User}
          value={formData.first_name}
          autoComplete="given-name"
          onChange={handleChange}
          validationError={validationErrors.first_name}
          loading={loading}
        />
        <AuthInput
          name="last_name"
          placeholder={translations.lastName}
          icon={User}
          value={formData.last_name}
          autoComplete="family-name"
          onChange={handleChange}
          validationError={validationErrors.last_name}
          loading={loading}
        />
      </div>

      {/* Email */}
      <AuthInput
        name="email"
        type="email"
        placeholder={translations.email}
        icon={Mail}
        value={formData.email}
        autoComplete="email"
        onChange={handleChange}
        validationError={validationErrors.email}
        loading={loading}
      />

      {/* Phone */}
      <PhoneAuthInput
        name="phone"
        placeholder={translations.phone}
        value={formData.phone}
        autoComplete="tel"
        onChange={handleChange}
        validationError={validationErrors.phone}
        loading={loading}
      />

      {/* Password */}
      <AuthInput
        name="password"
        placeholder={translations.password}
        icon={Lock}
        value={formData.password}
        autoComplete="new-password"
        showPasswordToggle
        onChange={handleChange}
        validationError={validationErrors.password}
        loading={loading}
        showPassword={showPassword}
        onTogglePassword={() => setShowPassword(prev => !prev)}
      />

      {/* Confirm Password */}
      <AuthInput
        name="confirmPassword"
        placeholder={translations.confirmPassword}
        icon={Lock}
        value={formData.confirmPassword}
        autoComplete="new-password"
        showPasswordToggle
        onChange={handleChange}
        validationError={validationErrors.confirmPassword}
        loading={loading}
        showPassword={showConfirmPassword}
        onTogglePassword={() => setShowConfirmPassword(prev => !prev)}
      />

      {/* Consent Checkboxes */}
      <div className="space-y-3 mt-2">
        {/* Personal Data Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentPersonalData"
            name="consentPersonalData"
            checked={formData.consentPersonalData}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentPersonalData" className="text-sm text-gray-300 leading-tight cursor-pointer">
            {translations.consentPersonalData}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("consent_to_the_collection_of_personal_data", translations.consentPersonalDataLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentPersonalDataLink}
            </button>
          </label>
        </div>
        {validationErrors.consentPersonalData && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentPersonalData}</p>
        )}

        {/* Informed Agreement Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentInformAgreement"
            name="consentInformAgreement"
            checked={formData.consentInformAgreement}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentInformAgreement" className="text-sm text-gray-300 leading-tight cursor-pointer">
            {translations.consentInformAgreement}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("inform_aggrement", translations.consentInformAgreementLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentInformAgreementLink}
            </button>
          </label>
        </div>
        {validationErrors.consentInformAgreement && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentInformAgreement}</p>
        )}

        {/* Offer Consent */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="consentOffer"
            name="consentOffer"
            checked={formData.consentOffer}
            onChange={handleCheckboxChange}
            disabled={loading}
            className="mt-1 w-4 h-4 text-[#3772ff] bg-white/5 border-gray-300 rounded focus:ring-[#3772ff] focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="consentOffer" className="text-sm text-gray-300 leading-tight cursor-pointer">
            {translations.consentOffer}{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPdfModal("offer", translations.consentOfferLink);
              }}
              className="text-[#3772ff] hover:text-[#3267e6] underline focus:outline-none"
            >
              {translations.consentOfferLink}
            </button>
          </label>
        </div>
        {validationErrors.consentOffer && (
          <p className="text-red-500 text-xs ml-6">{validationErrors.consentOffer}</p>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="relative w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] hover:from-[#3267e6] hover:to-[#214499] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3772ff]/30 hover:shadow-xl hover:shadow-[#3772ff]/40 flex items-center justify-center gap-2.5 group overflow-hidden"
      >
        <span className="relative z-10 text-base sm:text-lg flex items-center gap-2.5">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {translations.registerButton}
            </>
          )}
        </span>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </motion.button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-500">
        <Shield className="w-4 h-4 text-green-600" />
        <span>Защищенное соединение 256-bit SSL</span>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={closePdfModal}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </form>
  );
};

export default RegisterForm;
