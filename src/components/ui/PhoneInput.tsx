"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Phone } from "lucide-react";
import { formatPhone, toE164 } from "@/utils/phoneFormat";

interface PhoneInputProps {
  value: string;                  // E.164 or raw — will be formatted for display
  onChange: (e164: string) => void; // always emits +7XXXXXXXXXX
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showIcon?: boolean;
  error?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}

const PhoneInput = memo(function PhoneInput({
  value,
  onChange,
  placeholder = "+7 (___) ___-__-__",
  className = "",
  inputClassName = "",
  showIcon = true,
  error,
  disabled = false,
  name,
  required,
}: PhoneInputProps) {
  const [display, setDisplay] = useState(() => formatPhone(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const prevDigits = useRef(value.replace(/\D/g, "").length);

  // Sync display when value changes externally (e.g. prefilled from profile)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDisplay(formatPhone(value));
      prevDigits.current = value.replace(/\D/g, "").length;
    }
  }, [value]);

  const emit = (formatted: string) => {
    onChange(toE164(formatted));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === "" || input === "+") {
      setDisplay("");
      prevDigits.current = 0;
      onChange("");
      return;
    }
    const digits = input.replace(/\D/g, "");
    const formatted = formatPhone(digits);
    setDisplay(formatted);
    prevDigits.current = formatted.replace(/\D/g, "").length;
    emit(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    const el = inputRef.current;
    if (!el) return;
    if ((el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)) return; // selection → default

    e.preventDefault();
    const digits = display.replace(/\D/g, "");
    if (!digits.length) return;
    const newDigits = digits.slice(0, -1);
    const formatted = newDigits ? formatPhone(newDigits) : "";
    setDisplay(formatted);
    prevDigits.current = newDigits.length;
    emit(formatted);
    requestAnimationFrame(() => {
      el.setSelectionRange(formatted.length, formatted.length);
    });
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
    <div className={className}>
      <div className="relative">
        {showIcon && (
          <Phone
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            size={18}
          />
        )}
        <input
          ref={inputRef}
          type="tel"
          name={name}
          required={required}
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={18}
          className={`w-full py-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 ${
            showIcon ? "pl-10 pr-4" : "px-4"
          } ${
            error
              ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
          } disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default PhoneInput;
