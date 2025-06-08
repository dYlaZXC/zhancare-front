"use client";

import React from "react";

interface ConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 sm:px-6 md:px-8">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Подтверждение вызова
        </h3>
        <p className="text-gray-700">
          Вы уверены, что хотите оформить вызов на дом?
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#001E80] text-white rounded-lg hover:opacity-90 transition"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
