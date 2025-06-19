"use client";

import React from "react";

interface Props {
  formData: {
    email: string;
    password: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  translations: {
    email: string;
    password: string;
    loginButton: string;
    forgotPassword: string;
  };
  onForgotPassword?: () => void; // optional if you implement password reset
}

const LoginForm: React.FC<Props> = ({ formData, onChange, onSubmit, loading, translations, onForgotPassword }) => {
  return (
    <form onSubmit={onSubmit} className="text-black mt-4 md:mt-6">
      <input
        name="email"
        type="email"
        placeholder={translations.email}
        value={formData.email}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="email"
      />
      <input
        name="password"
        type="password"
        placeholder={translations.password}
        value={formData.password}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="current-password"
      />

      <div className="text-right text-sm mb-4">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-gray-500 hover:underline"
        >
          {translations.forgotPassword}
        </button>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 md:py-4 rounded-lg font-medium hover:opacity-85 transition flex justify-center items-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          translations.loginButton
        )}
      </button>
    </form>
  );
};

export default LoginForm;
