"use client";

import { useState } from "react";
import { CheckCircle, CopyPlus, Loader2, Trash2, DoorOpen } from "lucide-react";
import type { AvailableRoom } from "../types/scheduleTypes";

// One "room + time range" row — reused by both TemplateScheduleTab
// ("Постоянное", bound to a weekday) and DateScheduleTab ("По датам",
// bound to a concrete date). Purely presentational/controlled: the parent
// decides whether committing an edit means POST (a brand-new, not-yet-
// saved band) or PATCH (an existing one), and supplies the room picker
// list — this component only ever renders {room select, start, end, save,
// delete} and reports changes upward.

export interface RoomBandRowProps {
  roomId: number | null;
  startTime: string;
  endTime: string;
  availableRooms: AvailableRoom[];
  onChange: (changes: { roomId?: number | null; startTime?: string; endTime?: string }) => void;
  onCommit: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  isNew?: boolean;
  /** Opens the "copy this band onto other days" panel — omitted for a not-yet-saved (isNew) band. */
  onCopy?: () => void;
  copyActive?: boolean;
}

export function RoomBandRow({
  roomId,
  startTime,
  endTime,
  availableRooms,
  onChange,
  onCommit,
  onDelete,
  isNew,
  onCopy,
  copyActive,
}: RoomBandRowProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCommit = async () => {
    setSaving(true);
    try {
      await onCommit();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-100 bg-orange-50/40">
      <DoorOpen className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
      <select
        value={roomId ?? ""}
        onChange={(e) => onChange({ roomId: e.target.value ? Number(e.target.value) : null })}
        className="flex-1 min-w-[110px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium focus:border-orange-400 outline-none"
      >
        <option value="">Без кабинета</option>
        {availableRooms.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}{r.number ? ` (№${r.number})` : ""}
          </option>
        ))}
      </select>
      <input
        type="time"
        value={startTime}
        step={900}
        onChange={(e) => onChange({ startTime: e.target.value })}
        className="w-[86px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:border-orange-400 outline-none"
      />
      <span className="text-gray-300 text-xs">—</span>
      <input
        type="time"
        value={endTime}
        step={900}
        onChange={(e) => onChange({ endTime: e.target.value })}
        className="w-[86px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:border-orange-400 outline-none"
      />
      <button
        type="button"
        onClick={handleCommit}
        disabled={saving || deleting}
        title={isNew ? "Добавить" : "Сохранить"}
        className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
      </button>
      {!isNew && onCopy && (
        <button
          type="button"
          onClick={onCopy}
          disabled={saving || deleting}
          title="Скопировать этот кабинет на другие дни"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0 ${
            copyActive
              ? "bg-orange-200 text-orange-700"
              : "bg-white border border-gray-200 hover:bg-orange-50 hover:border-orange-200 text-gray-400 hover:text-orange-500"
          }`}
        >
          <CopyPlus size={12} />
        </button>
      )}
      {!isNew && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          title="Удалить"
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      )}
    </div>
  );
}
