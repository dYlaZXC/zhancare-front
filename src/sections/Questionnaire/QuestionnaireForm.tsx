"use client";

import { useState } from "react";
import { api } from "@/utils/api";

interface QuestionnaireFormProps {
  onSuccess?: (data: { email: string; message: string }) => void;
}

export const QuestionnaireForm = ({ onSuccess }: QuestionnaireFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    sugar_level: "",
    systolic_pressure: "",
    diastolic_pressure: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validate
    if (!formData.email || !formData.sugar_level || !formData.systolic_pressure || !formData.diastolic_pressure) {
      setError("Пожалуйста, заполните все поля");
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введите корректный email адрес");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/questionnaire/submit/", {
        email: formData.email,
        sugar_level: parseFloat(formData.sugar_level),
        systolic_pressure: parseInt(formData.systolic_pressure),
        diastolic_pressure: parseInt(formData.diastolic_pressure),
      });

      setSuccess("Аккаунт создан! Проверьте вашу почту для получения пароля.");

      if (onSuccess) {
        onSuccess({
          email: formData.email,
          message: response.data.message,
        });
      }

      // Clear form
      setFormData({
        email: "",
        sugar_level: "",
        systolic_pressure: "",
        diastolic_pressure: "",
      });
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.email) {
        setError("Пользователь с таким email уже существует");
      } else {
        setError("Произошла ошибка. Попробуйте позже.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email адрес
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@mail.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
            required
          />
        </div>

        {/* Sugar Level Field */}
        <div>
          <label htmlFor="sugar_level" className="block text-sm font-semibold text-gray-700 mb-2">
            Показатель сахара (ммоль/л)
          </label>
          <input
            type="number"
            id="sugar_level"
            name="sugar_level"
            value={formData.sugar_level}
            onChange={handleChange}
            placeholder="5.5"
            step="0.1"
            min="0"
            max="50"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Норма: 3.9 - 5.5 ммоль/л натощак</p>
        </div>

        {/* Blood Pressure Fields */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Артериальное давление (мм рт. ст.)
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              id="systolic_pressure"
              name="systolic_pressure"
              value={formData.systolic_pressure}
              onChange={handleChange}
              placeholder="120"
              min="60"
              max="250"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
              required
            />
            <span className="text-gray-500 font-bold text-xl">/</span>
            <input
              type="number"
              id="diastolic_pressure"
              name="diastolic_pressure"
              value={formData.diastolic_pressure}
              onChange={handleChange}
              placeholder="80"
              min="40"
              max="150"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Норма: 120/80 мм рт. ст.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: isLoading
              ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
              : "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
            boxShadow: isLoading ? "none" : "0 4px 15px rgba(55, 114, 255, 0.3)",
          }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Отправка...
            </span>
          ) : (
            "Отправить и создать аккаунт"
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          После отправки формы на ваш email будет отправлен пароль для входа в личный кабинет
        </p>
      </form>
    </div>
  );
};

export default QuestionnaireForm;
