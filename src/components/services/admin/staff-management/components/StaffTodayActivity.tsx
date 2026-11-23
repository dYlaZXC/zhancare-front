"use client";

import type { TodayActivity } from "../types/staffTypes";

function formatLastSeen(lastSeenDate?: string | null) {
  if (!lastSeenDate) return '';
  const date = new Date(lastSeenDate);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
  return date.toLocaleDateString('ru-RU');
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{label}</span>
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#1e263e' }}>{value}</span>
      {sub && <span className="text-[11px] text-gray-400 whitespace-nowrap">{sub}</span>}
    </div>
  );
}

export function StaffTodayActivity({ activity }: { activity: TodayActivity | undefined }) {
  if (!activity) return null;

  if (activity.state === 'ongoing') {
    const end = new Date(activity.estimated_end_at);
    const label = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    return (
      <div className="h-full flex items-center gap-4 px-4 py-2 rounded-xl bg-red-50 border border-red-200 w-fit">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
        <Stat label="Идёт приём" value={`до ${label}`} sub={activity.type === 'online' ? 'Онлайн' : 'Офлайн'} />
      </div>
    );
  }

  if (activity.state === 'has_free_slots') {
    const { next_free_slot, free_count } = activity;
    return (
      <div className="h-full flex items-center gap-5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 w-fit">
        <Stat
          label="Следующий приём"
          value={next_free_slot.time}
          sub={next_free_slot.room_number ? `Каб. ${next_free_slot.room_number}` : (next_free_slot.type === 'online' ? 'Онлайн' : 'Офлайн')}
        />
        <div className="w-px h-8 bg-emerald-200" />
        <Stat label="Свободные слоты" value={String(free_count)} />
      </div>
    );
  }

  if (activity.state === 'fully_booked') {
    return (
      <div className="h-full flex items-center gap-4 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 w-fit">
        <Stat label="Свободные слоты" value="0" sub="Полностью занят" />
      </div>
    );
  }

  return (
    <div className="h-full flex items-center gap-4 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 w-fit">
      <Stat label="Статус" value="Не работает сегодня" sub={activity.last_seen ? `Был(а) в сети ${formatLastSeen(activity.last_seen)}` : undefined} />
    </div>
  );
}
