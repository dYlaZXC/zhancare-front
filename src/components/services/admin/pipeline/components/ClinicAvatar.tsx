export function ClinicAvatar({ name, stageColor }: { name: string; stageColor: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
      style={{ background: `linear-gradient(135deg, ${stageColor}cc, ${stageColor})` }}>
      {initials}
    </div>
  );
}
