"use client";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const InfoCard = ({ title, children, className = "" }: InfoCardProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 shadow-sm ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{title}</h3>
      {children}
    </div>
  );
};