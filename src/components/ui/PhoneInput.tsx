"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, X } from "lucide-react";
import {
  AsYouType,
  CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/min";
import {
  featuredCountries,
  allCountries,
  everyCountry,
  findCountryByIso2,
  toFlagEmoji,
  Country,
} from "@/data/countries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initialCountry(e164: string, defaultIso2: string): Country {
  if (e164) {
    const parsed = parsePhoneNumberFromString(e164);
    if (parsed?.country) {
      const found = findCountryByIso2(parsed.country);
      if (found) return found;
    }
  }
  return findCountryByIso2(defaultIso2) ?? everyCountry[0];
}

function initialDigits(e164: string): string {
  if (!e164) return "";
  const parsed = parsePhoneNumberFromString(e164);
  return parsed?.nationalNumber ?? "";
}

function formatNational(digits: string, iso2: string): string {
  if (!digits) return "";
  try {
    const code = getCountryCallingCode(iso2 as CountryCode);
    const full = `+${code}${digits}`;
    const ayt = new AsYouType(iso2 as CountryCode);
    const formatted = ayt.input(full);
    // Strip leading "+XX " or "+XXX " to show only national part
    const prefix = `+${code} `;
    return formatted.startsWith(prefix) ? formatted.slice(prefix.length) : formatted;
  } catch {
    return digits;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  /** Kept for backwards-compat — ignored; country flag replaces the icon */
  showIcon?: boolean;
  name?: string;
  required?: boolean;
  /** Fired on blur with validity */
  onValidate?: (valid: boolean) => void;
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = "KZ",
  disabled = false,
  error,
  className = "",
  inputClassName = "",
  placeholder = "707 123 45 67",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showIcon: _showIcon,
  name,
  required,
  onValidate,
}: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(() =>
    initialCountry(value, defaultCountry)
  );
  const [digits, setDigits] = useState<string>(() => initialDigits(value));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [blurred, setBlurred] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const internalChange = useRef(false);

  // Sync from outside (e.g. form reset / prefill)
  useEffect(() => {
    if (internalChange.current) { internalChange.current = false; return; }
    setCountry(initialCountry(value, defaultCountry));
    setDigits(initialDigits(value));
  }, [value, defaultCountry]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60);
  }, [open]);

  const displayValue = useMemo(
    () => formatNational(digits, country.iso2),
    [digits, country.iso2]
  );

  // Probe national-only digits (no dial prefix) to find the country's max length.
  // Using national-only avoids +7 ambiguity between KZ and RU.
  const maxNationalDigits = useMemo(() => {
    try {
      for (let len = 15; len >= 4; len--) {
        const r = validatePhoneNumberLength("9".repeat(len), country.iso2 as CountryCode);
        if (r !== "TOO_LONG") return len;
      }
    } catch { /* ignore */ }
    return 15;
  }, [country.iso2]);

  const internalError = useMemo(() => {
    if (!digits) return null;
    // Use national-only validation to avoid +7 ambiguity
    const lengthResult = validatePhoneNumberLength(digits, country.iso2 as CountryCode);
    if (!blurred) return null;
    if (lengthResult === "TOO_SHORT") return "Номер слишком короткий";
    if (lengthResult) return "Некорректный номер телефона";
    try {
      const code = getCountryCallingCode(country.iso2 as CountryCode);
      const parsed = parsePhoneNumberFromString(`+${code}${digits}`, country.iso2 as CountryCode);
      if (!parsed || !parsed.isValid()) return "Введите корректный номер телефона";
    } catch { return "Введите корректный номер телефона"; }
    return null;
  }, [digits, country.iso2, blurred]);

  const isValidNumber = useMemo(() => {
    if (!digits) return false;
    try {
      const code = getCountryCallingCode(country.iso2 as CountryCode);
      const parsed = parsePhoneNumberFromString(`+${code}${digits}`, country.iso2 as CountryCode);
      return parsed?.isValid() ?? false;
    } catch { return false; }
  }, [digits, country.iso2]);

  const activeError = error ?? internalError;

  const emit = (newDigits: string, iso2: string) => {
    internalChange.current = true;
    if (!newDigits) { onChange(""); return; }
    try {
      const code = getCountryCallingCode(iso2 as CountryCode);
      onChange(`+${code}${newDigits}`);
    } catch { onChange(""); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDigits = e.target.value.replace(/\D/g, "");
    // Hard cap: never accept more digits than the country's maximum
    if (newDigits.length > maxNationalDigits) return;
    setDigits(newDigits);
    emit(newDigits, country.iso2);
    // Live validation: trigger immediately when field reaches max length
    if (newDigits.length === maxNationalDigits) {
      setBlurred(true);
    } else if (newDigits.length < digits.length) {
      // Clear blur state when user deletes back so errors disappear
      setBlurred(false);
    }
  };

  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    emit(digits, c.iso2);
  };

  const handleBlur = () => {
    setBlurred(true);
    if (!onValidate) return;
    if (!digits) { onValidate(false); return; }
    try {
      const code = getCountryCallingCode(country.iso2 as CountryCode);
      const parsed = parsePhoneNumberFromString(`+${code}${digits}`, country.iso2 as CountryCode);
      onValidate(parsed?.isValid() ?? false);
    } catch { onValidate(false); }
  };

  // Filtered dropdown list
  const filteredFeatured = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return featuredCountries;
    return featuredCountries.filter(
      (c) =>
        c.nameRu.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase() === q
    );
  }, [search]);

  const filteredAll = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allCountries;
    return allCountries.filter(
      (c) =>
        c.nameRu.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase() === q
    );
  }, [search]);

  const hasResults = filteredFeatured.length + filteredAll.length > 0;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <div className="flex">
        {/* ── Country button ── */}
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={`flex items-center gap-1.5 shrink-0 px-3 py-2.5 border border-r-0 rounded-l-xl bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeError
              ? "border-red-300"
              : isValidNumber && !open
              ? "border-green-400 bg-green-50/40"
              : open
              ? "border-blue-400 bg-blue-50/60"
              : "border-gray-200"
          }`}
        >
          <span className="text-base leading-none">{toFlagEmoji(country.iso2)}</span>
          <span className="text-sm font-medium text-gray-600 font-mono tabular-nums">
            {country.dialCode}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* ── Number input ── */}
        <div className="relative flex-1 min-w-0">
          <input
            type="tel"
            name={name}
            required={required}
            value={displayValue}
            onChange={handleInput}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={22}
            className={`w-full px-3 py-2.5 border rounded-r-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isValidNumber ? "pr-8" : ""
            } ${
              activeError
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                : isValidNumber
                ? "border-green-400 focus:border-green-500 focus:ring-green-500/20"
                : "border-gray-200 focus:border-blue-400 focus:ring-blue-500/20"
            } ${inputClassName}`}
          />
          {isValidNumber && !activeError && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none">
              ✓
            </span>
          )}
        </div>
      </div>
      {activeError && (
        <p className="mt-1 text-xs text-red-500">{activeError}</p>
      )}

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full left-0 mt-1.5 z-[60] bg-white rounded-2xl shadow-xl border border-gray-100 w-72 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-xl">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск страны..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
              {!hasResults ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  Страна не найдена
                </div>
              ) : (
                <>
                  {/* Featured */}
                  {filteredFeatured.length > 0 && (
                    <>
                      {!search && (
                        <div className="px-3.5 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                          Основные
                        </div>
                      )}
                      {filteredFeatured.map((c) => (
                        <CountryRow
                          key={c.iso2}
                          country={c}
                          selected={country.iso2 === c.iso2}
                          onSelect={handleCountrySelect}
                        />
                      ))}
                      {filteredAll.length > 0 && (
                        <div className="mx-3 my-1.5 border-t border-gray-100" />
                      )}
                    </>
                  )}

                  {/* All others */}
                  {!search && filteredAll.length > 0 && (
                    <div className="px-3.5 pt-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                      Все страны
                    </div>
                  )}
                  {filteredAll.map((c) => (
                    <CountryRow
                      key={c.iso2}
                      country={c}
                      selected={country.iso2 === c.iso2}
                      onSelect={handleCountrySelect}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Country row ──────────────────────────────────────────────────────────────

function CountryRow({
  country,
  selected,
  onSelect,
}: {
  country: Country;
  selected: boolean;
  onSelect: (c: Country) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country)}
      className={`flex items-center gap-2.5 w-full px-3.5 py-2 text-sm transition-colors ${
        selected ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-base leading-none shrink-0">
        {toFlagEmoji(country.iso2)}
      </span>
      <span className="flex-1 text-left truncate">{country.nameRu}</span>
      <span className="text-xs text-gray-400 font-mono shrink-0">
        {country.dialCode}
      </span>
    </button>
  );
}
