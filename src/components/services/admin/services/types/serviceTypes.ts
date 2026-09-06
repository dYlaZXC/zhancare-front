import {
  FlaskConical, ScanLine, Heart, Brain, Bone, Eye, Baby, Microscope,
  ClipboardList, Stethoscope, Tag,
  type LucideIcon,
} from "lucide-react";

const TRANSLIT: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};
export function toSlug(name: string): string {
  return name.toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

// Map icon slug stored in DB → Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  'flask-conical': FlaskConical,
  'scan-line':     ScanLine,
  'heart':         Heart,
  'brain':         Brain,
  'bone':          Bone,
  'eye':           Eye,
  'baby':          Baby,
  'microscope':    Microscope,
  'clipboard-list': ClipboardList,
  'stethoscope':   Stethoscope,
  'tag':           Tag,
};

export const ICON_OPTIONS = [
  { value: 'flask-conical',  label: 'Колба' },
  { value: 'scan-line',      label: 'Сканер' },
  { value: 'heart',          label: 'Сердце' },
  { value: 'brain',          label: 'Мозг' },
  { value: 'bone',           label: 'Кость' },
  { value: 'eye',            label: 'Глаз' },
  { value: 'baby',           label: 'Ребёнок' },
  { value: 'microscope',     label: 'Микроскоп' },
  { value: 'clipboard-list', label: 'Список' },
  { value: 'stethoscope',    label: 'Стетоскоп' },
  { value: 'tag',            label: 'Тег' },
];

export function getCategoryIcon(iconSlug: string): LucideIcon {
  return ICON_MAP[iconSlug] ?? ClipboardList;
}

export interface ServiceCategory {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string | null;
  role: string;
}

export type ScheduleSource = "own" | "doctor";

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  duration_minutes: number;
  category: string;
  category_label: string;
  is_active: boolean;
  schedules?: Array<{ id: number; weekday: number; start_time: string; end_time: string; is_active: boolean }>;
  capacity_per_slot?: number | null;
  currency?: string;
  schedule_source: ScheduleSource;
  doctor_ids: number[];
  doctor_names: string[];
}

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  category: string;
  currency: string;
  schedule_source: ScheduleSource;
  doctor_ids: number[];
  capacity_per_slot: number | null;
}

export const EMPTY_SERVICE_FORM: ServiceFormData = {
  name: "", description: "", price: "", duration_minutes: 30, category: "",
  currency: "", schedule_source: "own", doctor_ids: [], capacity_per_slot: null,
};

export interface CategoryFormData {
  slug: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  is_active: boolean;
}

export const EMPTY_CATEGORY_FORM: CategoryFormData = {
  slug: "", name: "", icon: "clipboard-list", color: "#6366f1", order: 0, is_active: true,
};
