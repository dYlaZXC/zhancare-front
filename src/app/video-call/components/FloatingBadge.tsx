"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStethoscope, faUser, faGem } from "@fortawesome/free-solid-svg-icons";

interface FloatingBadgeProps {
  isDoctor: boolean;
  doctor: string;
}

const FloatingBadge: React.FC<FloatingBadgeProps> = ({ isDoctor, doctor }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute top-6 left-6 group z-20 transition-all duration-300 hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500"
           style={{
             background: `
               linear-gradient(135deg,
                 ${isDoctor ? 'rgba(55, 114, 255, 0.2)' : 'rgba(50, 103, 230, 0.2)'} 0%,
                 ${isDoctor ? 'rgba(50, 103, 230, 0.15)' : 'rgba(41, 53, 143, 0.15)'} 50%,
                 ${isDoctor ? 'rgba(41, 53, 143, 0.1)' : 'rgba(30, 38, 62, 0.1)'} 100%
               )
             `
           }}>

        {/* Content */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Icon Container */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'scale-110 rotate-12' : ''
          }`}
               style={{
                 background: isDoctor
                   ? 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)'
                   : 'linear-gradient(135deg, #295bbf 0%, #173373 100%)'
               }}>
            <FontAwesomeIcon
              icon={isDoctor ? faGem : faUser}
              className="text-white text-sm"
            />
          </div>

          {/* Text Content */}
          <div className="text-left">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <FontAwesomeIcon
                icon={faStethoscope}
                className="text-blue-300 text-xs"
              />
              {isDoctor ? "Вы врач" : `Врач: ${doctor}`}
            </div>

            {/* Role indicator */}
            <div className="text-white/70 text-xs mt-1">
              {isDoctor ? "Ведущий консультацию" : "Пациент"}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse ml-2 shadow-lg"></div>
        </div>

        {/* Hover shimmer effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform transition-transform duration-1000 ${
          isHovered ? 'translate-x-[-200%]' : 'translate-x-full'
        }`}></div>

        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>

        {/* Glow effect on hover */}
        <div className={`absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500 -z-10 blur-lg ${
          isHovered ? 'opacity-30' : ''
        }`}
             style={{
               background: isDoctor
                 ? 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)'
                 : 'linear-gradient(135deg, #295bbf 0%, #173373 100%)'
             }}></div>

        {/* Corner accents */}
        <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-2xl opacity-0 transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : ''
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-2xl opacity-0 transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : ''
        }`}></div>
      </div>

      {/* Floating particles effect */}
      <div className={`absolute -top-1 -left-1 w-2 h-2 bg-blue-400 rounded-full opacity-0 transition-all duration-700 ${
        isHovered ? 'opacity-100 animate-bounce' : ''
      }`} style={{ animationDelay: '0s' }}></div>
      <div className={`absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 transition-all duration-700 ${
        isHovered ? 'opacity-100 animate-bounce' : ''
      }`} style={{ animationDelay: '0.2s' }}></div>
      <div className={`absolute -bottom-1 -right-0.5 w-2 h-2 bg-indigo-400 rounded-full opacity-0 transition-all duration-700 ${
        isHovered ? 'opacity-100 animate-bounce' : ''
      }`} style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default FloatingBadge;
