import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, Mic } from "lucide-react";
import { useState } from "react";

type Props = {
  userInput: string;
  setUserInput: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  translations: any;
  inputRef: React.RefObject<HTMLTextAreaElement>;
};

export const ChatInput = ({
  userInput,
  setUserInput,
  onSend,
  loading,
  translations,
  inputRef,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = !loading && userInput.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-t border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5" />
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="flex items-end gap-3 w-full max-w-4xl mx-auto">
          {/* Input container */}
          <div className="flex-1 relative">
            {/* Input wrapper with enhanced styling */}
            <motion.div
              className={`
                relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                ${isFocused 
                  ? 'border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'border-slate-300 dark:border-slate-600 shadow-sm'
                }
                ${loading ? 'opacity-70' : ''}
              `}
              whileHover={!loading ? { scale: 1.01 } : {}}
              animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
            >
              {/* Input background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
              
              {/* Focused glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-0"
                animate={{ opacity: isFocused ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              {/* Textarea */}
              <textarea
                ref={inputRef}
                rows={1}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={translations.placeholder}
                className="
                  relative z-10 w-full resize-none bg-transparent px-4 py-3 pr-12
                  text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400
                  text-sm leading-relaxed focus:outline-none max-h-32 overflow-y-auto
                  font-medium
                "
                disabled={loading}
                style={{
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  minHeight: "48px",
                }}
              />

              {/* Character indicator for long messages */}
              {userInput.length > 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 left-4 text-xs text-slate-400 dark:text-slate-500 font-medium"
                >
                  {userInput.length}/500
                </motion.div>
              )}

              {/* Voice input button (placeholder) */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-600/80 hover:bg-slate-300 dark:hover:bg-slate-500 flex items-center justify-center transition-colors group"
                type="button"
                disabled={loading}
              >
                <Mic className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100" />
              </motion.button>
            </motion.div>


          </div>

          {/* Send button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={canSend ? { scale: 1.05 } : {}}
            disabled={!canSend}
            onClick={onSend}
            className={`
              relative overflow-hidden group flex items-center justify-center gap-2 px-4 py-3 rounded-2xl
              font-semibold text-sm transition-all duration-300 min-w-[48px] h-12
              ${canSend
                ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {/* Button background effects */}
            {canSend && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </>
            )}

            {/* Button content */}
            <div className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden sm:inline">
                    {translations.sending}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {translations.sendButton}
                  </span>
                </>
              )}
            </div>

            {/* Sparkle effects on hover */}
            {canSend && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                whileHover={{
                  background: [
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>

        {/* Enhanced status indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-3 px-1"
        >
          {/* Left side - AI status */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <motion.div
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span className="font-medium">AI Ready</span>
            </div>
            <Sparkles className="w-3 h-3 text-yellow-500" />
          </div>

          {/* Right side - shortcuts */}
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Enter</kbd> to send
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};