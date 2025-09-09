import {LeaderboardProps} from "./types";
import { motion } from "framer-motion";
import { Trophy, Clock, Medal, RotateCcw, User, Award } from "lucide-react";

export function Leaderboard({ score, nickname, leaderboard, onRestart }: LeaderboardProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
        style={{ background: 'rgba(235, 241, 255, 0.08)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full blur-xl animate-pulse" 
               style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)', animationDuration: '4s' }}></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full blur-lg animate-bounce" 
               style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full blur-md animate-ping" 
               style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.3) 0%, transparent 70%)', animationDuration: '2s' }}></div>
        </div>

        {/* Header */}
        <motion.div 
          className="text-center mb-8 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Время вышло!
            </h2>
          </div>
        </motion.div>

        {/* User Score Display */}
        <motion.div
          className="text-center mb-8 relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div 
            className="inline-flex items-center gap-4 backdrop-blur-md rounded-2xl border border-white/20 px-8 py-6 relative overflow-hidden"
            style={{ background: 'rgba(40, 51, 83, 0.4)' }}
          >
            {/* User avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                {nickname.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -inset-1 rounded-2xl opacity-30 animate-pulse"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
            </div>
            
            <div className="text-left">
              <p className="text-blue-100/70 text-sm font-medium">Игрок</p>
              <p className="text-white text-lg font-bold">{nickname}</p>
            </div>

            {/* Score display */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <p className="text-yellow-100/70 text-sm font-medium">Итоговый счет</p>
                <p className="text-white text-2xl font-bold">{score}</p>
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl opacity-30 animate-pulse"
                     style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}></div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full blur-md animate-pulse"
                 style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.5) 0%, transparent 70%)' }}></div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          className="relative z-10 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <Award className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Топ-10 лидеров</h3>
          </div>
          
          <div 
            className="backdrop-blur-md rounded-xl border border-white/20 p-6 space-y-3 relative overflow-hidden"
            style={{ background: 'rgba(40, 51, 83, 0.3)' }}
          >
            {leaderboard.length === 0 ? (
              <p className="text-center text-gray-300 py-4">Таблица лидеров пуста</p>
            ) : (
              leaderboard.map((entry, idx) => (
                <motion.div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                    entry.nickname === nickname 
                      ? 'bg-blue-500/20 border border-blue-400/30' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 + 0.8 }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {idx < 3 ? (
                        idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                           style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
                        {entry.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-medium ${
                        entry.nickname === nickname ? 'text-blue-300' : 'text-white'
                      }`}>
                        {entry.nickname}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-white">{entry.score}</span>
                  </div>
                </motion.div>
              ))
            )}
            
            {/* Background decoration */}
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full blur-md animate-pulse"
                 style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%)' }}></div>
          </div>
        </motion.div>

        {/* Restart Button */}
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={onRestart}
            className="group relative overflow-hidden px-8 py-4 rounded-xl text-white font-bold flex items-center gap-3 mx-auto transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
              border: '1px solid rgba(55, 114, 255, 0.3)'
            }}
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            <span>Начать заново</span>
            
            {/* Animated background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" 
                 style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.2) 0%, rgba(41, 53, 143, 0.2) 100%)' }}></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            
            {/* Button glow effect */}
            <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
          </button>
        </motion.div>

        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
      </motion.div>
    </div>
  );
}
