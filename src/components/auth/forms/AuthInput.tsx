"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, LucideIcon } from "lucide-react";

interface AuthInputProps {
  name: string;
  type?: string;
  placeholder: string;
  icon: LucideIcon;
  value: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationError?: string;
  loading?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const AuthInput = memo(function AuthInput({
  name,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  autoComplete,
  showPasswordToggle = false,
  onChange,
  validationError,
  loading = false,
  showPassword = false,
  onTogglePassword
}: AuthInputProps) {
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <div className="relative group">
        {/* Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Icon className={`w-5 h-5 transition-colors duration-200 ${
            value ? 'text-[#3772ff]' : 'text-gray-400 group-focus-within:text-[#3267e6]'
          }`} />
        </div>

        {/* Input Field */}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full pl-12 pr-${showPasswordToggle ? '12' : '4'} py-3.5 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm ${
            validationError
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : value
              ? 'border-[#c1d3ff] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff]'
              : 'border-[#e8e8e8] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff] hover:border-[#dddddd]'
          } placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading}
        />

        {/* Password Toggle */}
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3772ff]"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-500" />
            ) : (
              <Eye className="w-5 h-5 text-gray-500" />
            )}
          </button>
        )}

        {/* Focus Indicator */}
        <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 ${
          value ? 'opacity-0 group-focus-within:opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3772ff]/10 to-[#2956bf]/10"></div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 ml-1 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          {validationError}
        </motion.p>
      )}
    </div>
  );
});

export default AuthInput;
