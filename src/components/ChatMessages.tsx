import { motion, AnimatePresence } from "framer-motion";
import { User, Bot, AlertCircle, Sparkles } from "lucide-react";

type Props = {
  messages: { user: string; response: string; timestamp: string; showGameButton?: boolean }[];
  loading: boolean;
  error: string;
  translations: any;
  containerRef: React.RefObject<HTMLDivElement>;
  streamedResponse: string;
  onPlayGame?: () => void;
};

export const ChatMessages = ({
  messages,
  loading,
  error,
  translations,
  containerRef,
  streamedResponse,
  onPlayGame,
}: Props) => (
  <div
    ref={containerRef}
    className="relative h-[45vh] overflow-y-auto px-3 sm:px-6 py-4 space-y-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
    style={{
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
      `,
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgb(148 163 184) transparent'
    }}
  >
    <AnimatePresence initial={false}>
      {messages.map((msg, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="space-y-3"
        >
          {/* User message */}
          <div className="flex items-end justify-end gap-3 group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-[80%] shadow-lg shadow-blue-500/20 backdrop-blur-sm"
            >
              {/* Message background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl rounded-br-md" />
              <div className="absolute inset-0 bg-white/5 rounded-2xl rounded-br-md backdrop-blur-sm" />
              
              <div className="relative z-10">
                <p className="break-words leading-relaxed text-sm font-medium">
                  {msg.user}
                </p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <span className="text-[10px] text-blue-100/80 font-medium">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
              
              {/* Message tail */}
              <div className="absolute -bottom-0 -right-0 w-0 h-0 border-l-[12px] border-l-indigo-700 border-t-[12px] border-t-transparent" />
            </motion.div>
            
            {/* User avatar */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex-shrink-0"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
                <User className="w-5 h-5 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>

          {/* AI message */}
          {(msg.response || (index === messages.length - 1 && streamedResponse)) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex items-end justify-start gap-3 group"
            >
              {/* AI avatar */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="relative flex-shrink-0"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-200 dark:ring-purple-800">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <motion.div
                  className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
                {/* AI thinking indicator */}
                {index === messages.length - 1 && streamedResponse && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                    animate={{
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%] shadow-lg shadow-slate-500/10 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm"
              >
                {/* Message background effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-700/50 rounded-2xl rounded-bl-md" />
                
                <div className="relative z-10">
                  <div className="break-words leading-relaxed text-sm space-y-2">
                    {(index === messages.length - 1 && streamedResponse
                      ? streamedResponse
                      : msg.response
                    ).split('\n').map((paragraph, pIndex) => {
                      if (!paragraph.trim()) return null;
                      
                      // Check if it's a numbered list item
                      const numberedMatch = paragraph.match(/^(\d+)\.\s*(.+)/);
                      if (numberedMatch) {
                        return (
                          <div key={pIndex} className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                              {numberedMatch[1]}
                            </span>
                            <p className="flex-1">{numberedMatch[2]}</p>
                          </div>
                        );
                      }
                      
                      // Check if it's a bullet point
                      if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                        return (
                          <div key={pIndex} className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                            <p className="flex-1">{paragraph.replace(/^[-•]\s*/, '')}</p>
                          </div>
                        );
                      }
                      
                      // Check if it's a question
                      if (paragraph.trim().endsWith('?')) {
                        return (
                          <div key={pIndex} className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 pl-3 py-2 rounded-r-lg">
                            <p className="font-medium text-blue-800 dark:text-blue-200">{paragraph}</p>
                          </div>
                        );
                      }
                      
                      // Regular paragraph
                      return (
                        <p key={pIndex} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      );
                    }).filter(Boolean)}
                  </div>
                  
                  {/* Game button if showGameButton is true */}
                  {msg.showGameButton && onPlayGame && (
                    <motion.button
                      onClick={onPlayGame}
                      className="mt-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      🎮 Играть в медицинскую викторину
                    </motion.button>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        AI Assistant
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
                
                {/* Message tail */}
                <div className="absolute -bottom-0 -left-0 w-0 h-0 border-r-[12px] border-r-slate-100 dark:border-r-slate-800 border-t-[12px] border-t-transparent" />
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </AnimatePresence>

    {/* Enhanced typing indicator */}
    {loading && !streamedResponse && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-end justify-start gap-3"
      >
        {/* AI avatar with enhanced animation */}
        <motion.div
          className="relative flex-shrink-0"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-purple-200 dark:ring-purple-800">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <motion.div
            className="absolute inset-0 bg-purple-400 rounded-full blur-md"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Thinking indicator */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        <motion.div
          className="relative bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg shadow-slate-500/10 dark:shadow-slate-900/30 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{translations.typing}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  animate={{
                    y: [-2, -8, -2],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>
          {/* Message tail */}
          <div className="absolute -bottom-0 -left-0 w-0 h-0 border-r-[12px] border-r-slate-100 dark:border-r-slate-800 border-t-[12px] border-t-transparent" />
        </motion.div>
      </motion.div>
    )}

    {/* Enhanced error display */}
    {error && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 shadow-lg"
      >
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
      </motion.div>
    )}
  </div>
);