import React from "react";

interface PlaceholderProps {
  icon: React.ReactNode;
  headline: string;
  sub?: React.ReactNode;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ icon, headline, sub }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center text-gray-700 p-4">
    {icon}
    <p className="text-xl font-medium">{headline}</p>
    {sub && <p className="text-sm text-gray-500 mt-2">{sub}</p>}
  </div>
);
