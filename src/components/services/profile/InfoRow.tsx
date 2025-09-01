"use client";

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export const InfoRow = ({ label, value, icon: IconComponent }: InfoRowProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-2.5 border-b border-gray-100 last:border-b-0 gap-1 sm:gap-2">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 min-w-0">
        {IconComponent && <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xs sm:text-sm font-medium text-gray-900 break-words sm:text-right sm:max-w-[60%]">
        {value || "Не указано"}
      </div>
    </div>
  );
};