import { motion } from "framer-motion";
import { X, Sparkles, Bot } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
};

export const ChatHeader = ({ title, onClose }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white px-6 py-4 flex justify-between items-center overflow-hidden"
    >
      {/* Background animated elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-indigo-600/20" />
      
      {/* Subtle animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
        {/* AI Bot Icon with animation */}
        <motion.div
          className="relative flex-shrink-0"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-sm"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-full">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Title with enhanced typography */}
        <div className="flex-1 min-w-0">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent truncate"
          >
            {title}
          </motion.h2>
          
          {/* Subtitle with status indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2 mt-0.5"
          >
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
            <span className="text-xs text-blue-200 font-medium">Online</span>
            <Sparkles className="w-3 h-3 text-yellow-400 ml-1" />
          </motion.div>
        </div>
      </div>

      {/* Enhanced close button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        whileHover={{ 
          scale: 1.1,
          rotate: 90,
        }}
        whileTap={{ 
          scale: 0.9,
          rotate: 180,
        }}
        onClick={onClose}
        aria-label="Close chat"
        className="relative z-10 group flex-shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
      >
        {/* Button background glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{
            scale: 1.2,
          }}
        />
        
        {/* Close icon */}
        <X className="w-5 h-5 text-white relative z-10 group-hover:text-red-100 transition-colors duration-300" />
        
        {/* Hover ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/30"
          whileHover={{
            scale: 1.3,
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 0.6 }}
        />
      </motion.button>

      {/* Top border accent */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
      />
    </motion.div>
  );
};