"use client";

import React from "react";

interface Props {
  formData: {
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    first_name: string;
    last_name: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  translations: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    registerButton: string;
  };
}

const RegisterForm: React.FC<Props> = ({ formData, onChange, onSubmit, loading, translations }) => {
  return (
    <form onSubmit={onSubmit} className="text-black mt-4 md:mt-6">
      <input
        name="last_name"
        type="text"
        autoFocus
        placeholder={translations.lastName}
        value={formData.last_name}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <input
        name="first_name"
        type="text"
        placeholder={translations.firstName}
        value={formData.first_name}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <input
        name="email"
        type="email"
        placeholder={translations.email}
        value={formData.email}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <input
        name="phone"
        type="tel"
        placeholder={translations.phone}
        value={formData.phone}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder={translations.password}
        value={formData.password}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
        autoComplete="new-password"
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder={translations.confirmPassword}
        value={formData.confirmPassword}
        onChange={onChange}
        className="w-full px-4 py-3 md:py-4 rounded-lg mb-3 bg-gray-100 border border-gray-300 focus:outline-none"
        required
      />
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white py-3 md:py-4 rounded-lg font-medium hover:opacity-85 transition flex justify-center items-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          translations.registerButton
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
