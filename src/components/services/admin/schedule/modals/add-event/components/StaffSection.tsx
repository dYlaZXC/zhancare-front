"use client";

import { Activity, AlertCircle, Calendar as CalendarIcon, Loader2, Mail, Phone, Stethoscope, User } from "lucide-react";
import SearchSelect from "../../../components/SearchSelect";
import type { ConsultationType, StaffMember } from "../types/addEventTypes";

export function StaffSection({
  consultationType,
  doctors,
  nurses,
  doctorId,
  onDoctorChange,
  loadingAvailability,
  doctorFirstSlots,
  doctorHasSchedule,
  date,
  onOpenSchedule,
}: {
  consultationType: ConsultationType;
  doctors: StaffMember[];
  nurses: StaffMember[];
  doctorId: string;
  onDoctorChange: (val: string) => void;
  loadingAvailability: boolean;
  doctorFirstSlots: Record<number, string>;
  doctorHasSchedule: (doctor: StaffMember) => boolean;
  date: string;
  onOpenSchedule: (member: StaffMember) => void;
}) {
  const isHome = consultationType === 'home';
  const staffList = isHome ? nurses : doctors;
  const staffLabel = isHome ? 'Медсестра' : 'Доктор';
  const staffIcon = isHome ? <Activity className="w-4 h-4 text-amber-600" /> : <Stethoscope className="w-4 h-4 text-emerald-600" />;
  const accentColor = isHome ? 'amber' : 'emerald';
  const member = staffList.find(d => String(d.id) === doctorId);

  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
        {staffLabel} <span className="text-red-500">*</span>
        {loadingAvailability && (
          <span className="ml-2 text-xs text-gray-500">
            <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
            Загрузка расписания...
          </span>
        )}
      </label>
      {staffList.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-sm text-gray-400">
          <AlertCircle className="w-4 h-4 text-gray-300" />
          {isHome ? 'Медсёстры не найдены' : 'Врачи не найдены'}
        </div>
      ) : (
        <SearchSelect
          options={staffList.map(d => {
            const subtitleParts = [];
            if (d.specialization) subtitleParts.push(d.specialization);
            if (d.email) subtitleParts.push(d.email);
            return { id: d.id, label: `${d.first_name} ${d.last_name}`, subtitle: subtitleParts.join(' • ') || undefined };
          })}
          value={doctorId}
          onChange={onDoctorChange}
          placeholder={`Выберите ${isHome ? 'медсестру' : 'доктора'}...`}
          required={true}
          renderOption={(option, isSelected, onSelect) => {
            const d = staffList.find(m => String(m.id) === String(option.id));
            const hasSchedule = d ? doctorHasSchedule(d) : false;
            const firstSlot = d ? doctorFirstSlots[d.id] : undefined;
            return (
              <div onClick={onSelect} className={`w-full px-4 py-2.5 cursor-pointer flex items-center justify-between gap-2 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{option.label}</div>
                  {option.subtitle && <div className={`text-xs ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{option.subtitle}</div>}
                  {firstSlot && date && (
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Ближайший слот: {firstSlot}</span>
                  )}
                  {!firstSlot && !hasSchedule && !loadingAvailability && !isHome && (
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">Нет расписания</span>
                  )}
                </div>
                {!loadingAvailability && !hasSchedule && d && !isHome && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpenSchedule(d); }}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                    <CalendarIcon className="w-3 h-3" /> Расписание
                  </button>
                )}
              </div>
            );
          }}
        />
      )}

      {/* Staff info card */}
      {doctorId && member && (
        <div className={`mt-3 p-4 rounded-2xl border-2 ${accentColor === 'amber' ? 'border-amber-100 bg-amber-50/40' : 'border-emerald-100 bg-emerald-50/40'}`}>
          <div className="flex items-center gap-2 mb-2.5">
            {staffIcon}
            <span className={`text-sm font-bold ${accentColor === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>
              Информация о {isHome ? 'медсестре' : 'докторе'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {member.email && <div className="flex items-center gap-2 text-gray-600"><Mail className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span className="truncate">{member.email}</span></div>}
            {member.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.phone}</span></div>}
            {member.specialization && <div className="flex items-center gap-2 text-gray-600 col-span-2"><Stethoscope className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.specialization}</span></div>}
            {member.clinic && <div className="flex items-center gap-2 text-gray-600 col-span-2"><User className={`w-3.5 h-3.5 flex-shrink-0 ${accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`} /><span>{member.clinic.name}</span></div>}
          </div>
        </div>
      )}

      {/* No-schedule warning (doctors only) */}
      {!isHome && doctorId && (() => {
        const d = doctors.find(doc => String(doc.id) === doctorId);
        if (!d || doctorHasSchedule(d) || doctorFirstSlots[d.id]) return null;
        return (
          <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-800">У доктора нет настроенного расписания</span>
            </div>
            <button type="button" onClick={() => onOpenSchedule(d)}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
              <CalendarIcon className="w-3 h-3" /> Настроить
            </button>
          </div>
        );
      })()}
    </div>
  );
}
