"use client";

import { 
  Phone, 
  Languages, 
  MapPin, 
  Mail, 
  Flag, 
  Heart, 
  Briefcase, 
  Edit, 
  Check,
  X,
  User as UserIcon,
  Calendar,
  Globe
} from "lucide-react";
import { useState } from "react";
import { InfoCard } from "./InfoCard";
import { InfoRow } from "./InfoRow";
import { User } from "./types";

interface PersonalDetailsCardProps {
  user: User;
  isEditable?: boolean;
  onSave?: (updatedUser: Partial<User>) => void;
  showCompletionProgress?: boolean;
}

interface PersonalField {
  key: keyof User | string;
  label: string;
  icon?: React.ComponentType<any>;
  required?: boolean;
  editable?: boolean;
  type?: 'text' | 'email' | 'tel' | 'select';
  options?: string[];
  placeholder?: string;
  validator?: (value: string) => string | null;
}

export const PersonalDetailsCard = ({ 
  user, 
  isEditable = false,
  onSave,
  showCompletionProgress = false
}: PersonalDetailsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const personalFields: PersonalField[] = [
    {
      key: 'address',
      label: 'Адрес',
      icon: MapPin,
      required: true,
      editable: true,
      type: 'text',
      placeholder: 'Введите полный адрес',
      validator: (value) => value.length < 5 ? 'Адрес должен содержать минимум 5 символов' : null
    },
    {
      key: 'city',
      label: 'Город',
      icon: MapPin,
      required: true,
      editable: true,
      type: 'text',
      placeholder: 'Название города'
    },
    {
      key: 'phone',
      label: 'Телефон',
      icon: Phone,
      required: true,
      editable: true,
      type: 'tel',
      placeholder: '+7 (___) ___-__-__',
      validator: (value) => {
        const phoneRegex = /^\+7\d{10}$/;
        return !phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) 
          ? 'Введите корректный номер телефона' 
          : null;
      }
    },
    {
      key: 'email',
      label: 'Email',
      icon: Mail,
      required: true,
      editable: true,
      type: 'email',
      placeholder: 'example@email.com',
      validator: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Введите корректный email' : null;
      }
    },
    {
      key: 'language',
      label: 'Язык',
      icon: Languages,
      required: false,
      editable: true,
      type: 'select',
      options: ['Казахский', 'Русский', 'Английский', 'Другой']
    },
    {
      key: 'citizenship',
      label: 'Гражданство',
      icon: Flag,
      required: false,
      editable: true,
      type: 'select',
      options: ['Казахстан', 'Россия', 'Другое']
    },
    {
      key: 'maritalStatus',
      label: 'Семейное положение',
      icon: Heart,
      required: false,
      editable: true,
      type: 'select',
      options: ['Не женат/не замужем', 'Женат/замужем', 'Разведен/разведена', 'Вдовец/вдова']
    },
    {
      key: 'profession',
      label: 'Профессия',
      icon: Briefcase,
      required: false,
      editable: true,
      type: 'text',
      placeholder: 'Укажите вашу профессию'
    }
  ];

  // Calculate completion percentage
  const completionPercentage = () => {
    const requiredFields = personalFields.filter(field => field.required);
    const completedFields = requiredFields.filter(field => {
      const value = user[field.key as keyof User];
      return value && value.toString().trim().length > 0;
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({ ...user });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({});
    setErrors({});
  };

  const validateField = (field: PersonalField, value: string): string | null => {
    if (field.required && (!value || value.trim().length === 0)) {
      return 'Это поле обязательно для заполнения';
    }
    if (field.validator && value) {
      return field.validator(value);
    }
    return null;
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    personalFields.forEach(field => {
      const value = editedUser[field.key as keyof User]?.toString() || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (onSave) {
        await onSave(editedUser);
      }
      setIsEditing(false);
      setEditedUser({});
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditedUser(prev => ({ ...prev, [fieldKey]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  const getFieldValue = (field: PersonalField): string => {
    const value = user[field.key as keyof User];
    return value?.toString() || 'Не указано';
  };

  const renderField = (field: PersonalField) => {
    const currentValue = getFieldValue(field);
    const editValue = editedUser[field.key as keyof User]?.toString() || currentValue;
    const hasError = errors[field.key];

    if (isEditing && field.editable) {
      return (
        <div key={field.key} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              {field.icon && <field.icon className="w-4 h-4 text-gray-500" />}
              <span>{field.label}</span>
              {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
          
          {field.type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            >
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
          )}
          
          {hasError && (
            <p className="text-xs text-red-600 flex items-center space-x-1">
              <X className="w-3 h-3" />
              <span>{hasError}</span>
            </p>
          )}
        </div>
      );
    }

    return (
      <InfoRow
        key={field.key}
        label={field.label}
        value={currentValue}
        icon={field.icon}
      />
    );
  };

  const renderActionButton = () => {
    if (!isEditable) return null;
    
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Отмена</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Сохранить</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleEdit}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        <Edit className="w-4 h-4" />
        <span>Редактировать</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Completion Progress */}
      {showCompletionProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Заполненность профиля</span>
            <span className="text-sm font-bold text-blue-600">{completionPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage()}%` }}
            ></div>
          </div>
          {completionPercentage() < 100 && (
            <p className="text-xs text-gray-600 mt-2">
              Заполните все обязательные поля для улучшения качества медицинского обслуживания
            </p>
          )}
        </div>
      )}

      {/* Main Card */}
      <InfoCard title="Личные данные">
        {/* Action buttons header */}
        {renderActionButton() && (
          <div className="flex justify-end mb-4">
            {renderActionButton()}
          </div>
        )}
        
        <div className={`space-y-3 ${isEditing ? 'space-y-4' : 'space-y-0.5 sm:space-y-1'}`}>
          {personalFields.map(renderField)}
        </div>

        {/* Additional Info Section */}
        {!isEditing && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <UserIcon className="w-3 h-3" />
              <span>Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        )}
      </InfoCard>
    </div>
  );
};