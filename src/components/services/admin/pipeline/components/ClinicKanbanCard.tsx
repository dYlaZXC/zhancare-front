"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Phone, Globe, MessageCircle, ChevronDown,
  MapPin, Star, Check,
} from "lucide-react";
import { phoneEntryToString } from "@/utils/phoneFormat";
import { STAGES } from "../constants/pipelineConstants";
import type { Clinic } from "../types/pipelineTypes";
import { PriorityBadge } from "./PriorityBadge";
import { ClinicAvatar } from "./ClinicAvatar";

export function ClinicKanbanCard({ clinic, onStageChange }: { clinic: Clinic; onStageChange: (id: number, stage: string) => void }) {
  const [stageMenu, setStageMenu] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ left: 0, width: 0, bottom: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const stageColor = STAGES.find(s => s.key === clinic.pipeline_stage)?.color ?? "#64748b";
  const firstPhone = clinic.phones?.[0] ? phoneEntryToString(clinic.phones[0]) : undefined;
  const firstTelegram = clinic.telegram?.[0];

  const openStageMenu = () => {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (rect) setMenuAnchor({ left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 6 });
    setStageMenu(v => !v);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (menuRef.current?.contains(target)) return;
      if (target.closest("[data-stage-menu-portal]")) return;
      setStageMenu(false);
    };
    if (stageMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stageMenu]);

  useEffect(() => {
    if (!stageMenu) return;
    const close = () => setStageMenu(false);
    document.addEventListener("scroll", close, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", close, { capture: true });
  }, [stageMenu]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-default"
    >
      {/* Stage color accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${stageColor}, ${stageColor}80)` }} />

      <div className="p-3.5 space-y-3">
        {/* Header: avatar + name + priority */}
        <div className="flex items-start gap-2.5">
          <ClinicAvatar name={clinic.name} stageColor={stageColor} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{clinic.name}</p>
            {clinic.district_name && (
              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{clinic.district_name}
              </p>
            )}
          </div>
          <PriorityBadge priority={clinic.priority} />
        </div>

        {/* Type / description */}
        {clinic.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 px-0.5">{clinic.description}</p>
        )}

        {/* Rating */}
        {clinic.rating != null && (
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            {clinic.rating}
            <span className="text-gray-400 font-normal">· {clinic.review_count ?? 0} отзывов</span>
          </div>
        )}

        {/* Contact buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {clinic.instagram && (
            <a href={clinic.instagram} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors font-medium">
              <Instagram className="w-3 h-3" />Instagram
            </a>
          )}
          {firstPhone && (
            <a href={`tel:${firstPhone}`}
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
              <Phone className="w-3 h-3" />{firstPhone.slice(0, 13)}
            </a>
          )}
          {firstTelegram && (
            <a href={firstTelegram} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors font-medium">
              <MessageCircle className="w-3 h-3" />Telegram
            </a>
          )}
          {clinic.websites?.[0] && (
            <a href={clinic.websites[0]} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors font-medium">
              <Globe className="w-3 h-3" />Сайт
            </a>
          )}
        </div>

        {/* Next step */}
        {clinic.next_step && (
          <div className="flex items-start gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 rounded-xl px-2.5 py-1.5">
            <span className="mt-px">→</span>
            <span className="line-clamp-1">{clinic.next_step}</span>
          </div>
        )}

        {/* Stage move */}
        <div className="relative" ref={menuRef}>
          <button
            ref={menuBtnRef}
            onClick={openStageMenu}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors border border-gray-100 hover:border-gray-200"
          >
            <span>Переместить в этап</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${stageMenu ? "rotate-180" : ""}`} />
          </button>
          {stageMenu && typeof document !== "undefined" && createPortal(
            <AnimatePresence>
              <motion.div
                data-stage-menu-portal
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{ position: "fixed", left: menuAnchor.left, width: menuAnchor.width, bottom: menuAnchor.bottom, zIndex: 9999 }}
                className="min-w-[14rem] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1.5"
              >
                {STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => { onStageChange(clinic.id, s.key); setStageMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 ${
                      s.key === clinic.pipeline_stage
                        ? "bg-gray-50 font-bold text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    {s.label}
                    {s.key === clinic.pipeline_stage && (
                      <Check className="w-3 h-3 ml-auto text-blue-500" />
                    )}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>,
            document.body
          )}
        </div>
      </div>
    </motion.div>
  );
}
