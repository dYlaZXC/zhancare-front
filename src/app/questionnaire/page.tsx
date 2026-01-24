"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logosaas.png";
import { QuestionnaireForm } from "@/sections/Questionnaire/QuestionnaireForm";

export default function QuestionnairePage() {
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");

  const handleSuccess = (data: { email: string; message: string }) => {
    setAccountCreated(true);
    setCreatedEmail(data.email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="w-full py-4 px-6 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src={Logo} alt="ZhanCare" width={40} height={40} />
            <span className="text-xl font-bold text-gray-800">ZhanCare</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Войти
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
            {!accountCreated ? (
              <>
                {/* Title */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                       style={{ background: "linear-gradient(135deg, #3772ff 0%, #29358f 100%)" }}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Анкета здоровья
                  </h1>
                  <p className="text-gray-600">
                    Заполните форму для создания аккаунта и получения персональных рекомендаций
                  </p>
                </div>

                {/* Form */}
                <QuestionnaireForm onSuccess={handleSuccess} />
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Аккаунт успешно создан!
                </h2>
                <p className="text-gray-600 mb-6">
                  На адрес <span className="font-semibold text-blue-600">{createdEmail}</span> отправлено письмо с паролем для входа
                </p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full py-3 px-6 rounded-xl font-semibold text-white text-center transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, #3772ff 0%, #29358f 100%)",
                      boxShadow: "0 4px 15px rgba(55, 114, 255, 0.3)",
                    }}
                  >
                    Перейти на страницу входа
                  </Link>
                  <button
                    onClick={() => {
                      setAccountCreated(false);
                      setCreatedEmail("");
                    }}
                    className="block w-full py-3 px-6 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Заполнить ещё одну анкету
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Ваши данные защищены и используются только для предоставления медицинских рекомендаций
          </p>
        </div>
      </main>
    </div>
  );
}
