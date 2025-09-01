"use client";
import { Download, Edit, Save, X } from "lucide-react";

interface ProfileHeaderProps {
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDownloadPDF: () => void;
}

export const ProfileHeader = ({
  isEditing,
  onEditToggle,
  onSave,
  onCancel,
  onDownloadPDF
}: ProfileHeaderProps) => {
  return (
    <div className="mb-4 sm:mb-6 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Header Content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            Медицинский профиль
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 leading-relaxed">
            Управление личными данными и медицинской информацией
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* PDF Download Button */}
          <button
            onClick={onDownloadPDF}
            className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm sm:text-base font-medium order-2 sm:order-1"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">PDF</span>
          </button>
          
          {/* Edit/Save/Cancel Buttons */}
          {!isEditing ? (
            <button
              onClick={onEditToggle}
              className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base font-medium order-1 sm:order-2"
            >
              <Edit className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Редактировать</span>
            </button>
          ) : (
            <div className="flex flex-col xs:flex-row gap-2 order-1 sm:order-2">
              {/* Save Button */}
              <button
                onClick={onSave}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                <Save className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Сохранить</span>
              </button>
              
              {/* Cancel Button */}
              <button
                onClick={onCancel}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Отмена</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};