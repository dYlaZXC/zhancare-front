export function StatCard({ label, value, sub, icon, gradient }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${gradient} shadow-sm`}>
          {icon}
        </div>
        {sub && <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className="text-2xl font-black text-gray-900 leading-none">{value}</div>
      <div className="text-xs text-gray-400 font-medium mt-1">{label}</div>
    </div>
  );
}
