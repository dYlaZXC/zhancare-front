import {TimerScorePanelProps} from "./types";
import { Clock, Trophy, Pause } from "lucide-react";
import { motion } from "framer-motion";

export function TimerScorePanel({ timeLeft, score, isPaused = false }: TimerScorePanelProps) {
  const progressPercentage = (timeLeft / 60) * 100;
  const isLowTime = timeLeft <= 10;
  
  return (
    <div className="flex justify-between items-center mb-8">
      {/* Timer */}
      <motion.div 
        className="relative"
        animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
        transition={isLowTime ? { duration: 0.5, repeat: Infinity } : {}}
      >
        <div 
          className="relative w-20 h-20 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(40, 51, 83, 0.3)' }}
        >
          {/* Background progress circle */}
          <svg className="absolute w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-600/30"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <motion.path
              className={isLowTime ? "text-red-400" : "text-blue-400"}
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "100, 100" }}
              animate={{ strokeDasharray: `${progressPercentage}, 100` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          
          {/* Timer content */}
          <div className="relative z-10 flex flex-col items-center">
            {isPaused ? (
              <Pause className="w-4 h-4 mb-1 text-yellow-400" />
            ) : (
              <Clock className={`w-4 h-4 mb-1 ${isLowTime ? 'text-red-400' : 'text-blue-400'}`} />
            )}
            <span className={`text-lg font-bold ${
              isPaused ? 'text-yellow-400' : isLowTime ? 'text-red-400' : 'text-white'
            }`}>
              {timeLeft}
            </span>
          </div>
          
          {/* Glow effect for low time */}
          {isLowTime && (
            <div className="absolute inset-0 rounded-2xl opacity-30 animate-pulse"
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
          )}
          
          {/* Background decoration */}
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full blur-sm animate-pulse"
               style={{ background: `radial-gradient(circle, ${
                 isPaused ? 'rgba(245, 158, 11, 0.5)' : isLowTime ? 'rgba(239, 68, 68, 0.5)' : 'rgba(55, 114, 255, 0.5)'
               } 0%, transparent 70%)` }}></div>
        </div>
      </motion.div>

      {/* Score */}
      <motion.div 
        className="relative"
        key={score}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="backdrop-blur-md rounded-2xl border border-white/20 px-6 py-4 flex items-center gap-3 relative overflow-hidden"
          style={{ background: 'rgba(40, 51, 83, 0.3)' }}
        >
          {/* Trophy icon with glow */}
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Trophy className="w-4 h-4 text-white" />
            </div>
            
            {/* Trophy glow */}
            <div className="absolute -inset-1 rounded-lg opacity-30 animate-pulse"
                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}></div>
          </div>
          
          {/* Score display */}
          <div>
            <p className="text-xs font-medium text-yellow-100/70 leading-none">Очки</p>
            <p className="text-xl font-bold text-white leading-tight">{score}</p>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full blur-sm animate-pulse"
               style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%)' }}></div>
          
          {/* Shimmer effect on score change */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full animate-shimmer"></div>
        </div>
      </motion.div>
    </div>
  );
}
