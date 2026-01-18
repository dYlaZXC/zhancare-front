"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, HelpCircle } from "lucide-react";
import { InteractiveProtocol } from "./types";

interface InteractiveProtocolsProps {
  protocols: InteractiveProtocol[];
  onProtocolClick: (protocol: InteractiveProtocol) => void;
  onQuickAction?: (action: string, protocol?: InteractiveProtocol) => void;
}

export function InteractiveProtocols({
  protocols,
  onProtocolClick,
  onQuickAction,
}: InteractiveProtocolsProps) {
  console.log("🔵 InteractiveProtocols render:", { protocols, count: protocols?.length });

  if (!protocols || protocols.length === 0) {
    console.log("⚠️ No protocols to display");
    return null;
  }

  return (
    <div className="mt-4 space-y-4 p-6 bg-gradient-to-r from-yellow-100 to-blue-100 rounded-xl border-4 border-red-500 shadow-2xl">
      <div className="text-lg font-bold text-red-600 mb-3 bg-yellow-200 p-2 rounded">
        Доступные и обработанные протоколы, для ИИ ({protocols.length}):
      </div>

      {/* Interactive Protocol Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {protocols.map((protocol, idx) => (
          <motion.button
            key={protocol.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => {
              console.log("🖱️ Protocol clicked:", protocol);
              onProtocolClick(protocol);
            }}
            className="group relative px-6 py-4 rounded-2xl border-2 border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-base transition-all hover:scale-105 hover:shadow-2xl hover:from-blue-600 hover:to-blue-700 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-left">
                <div className="leading-tight">{protocol.name}</div>
                {protocol.count && (
                  <div className="mt-1 inline-block px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {protocol.count} секций
                  </div>
                )}
              </div>
            </div>

            {/* Hover sparkle effect */}
            <motion.div
              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="pt-4 border-t border-gray-300">
        <div className="text-sm text-gray-700 mb-3 font-semibold flex items-center gap-2">
          <span>💡</span>
          <span>Быстрые действия:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onQuickAction?.("diagnosis")}
            className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Диагностические критерии</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => onQuickAction?.("treatment")}
            className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl border-2 border-green-200 hover:bg-green-100 hover:border-green-400 hover:shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Тактика лечения</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onQuickAction?.("complications")}
            className="px-4 py-2.5 bg-orange-50 text-orange-700 rounded-xl border-2 border-orange-200 hover:bg-orange-100 hover:border-orange-400 hover:shadow-md transition-all text-sm font-semibold flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Осложнения</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
