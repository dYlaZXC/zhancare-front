"use client";

import {
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
  Globe,
  Phone,
  Users,
  Cake
} from "lucide-react";
import { useState, useEffect } from "react";
import { InfoCard } from "./InfoCard";
import { InfoRow } from "./InfoRow";
import { User } from "./types";

interface PersonalDetailsCardProps {
  user: User;
  isEditable?: boolean;
  onSave?: (updatedUser: Partial<User>) => Promise<void>;
  onRefetch?: () => void;
  showCompletionProgress?: boolean;
}

interface PersonalField {
  key: keyof User | string;
  label: string;
  icon?: React.ComponentType<any>;
  required?: boolean;
  editable?: boolean;
  type?: 'text' | 'email' | 'tel' | 'select' | 'date';
  options?: string[] | Array<{value: string, label: string}>;
  placeholder?: string;
  validator?: (value: string) => string | null;
}

export const PersonalDetailsCard = ({
  user: initialUser,
  isEditable = false,
  onSave,
  onRefetch,
  showCompletionProgress = false
}: PersonalDetailsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(false);

  // Fetch real API data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { api } = await import("@/utils/api");
        const response = await api.get('/user-profile/profile/');
        console.log('✅ [PersonalDetailsCard] API data loaded:', response.data);
        setUser(response.data);
      } catch (error: any) {
        console.error('❌ [PersonalDetailsCard] API error:', error);
        // Keep using initial user data if API fails
        setUser(initialUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [initialUser]);

  // Debug: log all user data
  console.log('📋 [PersonalDetailsCard] Current user:', user);
  console.log('📞 [PersonalDetailsCard] User phone field:', user.phone);
  console.log('🔑 [PersonalDetailsCard] User keys:', Object.keys(user));



  const personalFields: PersonalField[] = [
    {
      key: 'first_name',
      label: 'Имя',
      icon: UserIcon,
      required: true,
      editable: true,
      type: 'text',
      placeholder: 'Введите имя',
      validator: (value) => value.length < 2 ? 'Имя должно содержать минимум 2 символа' : null
    },
    {
      key: 'last_name',
      label: 'Фамилия',
      icon: UserIcon,
      required: true,
      editable: true,
      type: 'text',
      placeholder: 'Введите фамилию',
      validator: (value) => value.length < 2 ? 'Фамилия должна содержать минимум 2 символа' : null
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
      key: 'birth_date',
      label: 'Дата рождения',
      icon: Cake,
      required: false,
      editable: true,
      type: 'date',
      placeholder: 'Выберите дату рождения',
      validator: (value) => {
        if (!value) return null; // Optional field
        const birthDate = new Date(value);
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        if (birthDate > today) {
          return 'Дата рождения не может быть в будущем';
        }
        if (birthDate > oneYearAgo) {
          return 'Возраст должен быть не менее 1 года';
        }
        return null;
      }
    },
    {
      key: 'gender',
      label: 'Пол',
      icon: Users,
      required: false,
      editable: true,
      type: 'select',
      options: [
        { value: 'male', label: 'Мужской' },
        { value: 'female', label: 'Женский' },
        { value: 'other', label: 'Другой' }
      ]
    },
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
      options: [
        { value: 'kz', label: 'Казахский' },
        { value: 'ru', label: 'Русский' },
        { value: 'en', label: 'Английский' },
        { value: 'other', label: 'Другой' }
      ]
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
      key: 'marital_status',
      label: 'Семейное положение',
      icon: Heart,
      required: false,
      editable: true,
      type: 'select',
      options: [
        { value: 'single', label: 'Не женат/не замужем' },
        { value: 'married', label: 'Женат/замужем' },
        { value: 'divorced', label: 'Разведен/разведена' },
        { value: 'widowed', label: 'Вдовец/вдова' }
      ]
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
    // Only set actual values, not "Не указано"
    const actualUserData: Partial<User> = {};
    Object.keys(user).forEach(key => {
      const userKey = key as keyof User;
      const value = user[userKey];
      // Only include actual values, not empty/undefined ones
      if (value && value.toString().trim() !== '') {
        // Use type assertion to ensure compatibility
        (actualUserData as any)[userKey] = value;
      }
    });
    setEditedUser(actualUserData);
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
      try {
        if (onSave) {
          await onSave(editedUser);
        }
        setIsEditing(false);
        setEditedUser({});

        // Refetch the user data from API to get the updated information
        const { api } = await import("@/utils/api");
        const response = await api.get('/user-profile/profile/');
        setUser(response.data);
        console.log('✅ [PersonalDetailsCard] Data refreshed after save:', response.data);

        // Also trigger parent refetch if provided
        if (onRefetch) {
          onRefetch();
        }
      } catch (error) {
        console.error('Error saving personal data:', error);
        // Keep the form in editing mode if save fails
      }
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

    // Use display field if available (e.g., language_display, marital_status_display)
    const displayKey = `${field.key}_display` as keyof User;
    const displayValue = user[displayKey];

    if (displayValue && displayValue.toString().trim() !== '') {
      return displayValue.toString();
    }

    if (value && value.toString().trim() !== '') {
      return value.toString();
    }

    return 'Не указано';
  };

  const renderField = (field: PersonalField) => {
    const currentValue = getFieldValue(field);
    // For editing, use the actual value from editedUser or empty string (not "Не указано")
    const rawValue = user[field.key as keyof User];
    const editValue = editedUser[field.key as keyof User]?.toString() ||
                     (rawValue && rawValue.toString().trim() !== '' ? rawValue.toString() : '');
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
              {field.options?.map(option => {
                if (typeof option === 'string') {
                  return <option key={option} value={option}>{option}</option>;
                }
                return <option key={option.value} value={option.value}>{option.label}</option>;
              })}
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
        {/* Action button header */}
        <div className="flex justify-end items-center mb-4">
          {renderActionButton()}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Загрузка данных...</span>
            </div>
          </div>
        )}

        {!loading && (
          <div className={`space-y-3 ${isEditing ? 'space-y-4' : 'space-y-0.5 sm:space-y-1'}`}>
            {personalFields.map(renderField)}
          </div>
        )}

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