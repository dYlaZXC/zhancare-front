import { motion } from "framer-motion";
import { STAGES } from "../constants/pipelineConstants";
import type { Clinic, Stats } from "../types/pipelineTypes";

export function PipelineAnalyticsView({ stats, clinics }: { stats: Stats | null; clinics: Clinic[] }) {
  if (!stats) return <div className="py-20 text-center text-gray-400">Загрузка аналитики...</div>;

  const maxDistrict = Math.max(...(stats.by_district?.map(d => d.total) ?? [1]));
  const channelCounts = clinics.reduce((acc, c) => {
    if (c.recommended_channel) acc[c.recommended_channel] = (acc[c.recommended_channel] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const channelLabels: Record<string, string> = { instagram:"Instagram",telegram:"Telegram",whatsapp:"WhatsApp",phone:"Телефон",website:"Сайт",find:"Найти контакт" };
  const totalWithChannel = Object.values(channelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Распределение по приоритету</h3>
        <div className="grid grid-cols-3 gap-4">
          {[{key:"A",label:"A — Высокий",color:"#ef4444"},{key:"B",label:"B — Средний",color:"#f59e0b"},{key:"C",label:"C — Низкий",color:"#94a3b8"}].map(({key,label,color})=>{
            const count = stats.by_priority?.[key] ?? 0;
            const pct = stats.total ? Math.round(count/stats.total*100) : 0;
            return (
              <div key={key} className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="text-3xl font-black text-gray-900">{count}</div>
                <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
                <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{background:color}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                </div>
                <div className="text-[10px] text-gray-400 mt-1.5 font-semibold">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">По районам</h3>
        <div className="space-y-2.5">
          {(stats.by_district??[]).sort((a,b)=>b.total-a.total).map(d=>{
            const pct = maxDistrict ? Math.round(d.total/maxDistrict*100) : 0;
            const aPct = d.total ? Math.round(d.a/d.total*100) : 0;
            return (
              <div key={d.district__name_ru} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-500 truncate flex-shrink-0">{d.district__name_ru}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded-xl overflow-hidden relative">
                  <motion.div className="h-full rounded-xl" style={{background:"linear-gradient(90deg,#3b82f6,#6366f1)"}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                  <div className="absolute inset-0 flex items-center px-2.5"><span className="text-[10px] text-white font-bold drop-shadow">{d.total}</span></div>
                </div>
                <div className="w-24 text-[10px] text-gray-400 flex-shrink-0"><span className="text-red-500 font-bold">{d.a}</span> A-приор. ({aPct}%)</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Рекомендуемые каналы связи</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(channelCounts).sort((a,b)=>b[1]-a[1]).map(([ch,cnt])=>{
            const pct = totalWithChannel ? Math.round(cnt/totalWithChannel*100) : 0;
            const ICONS: Record<string,string> = {instagram:"📸",telegram:"✈️",whatsapp:"💬",phone:"📞",website:"🌐",find:"🔍"};
            return (
              <div key={ch} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 hover:bg-gray-100 transition-colors">
                <span className="text-xl">{ICONS[ch]??"📡"}</span>
                <div>
                  <div className="text-sm font-black text-gray-900">{cnt}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{channelLabels[ch]??ch} · {pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Воронка по этапам</h3>
        <div className="space-y-2.5">
          {STAGES.map(s=>{
            const cnt = stats.by_stage?.[s.key]??0;
            const pct = stats.total?Math.round(cnt/stats.total*100):0;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-44 text-xs text-gray-500 flex-shrink-0 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}/>
                  {s.label}
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{background:s.color}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
                </div>
                <div className="w-10 text-xs font-bold text-gray-600 text-right flex-shrink-0">{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
