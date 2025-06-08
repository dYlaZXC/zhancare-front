"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const backdrop = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const modal = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const Confirmation: React.FC<ConfirmationProps> = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdrop}
        >
          <motion.div
            variants={modal}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Подтвердите вызов</h3>
            </div>

            <p className="text-gray-700 text-sm">
              Вы уверены, что хотите отправить заявку на вызов врача на указанный адрес? Убедитесь,
              что все данные введены верно.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Отмена
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                Подтвердить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Confirmation;
