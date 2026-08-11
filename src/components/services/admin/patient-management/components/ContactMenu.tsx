"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, Phone } from "lucide-react";
import type { Patient } from "../types/patientTypes";

// ─── ContactMenu ────────────────────────────────────────────────────────────

export function ContactMenu({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const phone = patient.phone?.replace(/\D/g, "") ?? "";
  const hasPhone = !!phone;
  const hasEmail = !!patient.email;

  if (!hasPhone && !hasEmail) return null;

  const goWhatsApp = () => {
    setOpen(false);
    // Normalize to international format (+7XXXXXXXXXX for KZ/RU, +XXXXXXXXXXX otherwise)
    const normalized = phone
      ? `+${phone.startsWith("8") && phone.length === 11 ? "7" + phone.slice(1) : phone}`
      : "";
    router.push(`/admin/whatsapp${normalized ? `?phone=${encodeURIComponent(normalized)}` : ""}`);
  };

  const goTelegram = () => {
    setOpen(false);
    router.push(`/admin/telegram?patientId=${patient.id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
        title="Связаться"
      >
        <MessageCircle className="w-4 h-4" />
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[190px]"
          >
            {/* WhatsApp — переход во внутренний мессенджер */}
            {hasPhone && (
              <button onClick={goWhatsApp}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors text-left">
                <span className="w-7 h-7 rounded-lg bg-[#25D36620] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">WhatsApp</p>
                  <p className="text-[10px] text-gray-400">Открыть чат</p>
                </div>
              </button>
            )}

            {/* Telegram — переход во внутренний мессенджер */}
            <button onClick={goTelegram}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left">
              <span className="w-7 h-7 rounded-lg bg-[#0088cc20] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0088cc]">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Telegram</p>
                <p className="text-[10px] text-gray-400">Открыть мессенджер</p>
              </div>
            </button>

            {/* Divider */}
            {hasPhone && <div className="my-1 border-t border-gray-100" />}

            {/* Phone call */}
            {hasPhone && (
              <a href={`tel:${patient.phone}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Позвонить</p>
                  <p className="text-[10px] text-gray-400">{patient.phone}</p>
                </div>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
