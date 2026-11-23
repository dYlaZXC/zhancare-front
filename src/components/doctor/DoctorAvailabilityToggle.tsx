"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Power,
  Coffee,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Wifi,
  WifiOff
} from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { websocketService } from "@/services/websocketService";

interface DoctorAvailabilityToggleProps {
  currentStatus: 'available' | 'busy' | 'offline' | 'break';
  onStatusChange?: (newStatus: string) => void;
  lastSeen?: string;
  availabilityNote?: string;
  doctorId?: number;
  /** When true, renders the status list inline (no button+dropdown wrapper) */
  inline?: boolean;
}

type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'break';

interface StatusOption {
  value: AvailabilityStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DoctorAvailabilityToggle: React.FC<DoctorAvailabilityToggleProps> = ({
  currentStatus,
  onStatusChange,
  lastSeen,
  availabilityNote: initialNote,
  doctorId,
  inline = false,
}) => {
  const [status, setStatus] = useState<AvailabilityStatus>(currentStatus);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availabilityNote, setAvailabilityNote] = useState(initialNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const pendingStatusRef = useRef<AvailabilityStatus | null>(null);

  // Sync when parent passes a new status (e.g. from WebSocket in DoctorHeader)
  useEffect(() => { setStatus(currentStatus); }, [currentStatus]);

  // WebSocket: listen for real-time status changes for this user — despite
  // the doctor-only naming, this component is shared by NurseHeader too (the
  // backend branches on role server-side, both events carry the same shape
  // keyed by doctor_id/nurse_id respectively), so both event types are
  // handled here rather than duplicating this component per role.
  useEffect(() => {
    const handleWsChange = (data: any) => {
      const payload = data?.data ?? data;
      const changedId = payload?.doctor_id ?? payload?.nurse_id;
      if (doctorId && changedId !== doctorId) return;
      const newStatus = payload?.availability_status as AvailabilityStatus;
      if (newStatus) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    };

    websocketService.on("doctor_availability_changed", handleWsChange);
    websocketService.on("nurse_availability_changed", handleWsChange);
    return () => {
      websocketService.off("doctor_availability_changed", handleWsChange);
      websocketService.off("nurse_availability_changed", handleWsChange);
    };
  }, [doctorId, onStatusChange]);

  const statusOptions: StatusOption[] = [
    {
      value: 'available',
      label: 'Доступен',
      description: 'Готов принимать пациентов',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      value: 'busy',
      label: 'Занят',
      description: 'В данный момент с пациентом',
      icon: <Users className="w-4 h-4" />,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      value: 'break',
      label: 'На перерыве',
      description: 'Временно недоступен',
      icon: <Coffee className="w-4 h-4" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      value: 'offline',
      label: 'Не работает',
      description: 'Не принимаю пациентов',
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  const currentStatusOption = statusOptions.find(option => option.value === status);

  const updateAvailabilityStatus = async (newStatus: AvailabilityStatus, note?: string) => {
    setIsUpdating(true);
    try {
      // Use the new availability endpoint that broadcasts WebSocket events
      const response = await api.patch('/user-profile/update-availability/', {
        availability_status: newStatus,
        availability_note: note || availabilityNote
      });

      setStatus(newStatus);
      if (note !== undefined) {
        setAvailabilityNote(note);
      }

      onStatusChange?.(newStatus);

      const statusLabel = statusOptions.find(opt => opt.value === newStatus)?.label;
      toast.success(`Статус изменен на "${statusLabel}"`);

      setIsDropdownOpen(false);
      setShowNoteInput(false);
    } catch (error) {
      console.error('Failed to update availability status:', error);
      toast.error('Ошибка при изменении статуса');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusSelect = (newStatus: AvailabilityStatus) => {
    if (newStatus === 'break' || newStatus === 'offline') {
      pendingStatusRef.current = newStatus;
      setShowNoteInput(true);
    } else {
      updateAvailabilityStatus(newStatus);
    }
  };

  const handleNoteSubmit = () => {
    const newStatus = pendingStatusRef.current ?? status;
    pendingStatusRef.current = null;
    updateAvailabilityStatus(newStatus, availabilityNote);
  };

  const formatLastSeen = (lastSeenDate?: string) => {
    if (!lastSeenDate) return '';

    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const isOnline = status === 'available' || status === 'busy' || status === 'break';

  // ── Inline mode: render options list directly, no nested dropdown ──
  if (inline) {
    return (
      <div>
        {!showNoteInput ? (
          <>
            <div className="px-3 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
              <Power className="w-3.5 h-3.5" />
              Изменить статус доступности
            </div>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                disabled={isUpdating}
                className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 rounded-lg disabled:opacity-50 ${
                  status === option.value ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`${option.color} ${option.bgColor} p-1.5 rounded-lg border ${option.borderColor} flex-shrink-0`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.description}</div>
                </div>
                {status === option.value && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                {isUpdating && status !== option.value && null}
              </button>
            ))}
          </>
        ) : (
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Добавить заметку (необязательно)
            </p>
            <textarea
              value={availabilityNote}
              onChange={(e) => setAvailabilityNote(e.target.value)}
              placeholder="Причина недоступности..."
              className="w-full p-2.5 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={2}
              maxLength={255}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => { setShowNoteInput(false); setAvailabilityNote(initialNote || ''); }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >Отмена</button>
              <button
                onClick={handleNoteSubmit}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >Сохранить</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Status Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isUpdating}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
          hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-[200px]
          ${currentStatusOption?.bgColor} ${currentStatusOption?.borderColor} ${currentStatusOption?.color}
          ${isUpdating ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        `}
      >
        {/* Status Icon with Online Indicator */}
        <div className="relative">
          {currentStatusOption?.icon}
          {isOnline ? (
            <Wifi className="absolute -top-1 -right-1 w-2.5 h-2.5 text-green-500" />
          ) : (
            <WifiOff className="absolute -top-1 -right-1 w-2.5 h-2.5 text-red-500" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm">
            {currentStatusOption?.label}
          </div>
          {availabilityNote && (
            <div className="text-xs opacity-75 truncate max-w-[120px]">
              {availabilityNote}
            </div>
          )}
          {lastSeen && (
            <div className="text-xs opacity-60">
              {formatLastSeen(lastSeen)}
            </div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />

        {/* Loading Spinner */}
        {isUpdating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsDropdownOpen(false);
              setShowNoteInput(false);
            }}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 overflow-hidden">
            {!showNoteInput ? (
              <>
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Power className="w-4 h-4" />
                    Изменить статус доступности
                  </h3>
                </div>

                <div className="py-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusSelect(option.value)}
                      className={`
                        w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3
                        ${status === option.value ? 'bg-blue-50 border-r-4 border-blue-500' : ''}
                      `}
                    >
                      <div className={`${option.color} ${option.bgColor} p-2 rounded-lg border ${option.borderColor}`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                      {status === option.value && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Добавить заметку
                  </h3>
                </div>

                <div className="p-4">
                  <textarea
                    value={availabilityNote}
                    onChange={(e) => setAvailabilityNote(e.target.value)}
                    placeholder="Причина недоступности (необязательно)..."
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    maxLength={255}
                  />

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      {availabilityNote.length}/255
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowNoteInput(false);
                          setAvailabilityNote(initialNote || '');
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleNoteSubmit}
                        disabled={isUpdating}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorAvailabilityToggle;