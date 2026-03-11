"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

interface SearchSelectProps {
  options: Array<{ id: number; label: string; subtitle?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

/**
 * Searchable Select Component
 * A custom dropdown with search functionality
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  required
}: SearchSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedLabel = options.find(o => String(o.id) === value)?.label;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors bg-white ${
          isOpen ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        {selectedLabel ? (
          <>
            <span className="flex-1 text-sm font-medium text-gray-900">{selectedLabel}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full mt-1.5 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto scrollbar-hide py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Ничего не найдено</div>
            ) : (
              filtered.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => { onChange(String(option.id)); setIsOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    String(option.id) === value
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium ${String(option.id) === value ? 'text-blue-700' : 'text-gray-700'}`}>
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className={`text-xs ${String(option.id) === value ? 'text-blue-500' : 'text-gray-400'}`}>
                      {option.subtitle}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {required && (
        <input type="text" value={value} required readOnly className="sr-only" tabIndex={-1} />
      )}
    </div>
  );
}
