"use client";

import React from "react";
import { PhoneOff } from "lucide-react";

interface CallFooterProps {
  handleEndCall: () => void;
}

const CallFooter: React.FC<CallFooterProps> = ({ handleEndCall }) => {
  return (
    <footer className="sticky bottom-0 bg-white border-t p-4 flex justify-center">
      <button
        onClick={handleEndCall}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
      >
        <PhoneOff className="w-5 h-5" />
        Завершить звонок
      </button>
    </footer>
  );
};

export default CallFooter;
