import { STAGES } from "../constants/pipelineConstants";

export function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGES.find(s => s.key === stage);
  if (!cfg) return <span className="text-xs text-gray-400">{stage}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
      style={{ background: cfg.color }}>
      {cfg.label}
    </span>
  );
}
