"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, Loader2, CheckCircle, Clock } from "lucide-react";
import { Protocol } from "./types";

interface ProtocolSearchProps {
  protocols: Protocol[];
  onProtocolSelect: (protocol: Protocol) => void;
  placeholder?: string;
}

export function ProtocolSearch({
  protocols,
  onProtocolSelect,
  placeholder = "Поиск протокола..."
}: ProtocolSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fuzzy search function
  const fuzzySearch = (query: string, protocols: Protocol[]) => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return protocols
      .map(protocol => {
        const name = protocol.name.toLowerCase();
        let score = 0;

        // Exact match - highest score
        if (name === lowerQuery) {
          score = 1000;
        }
        // Starts with query
        else if (name.startsWith(lowerQuery)) {
          score = 500;
        }
        // Contains query
        else if (name.includes(lowerQuery)) {
          score = 100;
        }
        // Fuzzy match (each character in order)
        else {
          let queryIndex = 0;
          let matchCount = 0;
          for (let i = 0; i < name.length && queryIndex < lowerQuery.length; i++) {
            if (name[i] === lowerQuery[queryIndex]) {
              matchCount++;
              queryIndex++;
            }
          }
          if (matchCount === lowerQuery.length) {
            score = matchCount * 10;
          }
        }

        // Boost score if protocol has content
        if (protocol.content_count && protocol.content_count > 0) {
          score += 50;
        }

        return { protocol, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 results
      .map(item => item.protocol);
  };

  // Search with debounce
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      const results = fuzzySearch(searchQuery, protocols);
      setFilteredProtocols(results);
      setIsSearching(false);
      setShowResults(searchQuery.trim().length > 0);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, protocols]);

  const handleProtocolClick = (protocol: Protocol) => {
    onProtocolSelect(protocol);
    setSearchQuery("");
    setShowResults(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    inputRef.current?.focus();
  };

  const hasContent = (protocol: Protocol) => {
    return protocol.content_count && protocol.content_count > 0;
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
        />

        {/* Clear/Loading Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : searchQuery ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-blue-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {/* Results Header */}
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
              <div className="text-xs font-semibold text-blue-700">
                {filteredProtocols.length > 0
                  ? `📊 Найдено: ${filteredProtocols.length} ${filteredProtocols.length === 1 ? 'протокол' : 'протоколов'}`
                  : "❌ Ничего не найдено"}
              </div>
            </div>

            {/* Results List */}
            {filteredProtocols.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredProtocols.map((protocol, idx) => (
                  <motion.button
                    key={protocol.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleProtocolClick(protocol)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${hasContent(protocol) ? 'text-green-500' : 'text-gray-400'}`}>
                        {hasContent(protocol) ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {protocol.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {hasContent(protocol) ? (
                            <>
                              <FileText className="w-3 h-3 inline mr-1" />
                              {protocol.content_count} {protocol.content_count === 1 ? 'секция' : 'секций'} • Полные данные
                            </>
                          ) : (
                            <span className="italic">Данные загружаются...</span>
                          )}
                        </div>
                      </div>

                      {/* Arrow on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                        →
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <div className="text-sm">Попробуйте другой запрос</div>
              </div>
            )}

            {/* Footer hint */}
            {filteredProtocols.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                💡 Нажмите на протокол для выбора
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
