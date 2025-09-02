"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import gsap from "gsap";
import Logo from "@/assets/logosaas.png";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = "Загрузка...",
  fullScreen = true
}: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const outerRingRef = useRef<HTMLDivElement>(null);
  const innerRingRef = useRef<HTMLDivElement>(null);
  const gradientRingRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const pulseLineRef = useRef<SVGSVGElement>(null);
  const heartbeatRef = useRef<HTMLDivElement>(null);
  const ekcLineRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    
    // Set initial states
    gsap.set([spinnerRef.current, textRef.current, dotsRef.current], {
      opacity: 0,
      y: 30
    });

    gsap.set(lettersRef.current, {
      opacity: 0,
      y: 50,
      rotationX: -90,
      scale: 0.5
    });

    gsap.set(heartbeatRef.current, { scale: 0 });
    gsap.set(pulseLineRef.current, { opacity: 0 });

    // Main animation sequence
    // Animate letters first
    tl.to(lettersRef.current, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      scale: 1,
      duration: 0.8,
      stagger: {
        amount: 1.2,
        from: "start",
        ease: "back.out(1.7)"
      },
      ease: "back.out(1.7)"
    })
    .to(spinnerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, "-=0.6")
    .to(heartbeatRef.current, {
      scale: 1,
      duration: 0.6
    }, "-=0.4")
    .to(pulseLineRef.current, {
      opacity: 1,
      duration: 0.5
    }, "-=0.3")
    .to(textRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6
    }, "-=0.2")
    .to(dotsRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.4
    }, "-=0.1");

    // Continuous animations - Medical pulse effect
    gsap.to(heartbeatRef.current, {
      scale: 1.1,
      duration: 0.15,
      repeat: -1,
      repeatDelay: 1.5,
      yoyo: true,
      ease: "power2.out"
    });

    // EKG line continuous animation
    gsap.to(ekcLineRef.current, {
      x: "320px",
      duration: 2,
      repeat: -1,
      ease: "none"
    });

    // Letter hover effects
    lettersRef.current.forEach((letter, index) => {
      if (letter) {
        gsap.to(letter, {
          y: -10,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.1
        });

        // Color cycling animation
        gsap.to(letter, {
          color: "#00D4FF",
          duration: 3,
          repeat: -1,
          yoyo: true,
          delay: index * 0.2,
          ease: "sine.inOut"
        });
      }
    });

    // Floating orbs animation
    orbsRef.current.forEach((orb, index) => {
      if (orb) {
        gsap.set(orb, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          opacity: Math.random() * 0.6 + 0.2
        });

        gsap.to(orb, {
          x: `+=${Math.random() * 200 - 100}`,
          y: `+=${Math.random() * 200 - 100}`,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2
        });

        gsap.to(orb, {
          opacity: Math.random() * 0.8 + 0.2,
          duration: Math.random() * 2 + 1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    });

    // Particle system animation
    if (particlesRef.current) {
      const particles = particlesRef.current.children;
      Array.from(particles).forEach((particle, index) => {
        gsap.set(particle, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          scale: Math.random() * 0.5 + 0.5
        });

        gsap.to(particle, {
          y: "-=100",
          opacity: 0,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          delay: Math.random() * 2,
          ease: "none"
        });
      });
    }

    // Text typing effect
    if (textRef.current) {
      const text = message;
      const chars = text.split('');
      textRef.current.innerHTML = '';
      
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.opacity = '0';
        textRef.current?.appendChild(span);
        
        gsap.to(span, {
          opacity: 1,
          duration: 0.05,
          delay: 1.5 + index * 0.05,
          ease: "none"
        });
      });
    }

    // Cleanup function
    return () => {
      tl.kill();
      // Kill all tweens without specific targets to avoid ref warnings
      gsap.killTweensOf("*");
    };
  }, [message]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 bg-gradient-to-br from-[#1E34A0] via-[#1C212C] to-[#0F1419] overflow-hidden"
    : "w-full h-full bg-gradient-to-br from-[#1E34A0] via-[#1C212C] to-[#0F1419] overflow-hidden";

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#001E80]/10 to-[#3A50FF]/10 blur-3xl"></div>
      
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            ref={el => { orbsRef.current[i] = el; }}
            className={`absolute w-2 h-2 rounded-full ${
              i % 3 === 0 ? 'bg-[#3A50FF]/30' : 
              i % 3 === 1 ? 'bg-[#00D4FF]/30' : 'bg-[#FF6B6B]/30'
            } blur-sm`}
          />
        ))}
      </div>

      {/* Particle System */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
          />
        ))}
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 10s linear infinite'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
        {/* ZHANCARE Animated Letters */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-[#3A50FF]/10 rounded-full blur-3xl w-72 h-20 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
          <div className="relative z-10 flex items-center justify-center space-x-1">
            {['Z', 'H', 'A', 'N', 'C', 'A', 'R', 'E'].map((letter, index) => (
              <span
                key={index}
                ref={el => { lettersRef.current[index] = el; }}
                className={`text-6xl font-bold tracking-wider select-none cursor-default transform-gpu ${
                  letter === 'Z' || letter === 'H' || letter === 'A' || letter === 'N' 
                    ? 'text-white' 
                    : 'text-[#00D4FF]'
                }`}
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  textShadow: letter === 'Z' || letter === 'H' || letter === 'A' || letter === 'N' 
                    ? '0 0 20px rgba(255, 255, 255, 0.3)' 
                    : '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          
          {/* Medical Cross Symbol */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-8 h-8 relative">
              <div className="absolute top-1/2 left-1/2 w-6 h-1.5 bg-gradient-to-r from-[#3A50FF] to-[#00D4FF] transform -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-6 bg-gradient-to-b from-[#3A50FF] to-[#00D4FF] transform -translate-x-1/2 -translate-y-1/2 rounded-full" />
            </div>
          </div>
        </div>

        {/* Medical Pulse Loading Indicator */}
        <div ref={spinnerRef} className="relative w-80 h-32 mb-8">
          {/* EKG Background Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 transform -translate-y-1/2" />
          
          {/* Animated EKG Pulse Line */}
          <div 
            ref={ekcLineRef}
            className="absolute top-1/2 left-0 h-0.5 transform -translate-y-1/2"
            style={{
              background: 'linear-gradient(90deg, transparent, #00D4FF, #3A50FF, #00D4FF, transparent)',
              width: '100px',
              animation: 'ekgMove 2s linear infinite'
            }}
          />
          
          {/* Medical Cross Icon */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div 
              ref={heartbeatRef}
              className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white"
              >
                <path 
                  d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" 
                  fill="currentColor"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                />
                <path 
                  d="M12 6L12.5 10.5L17 11L12.5 11.5L12 16L11.5 11.5L7 11L11.5 10.5L12 6Z" 
                  fill="#3A50FF"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite 0.2s' }}
                />
              </svg>
            </div>
          </div>
          
          {/* Heartbeat Pulse Waves */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute w-16 h-16 border-2 border-[#00D4FF]/30 rounded-full"
                style={{
                  animation: `heartbeatWave 2s ease-out infinite ${i * 0.6}s`
                }}
              />
            ))}
          </div>
          
          {/* EKG Waveform Path */}
          <svg 
            ref={pulseLineRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-16"
            viewBox="0 0 200 50"
            fill="none"
          >
            <path
              d="M0,25 L40,25 L50,15 L55,35 L60,10 L65,40 L70,25 L200,25"
              stroke="url(#pulseGradient)"
              strokeWidth="2"
              fill="none"
              className="opacity-40"
              style={{
                strokeDasharray: '400',
                strokeDashoffset: '400',
                animation: 'drawPulse 3s ease-in-out infinite'
              }}
            />
            <defs>
              <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3A50FF" />
                <stop offset="50%" stopColor="#00D4FF" />
                <stop offset="100%" stopColor="#3A50FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Loading Text with Typing Effect */}
        <p
          ref={textRef}
          className="mt-8 text-xl font-medium text-white/90 tracking-wide"
        />

        {/* Medical Pulse Dots */}
        <div ref={dotsRef} className="flex space-x-4 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="relative"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-[#00D4FF] to-[#3A50FF] rounded-full" />
              <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-[#00D4FF] to-[#3A50FF] rounded-full blur-sm animate-ping" />
            </motion.div>
          ))}
        </div>

        {/* Medical Progress Bar */}
        <div className="mt-8 w-80 h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div className="h-full bg-gradient-to-r from-[#00D4FF] via-[#3A50FF] to-[#00D4FF] relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes ekgMove {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(320px); }
        }
        
        @keyframes heartbeatWave {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
        
        @keyframes drawPulse {
          0% {
            stroke-dashoffset: 400;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}