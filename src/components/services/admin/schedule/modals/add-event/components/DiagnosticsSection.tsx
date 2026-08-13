"use client";

import {
  Loader2, ClipboardList, FlaskConical, ScanLine, Heart, Brain, Bone, Eye, Baby,
  Microscope, Stethoscope,
} from "lucide-react";
import SearchSelect from "../../../components/SearchSelect";
import { formatPrice } from "@/utils/currency";
import type { DiagCategoryItem, DiagService, StaffMember } from "../types/addEventTypes";

function getCategoryIconBySlug(icon: string): React.ElementType {
  const map: Record<string, React.ElementType> = {
    'flask-conical': FlaskConical,
    'scan-line':     ScanLine,
    'heart':         Heart,
    'brain':         Brain,
    'bone':          Bone,
    'eye':           Eye,
    'baby':          Baby,
    'microscope':    Microscope,
    'stethoscope':   Stethoscope,
    'clipboard-list': ClipboardList,
  };
  return map[icon] ?? ClipboardList;
}

export function DiagnosticsSection({
  diagServices,
  loadingDiagServices,
  selectedDiagService,
  onServiceChange,
  diagCategoryList,
  clinicCurrency,
  doctors,
  referringDoctorId,
  onReferringDoctorChange,
}: {
  diagServices: DiagService[];
  loadingDiagServices: boolean;
  selectedDiagService: DiagService | null;
  onServiceChange: (val: string) => void;
  diagCategoryList: DiagCategoryItem[];
  clinicCurrency: string;
  doctors: StaffMember[];
  referringDoctorId: string;
  onReferringDoctorChange: (val: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
          Услуга <span className="text-red-500">*</span>
        </label>
        {loadingDiagServices ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span className="text-sm text-gray-400">Загрузка услуг...</span>
          </div>
        ) : (
          <SearchSelect
            options={diagServices.map(svc => ({
              id: svc.id,
              label: svc.name,
              subtitle: [
                svc.category_label,
                svc.price ? formatPrice(svc.price, clinicCurrency) : null,
                svc.duration_minutes ? `${svc.duration_minutes} мин` : null,
              ].filter(Boolean).join(' · '),
            }))}
            value={selectedDiagService ? String(selectedDiagService.id) : ''}
            onChange={onServiceChange}
            placeholder={diagServices.length === 0 ? 'Нет услуг диагностики' : 'Найти услугу...'}
            required
          />
        )}

        {selectedDiagService?.category && (() => {
          const cat = diagCategoryList.find(c => c.slug === selectedDiagService.category);
          if (!cat) return null;
          const CatIcon = getCategoryIconBySlug(cat.icon);
          return (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: `${cat.color}25` }}>
                <CatIcon className="w-3 h-3" style={{ color: cat.color }} />
              </div>
              <span className="text-xs text-gray-500">Категория: <span className="font-semibold text-gray-700">{cat.name}</span></span>
            </div>
          );
        })()}
      </div>

      {/* Optional referring doctor — drives the doctor's diagnostics commission, if one is configured for this service */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: '#1e263e' }}>
          Назначивший врач <span className="text-gray-400 text-xs font-normal">(необязательно)</span>
        </label>
        <SearchSelect
          options={doctors.map(d => ({
            id: d.id,
            label: `${d.first_name} ${d.last_name}`,
            subtitle: d.specialization || undefined,
          }))}
          value={referringDoctorId}
          onChange={onReferringDoctorChange}
          placeholder="Без врача — выручка полностью клинике"
        />
      </div>
    </div>
  );
}
