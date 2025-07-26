import { motion } from "framer-motion";
import { X } from "lucide-react"; // или используйте ✕ как текстовую иконку

type Props = {
  title: string;
  onClose: () => void;
};

export const ChatHeader = ({ title, onClose }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3 flex justify-between items-center"
    >
      <h2 className="text-base font-semibold truncate">{title}</h2>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClose}
        aria-label="Close chat"
        className="text-white hover:text-gray-300 transition-colors"
      >
        {/* Заменить на <X className="w-5 h-5" /> если используешь lucide-react */}
        ✕
      </motion.button>
    </motion.div>
  );
};
