"use client";

import { CalendarCheck2, AlertCircle, Check, X } from "lucide-react";
import type { StaffMember } from "../types/staffTypes";
import { TYPE_META } from "../../staff-schedule/utils/typeDisplay";

type Dimension = { key: string; label: string; ok: boolean };

function ConfiguredPill({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-green-300 text-green-700">
      {label}
    </span>
  );
}

function MissingPill({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-red-300 text-red-700">
      {label}
    </span>
  );
}

function MarkedPill({ dim }: { dim: Dimension }) {
  return dim.ok ? (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-green-300 text-green-700">
      {dim.label}
      <Check className="w-3 h-3" />
    </span>
  ) : (
    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-400">
      {dim.label}
      <X className="w-3 h-3" />
    </span>
  );
}

// Онлайн/Оффлайн above can both read "configured" purely because a doctor
// set up a single flexible 'mixed' schedule (not two separate ones) — this
// badge makes that distinction visible instead of leaving it implicit,
// reusing the same teal/Shuffle styling 'mixed' gets everywhere else
// (StaffScheduleModal, DoctorSchedule) so it reads as the same concept.
function MixedPill() {
  const meta = TYPE_META.mixed;
  const Icon = meta.icon;
  return (
    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-teal-300 ${meta.text}`}>
      <Icon className="w-3 h-3" />
      {meta.shortLabel}
    </span>
  );
}

export function StaffScheduleStatus({ member }: { member: StaffMember }) {
  if (member.role !== 'doctor' && member.role !== 'nurse') return null;

  const activeSchedules = member.schedules || [];
  // 'mixed' means the doctor is flexible for either type — it satisfies
  // both the Онлайн and Оффлайн dimensions, same as the backend treats it
  // as a stand-in for whichever exact type is requested (pick_exact_over_mixed).
  const hasMixed = activeSchedules.some((s) => s.is_active && s.consultation_type === 'mixed') || !!member.has_mixed_availability;
  const hasOnline = hasMixed || activeSchedules.some((s) => s.is_active && s.consultation_type === 'online') || !!member.has_online_availability;
  const hasOffline = hasMixed || activeSchedules.some((s) => s.is_active && s.consultation_type === 'offline') || !!member.has_offline_availability;
  const hasRecurring = activeSchedules.some((s) => s.is_active);

  const dims: Dimension[] = [
    { key: 'online', label: 'Онлайн', ok: hasOnline },
    { key: 'offline', label: 'Оффлайн', ok: hasOffline },
    { key: 'recurring', label: 'Постоянное', ok: hasRecurring },
  ];
  const missing = dims.filter((d) => !d.ok);

  // 0 missing → fully configured (green); 3 missing → nothing configured (red);
  // 1 or 2 missing → partial, but severity differs: missing just one dimension
  // reads as "almost done" (blue), missing two reads as "mostly not set up" (orange).
  if (missing.length === 0) {
    return (
      <div className="h-full rounded-2xl bg-green-50 p-4 flex flex-col justify-center gap-3 w-full">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-green-600" />
          <span className="text-sm font-bold text-green-700">Расписание настроено</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dims.map((d) => <ConfiguredPill key={d.key} label={d.label} />)}
          {hasMixed && <MixedPill />}
        </div>
      </div>
    );
  }

  if (missing.length === 3) {
    return (
      <div className="h-full rounded-2xl bg-red-50 p-4 flex flex-col justify-center gap-3 w-full">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-red-600" />
          <span className="text-sm font-bold text-red-700">Расписание не настроено</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dims.map((d) => <MissingPill key={d.key} label={d.label} />)}
        </div>
      </div>
    );
  }

  const severe = missing.length >= 2;
  const tint = severe ? 'bg-orange-50' : 'bg-blue-50';
  const iconColor = severe ? 'text-orange-600' : 'text-blue-600';
  const headingColor = severe ? 'text-orange-700' : 'text-blue-700';
  const noteColor = severe ? 'text-orange-700' : 'text-blue-700';

  return (
    <div className={`h-full rounded-2xl ${tint} p-4 flex flex-col justify-center gap-3 w-full`}>
      <div className="flex items-center gap-2">
        <AlertCircle className={`w-5 h-5 ${iconColor}`} />
        <span className={`text-sm font-bold ${headingColor}`}>Частично настроено</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {dims.map((d) => <MarkedPill key={d.key} dim={d} />)}
        {hasMixed && <MixedPill />}
      </div>
      <p className={`text-xs font-medium ${noteColor}`}>
        Не настроено: {missing.map((d) => d.label).join(', ')}
      </p>
    </div>
  );
}
