"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Briefcase, Minus } from "lucide-react";

// Memoized input component that uses local state for instant typing.
// Parent state updates happen in background without blocking UI.
export const SpecializationInput = memo(({
  value,
  index,
  onChange,
  placeholder,
  showRemove,
  onRemove
}: {
  value: string;
  index: number;
  onChange: (index: number, value: string) => void;
  placeholder: string;
  showRemove: boolean;
  onRemove: (index: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes (e.g., when editing different staff)
  useEffect(() => {
    // Only sync if input is not focused to avoid overwriting while typing
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Handle input change - update local immediately, parent async
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Update parent in next tick to not block typing
    requestAnimationFrame(() => {
      onChange(index, newValue);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
          placeholder={placeholder}
        />
      </div>
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          title="Удалить специализацию"
        >
          <Minus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});
SpecializationInput.displayName = 'SpecializationInput';
