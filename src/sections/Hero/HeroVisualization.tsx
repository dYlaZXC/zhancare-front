"use client";

import { motion } from "framer-motion";
import GlassmorphismCard from "./GlassmorphismCard";
import DataBars from "./DataBars";

interface HeroVisualizationProps {
  isInView: boolean;
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      duration: 0.6
    }
  }
};

export default function HeroVisualization({ isInView }: HeroVisualizationProps) {
  return (
    <motion.div 
      className="relative hidden lg:block"
      variants={itemVariants}
    >
      <div className="relative">
        {/* Многослойное фоновое свечение */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#001E80]/30 to-[#3A50FF]/30 rounded-3xl blur-3xl scale-110 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A50FF]/20 to-[#001E80]/20 rounded-3xl blur-2xl scale-105"></div>
        
        {/* Основной контейнер с эффектом стекла */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Плавающие стеклянные элементы */}
          <motion.div 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-lg"
            animate={{ 
              y: [0, -8, 0],
              rotateY: [0, 180, 360]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-3 h-3 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full shadow-md"></div>
          </motion.div>

          <motion.div 
            className="absolute bottom-8 left-8 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg"
            animate={{ 
              y: [0, 12, 0],
              rotateX: [0, 180, 360]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-[#3A50FF] to-[#001E80] rounded-full shadow-md"></div>
          </motion.div>

          <motion.div 
            className="absolute top-20 left-6 w-8 h-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-lg"
            animate={{ 
              x: [0, 15, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          >
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#001E80] to-[#3A50FF] rounded-full"></div>
          </motion.div>

          {/* Основная область содержимого */}
          <div className="space-y-6">
            {/* Верхняя сетка стеклянных карточек */}
            <div className="grid grid-cols-2 gap-4">
              <GlassmorphismCard 
                title="Точность ИИ"
                value="98.7%"
                trend="+2.3%"
                delay={0.5}
              />
              <GlassmorphismCard 
                title="Время отклика"
                value="1.2мс"
                trend="-0.8мс"
                delay={0.8}
              />
            </div>

            {/* Центральная большая стеклянная карточка */}
            <motion.div
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              {/* Анимированные кольца прогресса */}
              <div className="flex justify-center items-center h-32 relative">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#001E80" />
                      <stop offset="100%" stopColor="#3A50FF" />
                    </linearGradient>
                    <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3A50FF" />
                      <stop offset="100%" stopColor="#001E80" />
                    </linearGradient>
                  </defs>
                  
                  {/* Фоновые круги */}
                  <circle cx="60" cy="60" r="45" fill="none" stroke="white/10" strokeWidth="3" />
                  <circle cx="60" cy="60" r="30" fill="none" stroke="white/10" strokeWidth="2" />
                  
                  {/* Анимированные круги прогресса */}
                  <motion.circle
                    cx="60" cy="60" r="45" fill="none" 
                    stroke="url(#ringGradient1)" strokeWidth="3" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 0.75 }}
                    transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
                    style={{ pathLength: 0 }}
                  />
                  <motion.circle
                    cx="60" cy="60" r="30" fill="none" 
                    stroke="url(#ringGradient2)" strokeWidth="2" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 0.6 }}
                    transition={{ duration: 2.5, delay: 2, ease: "easeOut" }}
                    style={{ pathLength: 0 }}
                  />
                </svg>
                
                {/* Центральное содержимое */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-[#001E80] to-[#3A50FF] bg-clip-text text-transparent">
                      Ai
                    </div>
                    <div className="text-xs text-white/60">Обработка</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Полосы данных с эффектом стекла */}
            <motion.div
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 1.8, duration: 0.6 }}
            >
              <DataBars showLabels={true} containerDelay={2} />
            </motion.div>
          </div>

          {/* Тонкий фоновый узор */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-white to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-br from-white to-transparent rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Плавающие световые частицы */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}