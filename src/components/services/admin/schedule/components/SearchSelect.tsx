"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown } from 'lucide-react';

const DROPDOWN_MAX_HEIGHT = 280;

interface SearchSelectProps {
  options: Array<{ id: number | string; label: string; subtitle?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  activeFill?: boolean;
  renderOption?: (option: { id: number | string; label: string; subtitle?: string }, isSelected: boolean, onSelect: () => void) => React.ReactNode;
}

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  required,
  activeFill,
  renderOption,
}: SearchSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Render the options panel in a portal so it can escape clipping/scroll
  // containers (modals with overflow-y-auto cut off an absolutely-positioned
  // panel anchored inside them) — position is computed from the trigger's
  // actual screen position instead.
  const updatePosition = useCallback(() => {
    const trigger = containerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'below' | 'above' = spaceBelow < DROPDOWN_MAX_HEIGHT + 60 && rect.top > spaceBelow ? 'above' : 'below';
    setPanelPos({
      top: placement === 'below' ? rect.bottom + 6 : rect.top - 6,
      left: rect.left,
      width: rect.width,
      placement,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
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

  const isFilled = activeFill && !!selectedLabel;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
          isFilled
            ? 'bg-blue-600 border-blue-600 shadow-md'
            : isOpen
            ? 'bg-white border-blue-500 shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        {selectedLabel ? (
          <>
            <span className={`flex-1 text-sm font-semibold ${isFilled ? 'text-white' : 'text-gray-900'}`}>
              {selectedLabel}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className={`p-0.5 rounded-lg transition-colors ${isFilled ? 'hover:bg-blue-500' : 'hover:bg-gray-100'}`}
            >
              <X className={`w-4 h-4 ${isFilled ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} />
            </button>
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isFilled ? 'text-blue-200' : 'text-gray-400'} ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && panelPos && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden"
          style={{
            top: panelPos.placement === 'below' ? panelPos.top : undefined,
            bottom: panelPos.placement === 'above' ? window.innerHeight - panelPos.top : undefined,
            left: panelPos.left,
            width: panelPos.width,
          }}
        >
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
              filtered.map(option => {
                const isSelected = String(option.id) === value;
                const onSelect = () => { onChange(String(option.id)); setIsOpen(false); };
                if (renderOption) {
                  return (
                    <div key={option.id}>
                      {renderOption(option, isSelected, onSelect)}
                    </div>
                  );
                }
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={onSelect}
                    className={`w-full text-left px-4 py-2.5 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {option.label}
                    </div>
                    {option.subtitle && (
                      <div className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                        {option.subtitle}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}

      {required && (
        <input type="text" value={value} required readOnly className="sr-only" tabIndex={-1} />
      )}
    </div>
  );
}
