"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface CallButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  waiting: boolean;
}

const CallButton: React.FC<CallButtonProps> = ({ onClick, disabled, loading, waiting }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
      className={`px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 ease-out ${
        disabled
          ? "bg-gradient-to-r from-blue-800 to-blue-500 opacity-50 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-800 to-blue-500 hover:shadow-md"
      }`}
    >
      {waiting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" />
          Ожидание врача...
        </span>
      ) : loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin w-4 h-4" />
          Загружаем...
        </span>
      ) : (
        "Начать звонок"
      )}
    </motion.button>
  );
};

export default CallButton;
