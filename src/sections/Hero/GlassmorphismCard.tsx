"use client";

import { motion } from "framer-motion";

interface GlassmorphismCardProps {
  title: string;
  value: string;
  trend?: string;
  delay?: number;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function GlassmorphismCard({ 
  title, 
  value, 
  trend, 
  delay = 0,
  icon,
  size = 'md'
}: GlassmorphismCardProps) {
  
  const sizeClasses = {
    sm: 'p-3 rounded-xl',
    md: 'p-4 rounded-2xl',
    lg: 'p-6 rounded-3xl'
  };

  const textSizes = {
    sm: { title: 'text-xs', value: 'text-sm', trend: 'text-xs' },
    md: { title: 'text-sm', value: 'text-lg', trend: 'text-xs' },
    lg: { title: 'text-base', value: 'text-2xl', trend: 'text-sm' }
  };

  const isPositiveTrend = trend?.startsWith('+');

  return (
    <motion.div
      className={`
        bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl
        relative overflow-hidden group hover:bg-white/15 transition-all duration-300
        ${sizeClasses[size]}
      `}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.6,
        type: "spring",
        damping: 20,
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="w-6 h-6 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className={`${textSizes[size].title} text-white/80 font-medium`}>
              {title}
            </h3>
          </div>
          
          {/* Status Indicator */}
          <motion.div
            className="w-2 h-2 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: delay + 0.5
            }}
          />
        </div>
        
        {/* Value */}
        <motion.div
          className={`${textSizes[size].value} font-bold text-white mb-1`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          {value}
        </motion.div>
        
        {/* Trend */}
        {trend && (
          <motion.div
            className={`
              ${textSizes[size].trend} font-medium flex items-center space-x-1
              ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}
            `}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.5 }}
          >
            <span>{isPositiveTrend ? '↗' : '↘'}</span>
            <span>{trend}</span>
          </motion.div>
        )}
      </div>
      
      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Corner Accents */}
      <div className="absolute top-0 right-0 w-8 h-8">
        <div className="absolute top-1 right-1 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute top-2 right-3 w-0.5 h-0.5 bg-white/30 rounded-full"></div>
      </div>
    </motion.div>
  );
}