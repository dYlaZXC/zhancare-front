"use client";

import { memo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { formatPhone, toE164 } from "@/utils/phoneFormat";

interface PhoneAuthInputProps {
  name: string;
  placeholder: string;
  value: string;       // may be E.164 or raw; formatted for display
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // emits E.164 in e.target.value
  validationError?: string;
  loading?: boolean;
}

const PhoneAuthInput = memo(function PhoneAuthInput({
  name,
  placeholder,
  value,
  autoComplete,
  onChange,
  validationError,
  loading = false,
}: PhoneAuthInputProps) {
  const [display, setDisplay] = useState(() => formatPhone(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const prevDigits = useRef(value.replace(/\D/g, "").length);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDisplay(formatPhone(value));
      prevDigits.current = value.replace(/\D/g, "").length;
    }
  }, [value]);

  const emit = (formatted: string) => {
    const e164 = toE164(formatted);
    const syntheticEvent = {
      target: { name, value: e164 },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === "" || input === "+") {
      setDisplay("");
      prevDigits.current = 0;
      emit("");
      return;
    }
    const digits = input.replace(/\D/g, "");
    const currentCount = digits.length;
    const formatted = formatPhone(digits);
    setDisplay(formatted);
    prevDigits.current = currentCount;
    emit(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    const el = inputRef.current;
    if (!el) return;
    if ((el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)) return;

    e.preventDefault();
    const digits = display.replace(/\D/g, "");
    if (!digits.length) return;
    const newDigits = digits.slice(0, -1);
    const formatted = newDigits ? formatPhone(newDigits) : "";
    setDisplay(formatted);
    prevDigits.current = newDigits.length;
    emit(formatted);
    setTimeout(() => {
      el.setSelectionRange(formatted.length, formatted.length);
    }, 0);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const formatted = formatPhone(pasted);
    setDisplay(formatted);
    prevDigits.current = formatted.replace(/\D/g, "").length;
    emit(formatted);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Phone className={`w-5 h-5 transition-colors duration-200 ${
            display ? "text-[#3772ff]" : "text-gray-400 group-focus-within:text-[#3267e6]"
          }`} />
        </div>

        <input
          ref={inputRef}
          type="tel"
          name={name}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={18}
          disabled={loading}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm ${
            validationError
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : display
              ? "border-[#c1d3ff] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff]"
              : "border-[#e8e8e8] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff] hover:border-[#dddddd]"
          } placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 ${
          display ? "opacity-0 group-focus-within:opacity-100" : "opacity-0"
        }`}>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3772ff]/10 to-[#2956bf]/10" />
        </div>
      </div>

      {validationError && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 ml-1 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          {validationError}
        </motion.p>
      )}
    </div>
  );
});

export default PhoneAuthInput;
