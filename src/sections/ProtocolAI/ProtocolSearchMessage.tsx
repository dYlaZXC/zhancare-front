"use client";

import { motion } from "framer-motion";
import { ProtocolSearch } from "./ProtocolSearch";
import { Protocol } from "./types";

interface ProtocolSearchMessageProps {
  protocols: Protocol[];
  onProtocolSelect: (protocol: Protocol) => void;
  showPopularProtocols?: boolean;
}

export function ProtocolSearchMessage({
  protocols,
  onProtocolSelect,
  showPopularProtocols = true
}: ProtocolSearchMessageProps) {
  // Get protocols with content (popular ones)
  const popularProtocols = protocols
    .filter(p => p.content_count && p.content_count > 0)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-md"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          🔍 Найдите нужный протокол:
        </h3>
        <p className="text-sm text-gray-600">
          Введите название или выберите из популярных
        </p>
      </div>

      {/* Search Component */}
      <ProtocolSearch
        protocols={protocols}
        onProtocolSelect={onProtocolSelect}
        placeholder="Начните вводить название протокола..."
      />

      {/* Popular Protocols */}
      {showPopularProtocols && popularProtocols.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            ⭐ Популярные протоколы:
          </div>
          <div className="flex flex-wrap gap-2">
            {popularProtocols.map((protocol, idx) => (
              <motion.button
                key={protocol.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                onClick={() => onProtocolSelect(protocol)}
                className="px-4 py-2 bg-white border-2 border-blue-300 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
              >
                {protocol.name}
                {protocol.content_count && (
                  <span className="ml-1 opacity-60 text-xs">
                    ({protocol.content_count})
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-gray-500 italic">
          💡 Совет: После выбора протокола вы сможете задавать вопросы о диагностике, лечении и осложнениях
        </p>
      </div>
    </motion.div>
  );
}
