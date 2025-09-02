"use client";
import { useEffect, useRef } from "react";
import { gsap } from 'gsap';

interface AnimatedLogoProps {
  className?: string;
  animate?: boolean;
  size?: "responsive";
  fontFamily?: "montserrat" | "open-sans";
  fontWeight?: "normal" | "semibold" | "bold";
}

const AnimatedLogo = ({
  className = "",
  animate = true,
  size = "responsive",
  fontFamily = "montserrat",
  fontWeight = "bold"
}: AnimatedLogoProps) => {
  const logoRef = useRef(null);
  const heartbeatRef = useRef(null);
  const textRef = useRef(null);
  const pulseRef = useRef(null);
  const logoContainerRef = useRef(null);

  useEffect(() => {
    // Set everything to static visible state - no animations
    gsap.set([heartbeatRef.current, textRef.current], {
      opacity: 1,
      scale: 1
    });

    gsap.set(logoContainerRef.current, {
      scale: 1
    });

    gsap.set(pulseRef.current, {
      scale: 1,
      opacity: 0.4
    });

    // No animations - everything is static
  }, [animate]);

  // Font family mapping
  const getFontFamily = () => {
    switch (fontFamily) {
      case "montserrat":
        return "Montserrat, system-ui, -apple-system, sans-serif";
      case "open-sans":
        return "'Open Sans', system-ui, -apple-system, sans-serif";
      default:
        return "system-ui, -apple-system, sans-serif";
    }
  };

  // Font weight mapping
  const getFontWeight = () => {
    switch (fontWeight) {
      case "normal":
        return "400";
      case "semibold":
        return "600";
      case "bold":
        return "700";
      default:
        return "700";
    }
  };

  // Heartbeat path - realistic EKG pattern
  const heartbeatPath = "M2,15 L8,15 L12,5 L16,25 L20,10 L24,15 L35,15";

  return (
    <div
      ref={logoRef}
      className={`h-5 xs:h-6 sm:h-8 md:h-10 lg:h-12 laptop-hd:h-8 desktop-fhd:h-10 w-auto flex items-center ${className}`}
    >
      <div ref={logoContainerRef} className="relative">
        <svg
          viewBox="0 0 180 30"
          className="w-full h-full relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Heartbeat line */}
          <path
            ref={heartbeatRef}
            d={heartbeatPath}
            stroke="url(#heartbeatGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Text */}
          <text
            ref={textRef}
            x="42"
            y="20"
            className="text-base"
            fill="url(#textGradient)"
            style={{ 
              fontFamily: getFontFamily(),
              fontSize: '14px',
              fontWeight: getFontWeight()
            }}
          >
            ZhanCare.AI
          </text>

          {/* Gradients */}
          <defs>
            <linearGradient id="heartbeatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#1D4ED8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Pulse wave - positioned absolutely behind the logo */}
        <div
          ref={pulseRef}
          className="absolute top-1/2 left-5 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(29, 78, 216, 0.2) 70%, rgba(30, 64, 175, 0) 100%)',
            zIndex: -1
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedLogo;