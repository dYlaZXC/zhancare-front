export const getCurrentMondayStr = (): string => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dow = now.getDay();
  now.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  return now.toLocaleDateString("sv-SE");
};

export const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
};

export const formatWeekLabel = (mondayStr: string): string => {
  const start = new Date(mondayStr + "T00:00:00");
  const end = new Date(mondayStr + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${fmt(start)} — ${fmt(end)}`;
};

export const isCurrentWeekPlanner = (mondayStr: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(mondayStr + "T00:00:00");
  sunday.setDate(sunday.getDate() + 6);
  return today >= monday && today <= sunday;
};

export const buildDefaultWeek = (weekStart: string): any[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    return {
      date: d.toLocaleDateString("sv-SE"),
      avail_id: null,
      is_day_off: isWeekend,
      start_time: isWeekend ? null : "09:00",
      end_time: isWeekend ? null : "18:00",
      note: "",
      source: "empty",
    };
  });
