"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhoneSlash } from "@fortawesome/free-solid-svg-icons";

interface CallFooterProps {
  handleEndCall: () => void;
}

const CallFooter: React.FC<CallFooterProps> = ({ handleEndCall }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <footer className="sticky bottom-0 backdrop-blur-md border-t border-white/10 p-6 flex justify-center relative z-10"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.08) 0%,
                  rgba(55, 114, 255, 0.05) 100%
                )
              `
            }}>

      {/* Call Controls Container */}
      <div className="flex items-center justify-center">
        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative group px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-3 transition-all duration-300 backdrop-blur-md border shadow-2xl overflow-hidden min-w-[180px] justify-center ${
            isHovered ? 'scale-105 -translate-y-1' : ''
          }`}
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
              : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
            borderColor: 'rgba(220, 38, 38, 0.4)'
          }}
        >
          <FontAwesomeIcon
            icon={faPhoneSlash}
            className={`text-lg transition-all duration-300 ${
              isHovered ? 'rotate-12 scale-110' : ''
            }`}
          />
          <span className="text-base">Завершить звонок</span>

          {/* Animated background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
               style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%)' }}></div>

          {/* Shimmer effect */}
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform transition-transform duration-1000 ${
            isHovered ? 'translate-x-[-200%]' : 'translate-x-full'
          }`}></div>

          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>

          {/* Glow effect */}
          <div className={`absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500 -z-10 blur-lg ${
            isHovered ? 'opacity-40' : ''
          }`}
               style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}></div>

          {/* Corner accents */}
          <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-2xl opacity-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : ''
          }`}></div>
          <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-2xl opacity-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : ''
          }`}></div>
        </button>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none"></div>
    </footer>
  );
};

export default CallFooter;
