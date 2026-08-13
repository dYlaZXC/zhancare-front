"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Bot, Building2, CircleCheck, CircleX, Loader2, Search, Settings2 } from "lucide-react";
import { API } from "../types/aiAgentTypes";
import type { ClinicRow } from "../types/aiAgentTypes";

/* ── Super admin list view ─────────────────────────────── */
// Self-contained: owns its own fetch of /clinic-ai-agents/ and its own
// loading/search state, independent of the main agent-editing form's state.
// Only communicates outward via onSelectClinic when the admin drills in.

export function SuperAdminAgentsView({
  onSelectClinic,
}: {
  onSelectClinic: (clinicId: number, clinicName: string, clinicLogo: string | null) => void;
}) {
  const [rows, setRows] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API}/clinic-ai-agents/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setRows(await res.json());
        else toast.error("Ошибка загрузки агентов");
      } catch {
        toast.error("Не удалось подключиться к серверу");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) =>
    r.clinic_name.toLowerCase().includes(search.toLowerCase())
  );

  const configured = rows.filter((r) => r.agent).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">AI Агенты</h1>
            <p className="text-sm text-gray-400">
              {configured} из {rows.length} клиник настроено
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по клинике…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 transition-all"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Всего клиник</p>
          <p className="text-2xl font-black text-gray-800">{rows.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Настроено</p>
          <p className="text-2xl font-black text-emerald-600">{configured}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Активных</p>
          <p className="text-2xl font-black text-purple-600">
            {rows.filter((r) => r.agent?.is_active).length}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Ничего не найдено</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((row, i) => (
              <motion.div
                key={row.clinic_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
              >
                {/* Clinic logo */}
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {row.clinic_logo ? (
                    <img src={row.clinic_logo} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                {/* Clinic name + agent info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{row.clinic_name}</p>
                  {row.agent ? (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 truncate">
                        {row.agent.agent_name}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs font-mono text-gray-400 truncate">
                        /{row.agent.slug}/
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 mt-0.5">Агент не настроен</p>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0 hidden sm:block">
                  {row.agent ? (
                    row.agent.is_active ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100">
                        <CircleCheck className="w-3 h-3" /> Активен
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-400 bg-gray-50 border border-gray-100">
                        <CircleX className="w-3 h-3" /> Отключён
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100">
                      Не настроен
                    </span>
                  )}
                </div>

                {/* Color dot */}
                {row.agent?.primary_color && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm hidden sm:block"
                    style={{ background: row.agent.primary_color }}
                  />
                )}

                {/* Configure button */}
                <button
                  onClick={() => onSelectClinic(row.clinic_id, row.clinic_name, row.clinic_logo)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0"
                  style={{
                    background: row.agent
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "white",
                  }}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {row.agent ? "Настроить" : "Создать"}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
