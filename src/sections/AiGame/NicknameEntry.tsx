import { NicknameEntryProps } from "./types";
import { motion } from "framer-motion";
import { User, Sparkles, Rocket } from "lucide-react";

export function NicknameEntry({
  nickname,
  onNicknameChange,
  onGenerate,
  loading,
  onStart,
}: NicknameEntryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-lg mx-auto"
    >
      {/* Modern Glass Card */}
      <div 
        className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 relative overflow-hidden"
        style={{ background: 'rgba(235, 241, 255, 0.08)' }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full blur-xl animate-pulse" 
               style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.2) 0%, transparent 70%)', animationDuration: '4s' }}></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full blur-lg animate-bounce" 
               style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.25) 0%, transparent 70%)', animationDuration: '3s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full blur-md animate-ping" 
               style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.3) 0%, transparent 70%)', animationDuration: '2s' }}></div>
        </div>

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <motion.div 
            className="inline-flex items-center gap-3 mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}>
              <span className="text-2xl">🧠</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AI Викторина
            </h2>
          </motion.div>
          <p className="text-blue-100/80 text-sm">Проверьте свои медицинские знания с помощью ИИ</p>
        </div>

        {/* Nickname Input */}
        <div className="space-y-6 relative z-10">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-300"
                 style={nickname ? 
                   { background: 'rgba(55, 114, 255, 0.15)', border: '1px solid rgba(55, 114, 255, 0.2)' } : 
                   { background: 'rgba(156, 163, 175, 0.15)', border: '1px solid rgba(156, 163, 175, 0.2)' }
                 }>
              <User className={`w-3 h-3 transition-all duration-300 ${
                nickname ? 'text-blue-300' : 'text-gray-400 group-hover:text-blue-400'
              }`} />
            </div>
            
            <input
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="Введите никнейм"
              className={`w-full pl-11 pr-4 py-4 rounded-xl transition-all duration-300 font-medium text-base ${
                nickname
                  ? 'border-2 border-blue-200/40 bg-blue-50/20 text-white placeholder:text-blue-200 focus:ring-4 focus:ring-blue-200/30 focus:border-blue-300/60'
                  : 'border-2 border-gray-200/30 bg-gray-50/10 text-white placeholder:text-gray-300 focus:ring-4 focus:ring-blue-200/30 focus:border-blue-300/60 hover:border-gray-300/40'
              }`}
              style={{
                boxShadow: nickname 
                  ? '0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  : '0 0 0 1px rgba(156, 163, 175, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)'
              }}
            />
            
            {/* Input glow effect */}
            <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${
              nickname ? 'group-focus-within:opacity-20' : 'group-focus-within:opacity-10'
            }`}
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={loading}
            className="w-full group relative overflow-hidden min-h-[52px] px-6 py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
            style={{
              background: loading 
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <Sparkles className="w-5 h-5" />
            <span>{loading ? "Генерация..." : "Сгенерировать никнейм AI"}</span>
            
            {!loading && (
              <>
                {/* Animated background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" 
                     style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)' }}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
              </>
            )}
          </button>

          {/* Start Button */}
          <button
            onClick={onStart}
            disabled={!nickname.trim()}
            className="w-full group relative overflow-hidden min-h-[56px] px-6 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
            style={{
              background: nickname.trim()
                ? 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              border: `1px solid ${nickname.trim() ? 'rgba(55, 114, 255, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
            }}
          >
            <Rocket className="w-5 h-5" />
            <span>Начать игру</span>
            
            {nickname.trim() && (
              <>
                {/* Animated background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" 
                     style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.2) 0%, rgba(41, 53, 143, 0.2) 100%)' }}></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                
                {/* Button glow effect */}
                <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}></div>
              </>
            )}
          </button>
        </div>

        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl"></div>
      </div>
    </motion.div>
  );
}
