"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faSave, faFilePdf } from "@fortawesome/free-solid-svg-icons";

interface Props {
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onDownloadPDF: () => void;
  stats: { label: string; value: number }[];
}

const ProfileHeader: React.FC<Props> = ({ isEditing, onEditToggle, onSave, onDownloadPDF, stats }) => {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 pb-3 mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Карточка пациента</h2>
          <p className="text-xs text-gray-400">
            Информация на{" "}
            {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date())}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={isEditing ? onSave : onEditToggle}
            className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow"
          >
            <FontAwesomeIcon icon={isEditing ? faSave : faEdit} />
            {isEditing ? "Сохранить" : "Редактировать"}
          </button>
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-full shadow"
          >
            <FontAwesomeIcon icon={faFilePdf} /> PDF
          </button>
        </div>
      </div>
      <div className="flex gap-4">
        {stats.map((s, i) => (
          <div key={i} className="text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{s.value}</span> — {s.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileHeader;
