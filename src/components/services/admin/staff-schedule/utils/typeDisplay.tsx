import { Home, Shuffle, Video } from "lucide-react";
import type { ConsultationType } from "../types/scheduleTypes";

// Shared display metadata for the three consultation types — used by both
// DateScheduleTab and TemplateScheduleTab so their toggles/badges/conflict
// messaging stay visually and textually consistent. Tailwind class names are
// written out in full per type (not interpolated from `color`) since
// Tailwind's build-time scanner can't see dynamically-constructed class
// strings.
export const TYPE_META: Record<
  ConsultationType,
  {
    shortLabel: string;
    fullLabel: string;
    icon: typeof Video;
    emoji: string;
    active: string; // selected toggle button background
    badgeActive: string; // count badge when its own tab is selected
    badgeInactive: string; // count badge when a different tab is selected
    border: string;
    bg: string;
    bgSoft: string; // very light background wash for the day-list container
    text: string;
    focusBorder: string;
  }
> = {
  online: {
    shortLabel: "Онлайн",
    fullLabel: "Видеоконсультация",
    icon: Video,
    emoji: "📱",
    active: "bg-blue-500 text-white",
    badgeActive: "bg-blue-600 text-white",
    badgeInactive: "bg-blue-100 text-blue-700",
    border: "border-blue-500",
    bg: "bg-blue-50",
    bgSoft: "bg-blue-50/40",
    text: "text-blue-700",
    focusBorder: "focus:border-blue-500",
  },
  offline: {
    shortLabel: "Оффлайн",
    fullLabel: "Приём в клинике",
    icon: Home,
    emoji: "🏠",
    active: "bg-purple-500 text-white",
    badgeActive: "bg-purple-600 text-white",
    badgeInactive: "bg-purple-100 text-purple-700",
    border: "border-purple-500",
    bg: "bg-purple-50",
    bgSoft: "bg-purple-50/40",
    text: "text-purple-700",
    focusBorder: "focus:border-purple-500",
  },
  mixed: {
    shortLabel: "Смешанное",
    fullLabel: "Гибкий формат",
    icon: Shuffle,
    emoji: "🔀",
    active: "bg-teal-500 text-white",
    badgeActive: "bg-teal-600 text-white",
    badgeInactive: "bg-teal-100 text-teal-700",
    border: "border-teal-500",
    bg: "bg-teal-50",
    bgSoft: "bg-teal-50/40",
    text: "text-teal-700",
    focusBorder: "focus:border-teal-500",
  },
};
