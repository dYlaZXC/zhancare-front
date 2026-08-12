import { ClipboardList } from "lucide-react";

export function ServicesHeader({ totalActive }: { totalActive: number }) {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #3772ff, transparent)" }} />
      </div>
      <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Услуги клиники</h1>
          </div>
          <p className="text-[#c1d3ff] text-sm">Управление диагностическими услугами клиники</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-center px-5 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <p className="text-2xl font-black text-white">{totalActive}</p>
            <p className="text-[#c1d3ff] text-xs mt-0.5">Активных услуг</p>
          </div>
        </div>
      </div>
    </div>
  );
}
