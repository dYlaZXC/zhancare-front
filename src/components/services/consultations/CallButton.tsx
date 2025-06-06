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
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition shadow-sm ${
        disabled
          ? "bg-gradient-to-r from-[#001E80] to-[#3A50FF] opacity-50 cursor-not-allowed"
          : "bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white hover:shadow-lg"
      }`}
    >
      {waiting ? (
        <>
          <Loader2 className="animate-spin w-5 h-5 mr-2" />
          Ожидание врача...
        </>
      ) : (
        "Начать звонок"
      )}
    </motion.button>
  );
};

export default CallButton;
