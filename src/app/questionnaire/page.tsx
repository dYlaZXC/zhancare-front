"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logosaas.png";
import { api } from "@/utils/api";

export default function QuestionnairePage() {
  const [formData, setFormData] = useState({
    email: "",
    sugar_level: "",
    systolic_pressure: "",
    diastolic_pressure: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.email || !formData.sugar_level || !formData.systolic_pressure || !formData.diastolic_pressure) {
      setError("Пожалуйста, заполните все поля");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Введите корректный email адрес");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/questionnaire/submit/", {
        email: formData.email,
        sugar_level: parseFloat(formData.sugar_level),
        systolic_pressure: parseInt(formData.systolic_pressure),
        diastolic_pressure: parseInt(formData.diastolic_pressure),
      });

      setAccountCreated(true);
      setCreatedEmail(formData.email);
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#fafbfc" }}>
      {/* Notebook Grid Background - Тетрадь в клетку */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(55, 114, 255, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(55, 114, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(55, 114, 255, 0.04), transparent 50%), radial-gradient(ellipse at bottom left, rgba(41, 53, 143, 0.03), transparent 50%)",
        }}
      />

      {/* Header */}
      <header className="relative z-20 w-full py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="group">
            <div
              className="p-4 rounded-2xl transition-all duration-200 group-hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #1a1f36 0%, #29358f 100%)",
                boxShadow: "0 6px 20px rgba(26, 31, 54, 0.3)",
              }}
            >
              <Image
                src={Logo}
                alt="ZhanCare"
                width={80}
                height={80}
              />
            </div>
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md"
            style={{
              color: "#3772ff",
              background: "rgba(55, 114, 255, 0.08)",
              border: "1px solid rgba(55, 114, 255, 0.15)",
            }}
          >
            Войти
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-xl">
          {/* Main Card - Notebook Style */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(55, 114, 255, 0.12), 0 0 0 1px rgba(55, 114, 255, 0.05)",
            }}
          >
            {/* Top accent */}
            <div
              className="h-1"
              style={{ background: "linear-gradient(90deg, #3772ff, #29358f)" }}
            />

            <div className="p-8 md:p-12">
              {!accountCreated ? (
                <>
                  {/* Header Section */}
                  <div className="text-center mb-10">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                      style={{
                        background: "rgba(55, 114, 255, 0.08)",
                        color: "#3772ff",
                        border: "1px solid rgba(55, 114, 255, 0.12)",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3772ff" }} />
                      Быстрая регистрация
                    </div>

                    <h1
                      className="text-3xl md:text-4xl font-bold mb-4"
                      style={{ color: "#1a1f36", letterSpacing: "-0.02em" }}
                    >
                      Анкета здоровья
                    </h1>

                    <p className="text-base" style={{ color: "#64748b", maxWidth: "380px", margin: "0 auto" }}>
                      Заполните данные для создания аккаунта и получения персональных рекомендаций
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#374151" }}>
                        <svg className="w-4 h-4" style={{ color: "#3772ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email адрес
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#1a1f36",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3772ff";
                          e.target.style.boxShadow = "0 0 0 3px rgba(55, 114, 255, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.boxShadow = "none";
                        }}
                        required
                      />
                    </div>

                    {/* Sugar Level */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#374151" }}>
                        <svg className="w-4 h-4" style={{ color: "#3772ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Показатель сахара
                        <span className="text-xs font-normal" style={{ color: "#94a3b8" }}>(ммоль/л)</span>
                      </label>
                      <input
                        type="number"
                        name="sugar_level"
                        value={formData.sugar_level}
                        onChange={handleChange}
                        placeholder="5.5"
                        step="0.1"
                        min="0"
                        max="50"
                        className="w-full px-4 py-3.5 rounded-xl text-base outline-none transition-all duration-200"
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          color: "#1a1f36",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#3772ff";
                          e.target.style.boxShadow = "0 0 0 3px rgba(55, 114, 255, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.boxShadow = "none";
                        }}
                        required
                      />
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                        Норма: 3.9 - 5.5 ммоль/л натощак
                      </p>
                    </div>

                    {/* Blood Pressure */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#374151" }}>
                        <svg className="w-4 h-4" style={{ color: "#3772ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Артериальное давление
                        <span className="text-xs font-normal" style={{ color: "#94a3b8" }}>(мм рт. ст.)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="block text-xs font-medium mb-1.5 text-center" style={{ color: "#64748b" }}>
                            Верхнее
                          </span>
                          <input
                            type="number"
                            name="systolic_pressure"
                            value={formData.systolic_pressure}
                            onChange={handleChange}
                            placeholder="120"
                            min="60"
                            max="250"
                            className="w-full px-4 py-3.5 rounded-xl text-base text-center outline-none transition-all duration-200"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#1a1f36",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#3772ff";
                              e.target.style.boxShadow = "0 0 0 3px rgba(55, 114, 255, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.boxShadow = "none";
                            }}
                            required
                          />
                        </div>
                        <span className="text-2xl font-light mt-6" style={{ color: "#cbd5e1" }}>/</span>
                        <div className="flex-1">
                          <span className="block text-xs font-medium mb-1.5 text-center" style={{ color: "#64748b" }}>
                            Нижнее
                          </span>
                          <input
                            type="number"
                            name="diastolic_pressure"
                            value={formData.diastolic_pressure}
                            onChange={handleChange}
                            placeholder="80"
                            min="40"
                            max="150"
                            className="w-full px-4 py-3.5 rounded-xl text-base text-center outline-none transition-all duration-200"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#1a1f36",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#3772ff";
                              e.target.style.boxShadow = "0 0 0 3px rgba(55, 114, 255, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              e.target.style.boxShadow = "none";
                            }}
                            required
                          />
                        </div>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                        Норма: 120/80 мм рт. ст.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                        style={{
                          background: "rgba(239, 68, 68, 0.08)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          color: "#dc2626",
                        }}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white text-base transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: isLoading
                          ? "linear-gradient(135deg, #94a3b8, #64748b)"
                          : "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                        boxShadow: isLoading
                          ? "none"
                          : "0 4px 14px rgba(55, 114, 255, 0.35), 0 0 0 1px rgba(55, 114, 255, 0.1)",
                      }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Создание аккаунта...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Создать аккаунт
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      )}
                    </button>

                    <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
                      После отправки на ваш email будет отправлен пароль для входа
                    </p>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="text-center py-6">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(34, 197, 94, 0.1)" }}
                  >
                    <svg className="w-10 h-10" style={{ color: "#22c55e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-bold mb-3" style={{ color: "#1a1f36" }}>
                    Аккаунт создан!
                  </h2>

                  <p className="text-base mb-8" style={{ color: "#64748b" }}>
                    На адрес <span className="font-semibold" style={{ color: "#3772ff" }}>{createdEmail}</span> отправлено письмо с паролем
                  </p>

                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                        boxShadow: "0 4px 14px rgba(55, 114, 255, 0.35)",
                      }}
                    >
                      Перейти на страницу входа
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => {
                        setAccountCreated(false);
                        setCreatedEmail("");
                        setFormData({ email: "", sugar_level: "", systolic_pressure: "", diastolic_pressure: "" });
                      }}
                      className="w-full py-3.5 px-6 rounded-xl font-medium transition-all duration-200"
                      style={{
                        color: "#64748b",
                        background: "transparent",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Заполнить ещё одну анкету
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Ваши данные защищены и используются только для предоставления медицинских рекомендаций
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                <svg className="w-4 h-4" style={{ color: "#22c55e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SSL защита
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                <svg className="w-4 h-4" style={{ color: "#3772ff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Конфиденциально
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
