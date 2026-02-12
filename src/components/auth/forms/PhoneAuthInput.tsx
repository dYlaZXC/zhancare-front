"use client";

import { memo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";

interface PhoneAuthInputProps {
  name: string;
  placeholder: string;
  value: string;
  autoComplete?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationError?: string;
  loading?: boolean;
}

// Phone number formatter utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters except '+'
  const cleaned = value.replace(/[^\d+]/g, '');

  // Extract only digits for formatting
  let digits = cleaned.replace(/\D/g, '');

  // If empty or just one digit, return as is with +
  if (!digits) return '';
  if (digits.length === 1) return '+' + digits;

  // Convert Kazakhstan 8 to 7 (8XXXXXXXXXX -> 7XXXXXXXXXX)
  // This handles cases like 87758249686 -> 77758249686
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.substring(1);
  }

  // Format: +X (XXX) XXX XX XX
  let formatted = '+' + digits[0];

  // Add area code in parentheses (only if we have at least 2 digits)
  if (digits.length >= 2) {
    formatted += ' (' + digits.substring(1, Math.min(4, digits.length));

    // Close parentheses only if we have 4+ digits
    if (digits.length >= 4) {
      formatted += ')';
    }
  }

  // Add first part (digits 5-7)
  if (digits.length >= 5) {
    formatted += ' ' + digits.substring(4, Math.min(7, digits.length));
  }

  // Add second part (digits 8-9)
  if (digits.length >= 8) {
    formatted += ' ' + digits.substring(7, Math.min(9, digits.length));
  }

  // Add third part (digits 10-11)
  if (digits.length >= 10) {
    formatted += ' ' + digits.substring(9, Math.min(11, digits.length));
  }

  return formatted;
};

const PhoneAuthInput = memo(function PhoneAuthInput({
  name,
  placeholder,
  value,
  autoComplete,
  onChange,
  validationError,
  loading = false,
}: PhoneAuthInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousDigitCount = useRef<number>(0);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
      previousDigitCount.current = value.replace(/\D/g, '').length;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (!inputRef.current) return;

      const cursorPos = inputRef.current.selectionStart || 0;
      const cursorEnd = inputRef.current.selectionEnd || 0;
      const value = inputRef.current.value;

      // If text is selected, let default behavior handle it
      if (cursorPos !== cursorEnd) {
        return;
      }

      // Prevent default and handle deletion manually
      e.preventDefault();

      const digits = value.replace(/\D/g, '');

      if (digits.length === 0) {
        return; // Nothing to delete
      }

      // Remove the last digit
      const newDigits = digits.slice(0, -1);
      const formatted = newDigits ? formatPhoneNumber(newDigits) : '';

      setLocalValue(formatted);
      previousDigitCount.current = newDigits.length;

      // Create a synthetic event for onChange
      const syntheticEvent = {
        target: { name, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>;
      requestAnimationFrame(() => onChange(syntheticEvent));

      // Set cursor to end
      setTimeout(() => {
        if (inputRef.current) {
          const newLength = formatted.length;
          inputRef.current.setSelectionRange(newLength, newLength);
        }
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // If user cleared the input completely, allow it
    if (input === '' || input === '+') {
      setLocalValue('');
      previousDigitCount.current = 0;
      const syntheticEvent = {
        target: { name, value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      requestAnimationFrame(() => onChange(syntheticEvent));
      return;
    }

    // Get current digit count
    const currentDigits = input.replace(/\D/g, '');
    const currentDigitCount = currentDigits.length;

    // If user is deleting (digit count decreased), handle it properly
    if (currentDigitCount < previousDigitCount.current) {
      const formatted = formatPhoneNumber(currentDigits);
      setLocalValue(formatted);
      previousDigitCount.current = currentDigitCount;
      const syntheticEvent = {
        target: { name, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>;
      requestAnimationFrame(() => onChange(syntheticEvent));
      return;
    }

    // Otherwise, format normally
    const formatted = formatPhoneNumber(input);
    setLocalValue(formatted);
    previousDigitCount.current = formatted.replace(/\D/g, '').length;
    const syntheticEvent = {
      target: { name, value: formatted },
    } as React.ChangeEvent<HTMLInputElement>;
    requestAnimationFrame(() => onChange(syntheticEvent));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatPhoneNumber(pastedText);
    setLocalValue(formatted);
    previousDigitCount.current = formatted.replace(/\D/g, '').length;
    const syntheticEvent = {
      target: { name, value: formatted },
    } as React.ChangeEvent<HTMLInputElement>;
    requestAnimationFrame(() => onChange(syntheticEvent));
  };

  return (
    <div className="space-y-1.5">
      <div className="relative group">
        {/* Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Phone className={`w-5 h-5 transition-colors duration-200 ${
            localValue ? 'text-[#3772ff]' : 'text-gray-400 group-focus-within:text-[#3267e6]'
          }`} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="tel"
          name={name}
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={18} // +X (XXX) XXX XX XX = 18 characters
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm ${
            validationError
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
              : localValue
              ? 'border-[#c1d3ff] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff]'
              : 'border-[#e8e8e8] focus:border-[#3772ff] focus:ring-4 focus:ring-[#ebf1ff] hover:border-[#dddddd]'
          } placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={loading}
        />

        {/* Focus Indicator */}
        <div className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200 ${
          localValue ? 'opacity-0 group-focus-within:opacity-100' : 'opacity-0'
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

export default PhoneAuthInput;
