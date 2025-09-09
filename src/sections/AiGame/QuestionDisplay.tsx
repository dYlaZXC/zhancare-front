import { motion } from "framer-motion";
import {QuestionDisplayProps} from "./types";
import { FileText, CheckCircle, XCircle, ArrowRight, BookOpen } from "lucide-react";

export function QuestionDisplay({
  symptoms,
  options,
  answer,
  selected,
  typing,
  result,
  explanation,
  onSelect,
  onNext,
}: QuestionDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">
            Угадай диагноз по симптомам
          </h3>
        </div>
      </motion.div>

      {/* Symptoms Display */}
      <motion.div 
        className="backdrop-blur-md rounded-xl p-6 border border-white/20 relative overflow-hidden"
        style={{ background: 'rgba(40, 51, 83, 0.3)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Background decoration */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full blur-md animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.3) 0%, transparent 70%)' }}></div>
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-blue-100/70 mb-2">Симптомы пациента:</p>
          <p className="text-white text-lg font-medium leading-relaxed min-h-[48px]">
            {symptoms || (typing ? "Загрузка симптомов..." : "")}
            {typing && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </motion.div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, idx) => {
          const isCorrect = selected && option === answer;
          const isWrong = selected && option === selected && !isCorrect;
          
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.97 }}
              disabled={!!selected || typing}
              onClick={() => onSelect(option)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className={`w-full group relative overflow-hidden px-6 py-4 rounded-xl font-medium text-left transition-all duration-300 disabled:opacity-70 ${
                isCorrect
                  ? "text-white shadow-2xl"
                  : isWrong
                  ? "text-white shadow-2xl"
                  : "text-white hover:shadow-xl hover:-translate-y-0.5"
              }`}
              style={{
                background: isCorrect
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isWrong
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'rgba(235, 241, 255, 0.1)',
                border: isCorrect
                  ? '2px solid rgba(16, 185, 129, 0.5)'
                  : isWrong
                  ? '2px solid rgba(239, 68, 68, 0.5)'
                  : '2px solid rgba(235, 241, 255, 0.2)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="break-words flex-1 pr-4">{option}</span>
                {isCorrect && <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />}
                {isWrong && <XCircle className="w-5 h-5 text-white flex-shrink-0" />}
              </div>
              
              {/* Hover effect for unselected options */}
              {!selected && !typing && (
                <>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" 
                       style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(41, 53, 143, 0.1) 100%)' }}></div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                </>
              )}
              
              {/* Success/Error glow effects */}
              {isCorrect && (
                <div className="absolute -inset-0.5 rounded-xl opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                     style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
              )}
              {isWrong && (
                <div className="absolute -inset-0.5 rounded-xl opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                     style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}></div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Result Message */}
      {result && (
        <motion.div
          className={`backdrop-blur-md rounded-xl p-4 border text-center ${
            result.includes('✅') 
              ? 'border-green-400/30 bg-green-900/20' 
              : 'border-red-400/30 bg-red-900/20'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-lg font-semibold text-white">{result}</p>
        </motion.div>
      )}

      {/* Explanation - Only show when user answered incorrectly and explanation exists */}
      {result && !result.includes('✅') && explanation && (
        <motion.div
          className="backdrop-blur-md rounded-xl p-6 border border-blue-400/30 bg-blue-900/10 relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Background decoration */}
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full blur-md animate-pulse"
               style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <span className="text-white text-sm">🤖</span>
              </div>
              <h4 className="text-lg font-bold text-blue-100">AI объяснение</h4>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                <p className="text-blue-100/90 text-sm font-medium mb-2">
                  <strong>Почему правильный ответ: "{answer}"</strong>
                </p>
                <p className="text-white/90 leading-relaxed text-sm">
                  {explanation}
                </p>
              </div>
              
              {/* Learning tip */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-400/20">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">💡</span>
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Для запоминания:</p>
                  <p className="text-green-100/80 text-xs leading-relaxed">
                    Обратите внимание на ключевые симптомы и их связь с диагнозом для улучшения ваших медицинских знаний!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Next Button */}
      {result && (
        <motion.div 
          className="flex justify-center pt-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={onNext}
            className="group relative overflow-hidden px-8 py-4 rounded-xl text-white font-semibold flex items-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
              border: '1px solid rgba(55, 114, 255, 0.3)'
            }}
          >
            <span>Следующий вопрос</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            
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
      )}
    </div>
  );
}
