"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface DataBar {
  width: string;
  backgroundOpacity: number;
  animationValues: number[];
  duration: number;
  delay: number;
  gradientDirection: "normal" | "reverse";
  label?: string;
  icon?: string;
  value?: string;
  color?: "primary" | "secondary" | "accent";
}

const dataBars: DataBar[] = [
  {
    width: "w-full",
    backgroundOpacity: 15,
    animationValues: [0.2, 0.95, 0.7, 0.85],
    duration: 4,
    delay: 0,
    gradientDirection: "normal",
    label: "Анализ нейронной сети",
    icon: "🧠",
    value: "94%",
    color: "primary"
  },
  {
    width: "w-5/6",
    backgroundOpacity: 12,
    animationValues: [0.3, 0.85, 0.6, 0.75],
    duration: 4.5,
    delay: 0.4,
    gradientDirection: "reverse",
    label: "Обработка данных",
    icon: "⚡",
    value: "87%",
    color: "secondary"
  },
  {
    width: "w-3/4",
    backgroundOpacity: 10,
    animationValues: [0.1, 0.78, 0.5, 0.68],
    duration: 5,
    delay: 0.8,
    gradientDirection: "normal",
    label: "Распознавание образов",
    icon: "🎯",
    value: "81%",
    color: "accent"
  },
  {
    width: "w-2/3",
    backgroundOpacity: 8,
    animationValues: [0.15, 0.72, 0.45, 0.62],
    duration: 5.5,
    delay: 1.2,
    gradientDirection: "reverse",
    label: "Прогнозное моделирование",
    icon: "📊",
    value: "76%",
    color: "primary"
  }
];

interface DataBarsProps {
  showLabels?: boolean;
  showValues?: boolean;
  showIcons?: boolean;
  containerDelay?: number;
  variant?: "default" | "glassmorphism" | "minimal";
  interactive?: boolean;
}

export default function DataBars({ 
  showLabels = false, 
  showValues = false,
  showIcons = false,
  containerDelay = 0,
  variant = "glassmorphism",
  interactive = true
}: DataBarsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [completedBars, setCompletedBars] = useState<Set<number>>(new Set());

  const getColorGradients = (color: "primary" | "secondary" | "accent", direction: "normal" | "reverse") => {
    const colors = {
      primary: direction === "normal" 
        ? { from: "#001E80", to: "#3A50FF" }
        : { from: "#3A50FF", to: "#001E80" },
      secondary: direction === "normal"
        ? { from: "#0029A3", to: "#4A5DFF" }
        : { from: "#4A5DFF", to: "#0029A3" },
      accent: direction === "normal"
        ? { from: "#001E80", to: "#6366F1" }
        : { from: "#6366F1", to: "#001E80" }
    };
    return colors[color];
  };

  const getGradient = (color: "primary" | "secondary" | "accent", direction: "normal" | "reverse") => {
    const colorGrads = getColorGradients(color, direction);
    return `from-[${colorGrads.from}] to-[${colorGrads.to}]`;
  };

  const getBackgroundGradient = (color: "primary" | "secondary" | "accent", direction: "normal" | "reverse", opacity: number) => {
    const colorGrads = getColorGradients(color, direction);
    return `from-[${colorGrads.from}]/${opacity} to-[${colorGrads.to}]/${opacity}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      dataBars.forEach((_, index) => {
        setTimeout(() => {
          setCompletedBars(prev => new Set([...prev, index]));
        }, (containerDelay + index * 0.3 + 2) * 1000);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [containerDelay]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: containerDelay
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {dataBars.map((bar, index) => (
        <motion.div 
          key={index} 
          className="space-y-2"
          variants={itemVariants}
          onHoverStart={() => interactive && setHoveredIndex(index)}
          onHoverEnd={() => interactive && setHoveredIndex(null)}
        >
          {/* Заголовок с меткой, иконкой и значением */}
          {(showLabels || showIcons || showValues) && (
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: containerDelay + index * 0.2
              }}
            >
              <div className="flex items-center space-x-2">
                {showIcons && bar.icon && (
                  <motion.span
                    className="text-sm"
                    animate={hoveredIndex === index ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {bar.icon}
                  </motion.span>
                )}
                {showLabels && bar.label && (
                  <span className="text-xs text-white/70 font-medium">
                    {bar.label}
                  </span>
                )}
              </div>
              
              {showValues && bar.value && (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: completedBars.has(index) ? 1 : 0.5, 
                    scale: completedBars.has(index) ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <span className={`text-sm font-bold bg-gradient-to-r ${getGradient(bar.color || "primary", bar.gradientDirection)} bg-clip-text text-transparent`}>
                    {bar.value}
                  </span>
                  {completedBars.has(index) && (
                    <motion.span
                      className="text-green-400 text-xs"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* Контейнер полосы прогресса */}
          <motion.div 
            className={`
              h-4 relative overflow-hidden rounded-full backdrop-blur-sm
              ${variant === "glassmorphism" ? "bg-white/5 border border-white/10 shadow-lg" : ""}
              ${bar.width}
            `}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ 
              duration: 1.2, 
              delay: containerDelay + index * 0.3,
              ease: "easeOut"
            }}
            whileHover={interactive ? { 
              scale: 1.02,
              y: -2,
              transition: { duration: 0.2 }
            } : {}}
          >
            {/* Фоновая дорожка */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getBackgroundGradient(bar.color || "primary", bar.gradientDirection, bar.backgroundOpacity)} rounded-full`} />
            
            {/* Заливка прогресса */}
            <motion.div
              className={`h-full bg-gradient-to-r ${getGradient(bar.color || "primary", bar.gradientDirection)} rounded-full relative overflow-hidden`}
              animate={{ scaleX: bar.animationValues }}
              transition={{ 
                duration: bar.duration, 
                repeat: Infinity,
                delay: bar.delay,
                ease: "easeInOut"
              }}
              style={{ transformOrigin: "left" }}
            >
              {/* Эффект мерцания */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                animate={{ 
                  x: ["-150%", "150%"],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: containerDelay + index * 0.4 + 1,
                  repeatDelay: 4,
                  ease: "easeInOut"
                }}
              />
              
              {/* Внутреннее свечение */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
            </motion.div>
            
            {/* Эффект пульсации при наведении */}
            {hoveredIndex === index && (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${getGradient(bar.color || "primary", bar.gradientDirection)} rounded-full`}
                animate={{ 
                  opacity: [0, 0.2, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}

            {/* Плавающие частицы */}
            {hoveredIndex === index && (
              <>
                {[...Array(3)].map((_, particleIndex) => (
                  <motion.div
                    key={particleIndex}
                    className="absolute w-1 h-1 bg-white/60 rounded-full"
                    style={{
                      left: `${20 + particleIndex * 25}%`,
                      top: "50%",
                      transform: "translateY(-50%)"
                    }}
                    animate={{
                      y: [-5, -15, -5],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: particleIndex * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </motion.div>
      ))}
      
      {/* Улучшенные индикаторы прогресса */}
      <motion.div 
        className="flex justify-center items-center space-x-3 pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: containerDelay + 2 }}
      >
        {dataBars.map((bar, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center space-y-1"
          >
            <motion.div
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${getGradient(bar.color || "primary", bar.gradientDirection)}`}
              animate={{ 
                scale: completedBars.has(index) ? [1, 1.4, 1] : [1, 1.2, 1],
                opacity: completedBars.has(index) ? [0.7, 1, 0.7] : [0.4, 0.8, 0.4]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.15
              }}
            />
            {showValues && (
              <motion.div
                className="text-[10px] text-white/50 font-mono"
                animate={{ opacity: completedBars.has(index) ? 1 : 0.3 }}
              >
                {Math.round((bar.animationValues[1] || 0.8) * 100)}%
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Общий обзор прогресса */}
      <motion.div
        className="text-center pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: containerDelay + 3 }}
      >
        <div className="text-xs text-white/50">
          Производительность системы ИИ: {completedBars.size}/{dataBars.length} модулей активно
        </div>
      </motion.div>
    </motion.div>
  );
}