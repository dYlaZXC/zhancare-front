"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, Check } from 'lucide-react';

const DROPDOWN_MAX_HEIGHT = 300;

export interface MultiOption { id: number | string; label: string; subtitle?: string }

interface SearchMultiSelectProps {
  options: MultiOption[];
  value: Array<number | string>;
  onChange: (value: Array<number | string>) => void;
  placeholder: string;
  emptyText?: string;
}

/**
 * Multi-select twin of SearchSelect: same trigger/panel look, search box,
 * portal-rendered panel (so modals with overflow don't clip it). Selected
 * items show as removable chips in the trigger; the panel stays open while
 * toggling so several can be picked in one go.
 */
export default function SearchMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyText = 'Ничего не найдено',
}: SearchMultiSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = containerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement: 'below' | 'above' = spaceBelow < DROPDOWN_MAX_HEIGHT + 20 && rect.top > spaceBelow ? 'above' : 'below';
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
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
    // Chips can wrap onto a new line as items are picked, moving the
    // trigger's bottom edge — re-anchor whenever the selection changes.
  }, [isOpen, updatePosition, value.length]);

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

  const q = search.trim().toLowerCase();
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q) || (o.subtitle && o.subtitle.toLowerCase().includes(q))
  );

  const selectedSet = new Set(value.map(String));
  const selectedOptions = value
    .map(v => options.find(o => String(o.id) === String(v)))
    .filter(Boolean) as MultiOption[];

  const toggle = (id: number | string) => {
    if (selectedSet.has(String(id))) onChange(value.filter(v => String(v) !== String(id)));
    else onChange([...value, id]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full min-h-[50px] px-3 py-2 rounded-2xl border-2 cursor-pointer transition-all bg-white ${
          isOpen ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-sm text-gray-400">{placeholder}</span>
          ) : (
            selectedOptions.map(o => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 max-w-full pl-2.5 pr-1 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold"
              >
                <span className="truncate">{o.label}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(o.id); }}
                  className="p-0.5 rounded hover:bg-blue-100 flex-shrink-0"
                  title="Убрать"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        {selectedOptions.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            className="p-0.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
            title="Очистить"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && panelPos && typeof document !== 'undefined' && createPortal(
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

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">{emptyText}</div>
            ) : (
              filtered.map(option => {
                const isSelected = selectedSet.has(String(option.id));
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.id)}
                    className={`w-full flex items-center gap-3 text-left px-3 py-2.5 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                      {option.subtitle && (
                        <span className={`block text-xs truncate ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                          {option.subtitle}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {value.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/60">
              <span className="text-xs text-gray-500">Выбрано: <b className="text-gray-700">{value.length}</b></span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Готово
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
