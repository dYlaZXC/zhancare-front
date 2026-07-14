"use client";

import { motion } from "framer-motion";
import { FaStethoscope } from "react-icons/fa";

export default function StreamingMessage() {
  return (
    <motion.div
      className="flex items-end gap-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)" }}
      >
        <FaStethoscope size={10} style={{ color: "#6AA2FF" }} />
      </div>

      <div
        className="flex items-center gap-2 px-4 py-3 rounded-[18px_18px_18px_4px]"
        style={{
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-1">
          {[0, 0.18, 0.36].map((delay, i) => (
            <motion.div
              key={i}
              className="w-[5px] h-[5px] rounded-full"
              style={{ background: "#6AA2FF" }}
              animate={{
                opacity: [0.25, 1, 0.25],
                scale: [0.8, 1.1, 0.8],
                y: [0, -2, 0],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
