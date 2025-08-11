"use client";

import { motion } from "framer-motion";

export default function CircuitPattern() {
  return (
    <div className="h-80 bg-gradient-to-br from-[#001E80]/5 to-[#3A50FF]/10 rounded-2xl relative overflow-hidden">
      <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 300">
        <defs>
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#001E80" />
            <stop offset="100%" stopColor="#3A50FF" />
          </linearGradient>
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#001E80" stopOpacity="0" />
            <stop offset="50%" stopColor="#3A50FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#001E80" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main Circuit Paths */}
        <motion.path
          d="M50 50 L150 50 L150 100 L250 100 L250 150 L350 150"
          stroke="url(#circuitGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        <motion.path
          d="M50 200 L100 200 L100 150 L200 150 L200 100 L300 100"
          stroke="url(#circuitGradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 0.3, ease: "easeInOut" }}
        />

        <motion.path
          d="M80 250 L180 250 L180 200 L280 200 L280 180 L350 180"
          stroke="url(#circuitGradient)"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 0.6, ease: "easeInOut" }}
        />

        {/* Circuit Nodes */}
        <motion.circle
          cx="150" cy="50" r="8" fill="url(#circuitGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <motion.circle
          cx="250" cy="100" r="6" fill="url(#circuitGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        />
        <motion.circle
          cx="100" cy="150" r="7" fill="url(#circuitGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        />
        <motion.circle
          cx="180" cy="200" r="5" fill="url(#circuitGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.8, duration: 0.5 }}
        />

        {/* Data Pulses */}
        <motion.circle
          r="3" fill="#3A50FF" opacity="0.8"
          animate={{
            cx: [50, 150, 250, 350],
            cy: [50, 50, 100, 150],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.7, 1]
          }}
        />
        
        <motion.circle
          r="2.5" fill="#001E80" opacity="0.9"
          animate={{
            cx: [50, 100, 200, 300],
            cy: [200, 150, 100, 100],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
            times: [0, 0.3, 0.7, 1]
          }}
        />

        {/* Micro Circuits */}
        <g opacity="0.6">
          {[...Array(12)].map((_, i) => (
            <motion.rect
              key={i}
              x={120 + (i % 4) * 40}
              y={120 + Math.floor(i / 4) * 30}
              width="8"
              height="4"
              fill="url(#circuitGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </g>

        {/* Electronic Components */}
        <motion.rect
          x="140" y="40" width="20" height="10" rx="2"
          fill="none" stroke="url(#circuitGradient)" strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        />
        
        <motion.rect
          x="240" y="90" width="20" height="10" rx="2"
          fill="none" stroke="url(#circuitGradient)" strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 }}
        />

        {/* Connection Lines */}
        {[...Array(6)].map((_, i) => (
          <motion.line
            key={i}
            x1={80 + i * 30}
            y1={70}
            x2={80 + i * 30}
            y2={85}
            stroke="url(#circuitGradient)"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 1,
              delay: 2.5 + i * 0.1
            }}
          />
        ))}
      </svg>

      {/* Holographic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3A50FF]/5 to-transparent transform skew-x-12 -translate-x-full">
        <motion.div
          className="w-full h-full bg-gradient-to-r from-transparent via-[#3A50FF]/10 to-transparent"
          animate={{ x: ["0%", "400%"] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Info Panels */}
      <div className="absolute top-4 right-4 space-y-2">
        <motion.div
          className="bg-[#001E80]/20 backdrop-blur-sm rounded px-2 py-1 border border-[#3A50FF]/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3 }}
        >
          <div className="text-[10px] text-[#3A50FF] font-mono">CPU: 23%</div>
        </motion.div>
        <motion.div
          className="bg-[#3A50FF]/20 backdrop-blur-sm rounded px-2 py-1 border border-[#001E80]/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.3 }}
        >
          <div className="text-[10px] text-[#001E80] font-mono">RAM: 67%</div>
        </motion.div>
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <motion.div
          className="w-2 h-2 bg-[#3A50FF] rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-[#3A50FF] font-medium">System Active</span>
      </div>
    </div>
  );
}