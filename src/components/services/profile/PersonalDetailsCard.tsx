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
        // console.log('✅ [PersonalDetailsCard] API data loaded:', response.data);
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
  // console.log('📋 [PersonalDetailsCard] Current user:', user);
  // console.log('📞 [PersonalDetailsCard] User phone field:', user.phone);
  // console.log('🔑 [PersonalDetailsCard] User keys:', Object.keys(user));



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
          // Convert empty strings to null/undefined for API
          const cleanedData: Partial<User> = {};
          Object.keys(editedUser).forEach(key => {
            const value = editedUser[key as keyof User];
            (cleanedData as any)[key] = value === '' ? undefined : value;
          });
          await onSave(cleanedData);
        }
        setIsEditing(false);
        setEditedUser({});

        // Refetch the user data from API to get the updated information
        const { api } = await import("@/utils/api");
        const response = await api.get('/user-profile/profile/');
        setUser(response.data);
        // console.log('✅ [PersonalDetailsCard] Data refreshed after save:', response.data);

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
    // Store the actual value, including empty string for cleared fields
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
    // For editing, prioritize editedUser value, including empty strings for cleared fields
    const rawValue = user[field.key as keyof User];
    const editValue = field.key in editedUser
      ? (editedUser[field.key as keyof User]?.toString() || '')
      : (rawValue && rawValue.toString().trim() !== '' ? rawValue.toString() : '');
    const hasError = errors[field.key];


    if (isEditing && field.editable) {
      return (
        <div key={field.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold flex items-center space-x-3 group">
              {field.icon && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
                     style={{
                       background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(50, 103, 230, 0.05) 100%)',
                       border: '1px solid rgba(55, 114, 255, 0.1)'
                     }}>
                  <field.icon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
              )}
              <div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {field.label}
                </span>
                {field.required && (
                  <span className="ml-1 text-red-500 text-lg leading-none">*</span>
                )}
                <div className="text-xs text-gray-500 mt-0.5">
                  {field.required ? 'Обязательное поле' : 'Опциональное'}
                </div>
              </div>
            </label>
          </div>
          
          {field.type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 backdrop-blur-sm ${
                hasError
                  ? 'border-red-300 bg-red-50/80 text-red-900 focus:ring-red-500 focus:border-red-400'
                  : 'text-gray-900 focus:ring-blue-500'
              }`}
              style={{
                background: hasError
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)',
                border: hasError
                  ? '2px solid rgba(239, 68, 68, 0.3)'
                  : '2px solid rgba(55, 114, 255, 0.1)',
                boxShadow: hasError
                  ? '0 4px 12px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(239, 68, 68, 0.05)'
                  : '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
              }}
              onFocus={(e) => {
                if (!hasError) {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(50, 103, 230, 0.03) 100%)';
                }
              }}
              onBlur={(e) => {
                if (!hasError) {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)';
                }
              }}
            >
              <option value="">Не указано</option>
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
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 backdrop-blur-sm ${
                hasError
                  ? 'border-red-300 bg-red-50/80 text-red-900 focus:ring-red-500 focus:border-red-400 placeholder-red-400'
                  : 'text-gray-900 focus:ring-blue-500 placeholder-gray-400'
              }`}
              style={{
                background: hasError
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)',
                border: hasError
                  ? '2px solid rgba(239, 68, 68, 0.3)'
                  : '2px solid rgba(55, 114, 255, 0.1)',
                boxShadow: hasError
                  ? '0 4px 12px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(239, 68, 68, 0.05)'
                  : '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
              }}
              onFocus={(e) => {
                if (!hasError) {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(50, 103, 230, 0.03) 100%)';
                }
              }}
              onBlur={(e) => {
                if (!hasError) {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)';
                }
              }}
            />
          )}
          
          {hasError && (
            <div className="relative overflow-hidden p-3 rounded-xl border backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
                 style={{
                   background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                   borderColor: 'rgba(239, 68, 68, 0.2)',
                   boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                 }}>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <X className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm font-medium text-red-700">{hasError}</p>
              </div>

              {/* Animated background element */}
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full opacity-20 animate-pulse"
                   style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)' }}></div>
            </div>
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
        <div className="flex items-center space-x-3">
          {/* Premium Cancel Button */}
          <button
            onClick={handleCancel}
            className="group relative overflow-hidden flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #e8e8e8 0%, #dddddd 100%)',
              color: '#1b1b1b',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dddddd 0%, #b8b8b8 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #e8e8e8 0%, #dddddd 100%)';
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            <X className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            <span>Отмена</span>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
          </button>

          {/* Premium Save Button */}
          <button
            onClick={handleSave}
            className="group relative overflow-hidden flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 50%, #2c5bcc 100%)',
              boxShadow: '0 8px 25px rgba(55, 114, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3267e6 0%, #2c5bcc 50%, #2956bf 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(55, 114, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3772ff 0%, #3267e6 50%, #2c5bcc 100%)';
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.3)';
            }}
          >
            <Check className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span>Сохранить</span>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>

            {/* Glow effect */}
            <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}></div>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleEdit}
        className="group relative overflow-hidden flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(50, 103, 230, 0.05) 100%)',
          color: '#3772ff',
          border: '1px solid rgba(55, 114, 255, 0.2)',
          boxShadow: '0 4px 12px rgba(55, 114, 255, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.15) 0%, rgba(50, 103, 230, 0.1) 100%)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(55, 114, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(50, 103, 230, 0.05) 100%)';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.2)';
        }}
      >
        <Edit className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
        <span>Редактировать</span>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Premium Completion Progress */}
      {showCompletionProgress && (
        <div className="relative overflow-hidden p-6 rounded-2xl border backdrop-blur-xl shadow-xl"
             style={{
               background: `
                 linear-gradient(135deg,
                   rgba(55, 114, 255, 0.1) 0%,
                   rgba(50, 103, 230, 0.05) 50%,
                   rgba(44, 91, 204, 0.02) 100%
                 )
               `,
               borderColor: 'rgba(55, 114, 255, 0.2)',
               boxShadow: `
                 0 20px 25px -5px rgba(55, 114, 255, 0.1),
                 0 10px 10px -5px rgba(55, 114, 255, 0.04),
                 inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
               `
             }}>

          {/* Premium Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-30 blur-xl animate-pulse"
                 style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.3) 0%, transparent 70%)', animationDuration: '3s' }}></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-20 blur-lg animate-bounce"
                 style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.4) 0%, transparent 70%)', animationDuration: '4s' }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}>
                  <span className="text-white font-bold">📊</span>
                </div>
                <div>
                  <h3 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Заполненность профиля
                  </h3>
                  <p className="text-xs text-gray-500">Профессиональный уровень</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {completionPercentage()}%
                </div>
                <div className="text-xs text-gray-500">завершено</div>
              </div>
            </div>

            {/* Premium Progress Bar */}
            <div className="relative">
              <div className="w-full h-3 rounded-full overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, #e8e8e8 0%, #dddddd 100%)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{
                    width: `${completionPercentage()}%`,
                    background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 50%, #2c5bcc 100%)',
                    boxShadow: '0 2px 8px rgba(55, 114, 255, 0.3)'
                  }}>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-full animate-pulse"
                       style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}></div>
                </div>
              </div>

              {/* Progress indicator dot */}
              <div className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border-3 border-white shadow-lg transition-all duration-1000 ease-out"
                   style={{
                     left: `calc(${completionPercentage()}% - 10px)`,
                     background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)',
                     boxShadow: '0 4px 12px rgba(55, 114, 255, 0.4)'
                   }}>
                <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {completionPercentage() < 100 && (
              <div className="mt-4 p-3 rounded-xl"
                   style={{ background: 'rgba(55, 114, 255, 0.05)' }}>
                <p className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Заполните все обязательные поля для повышения качества медицинского обслуживания</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Card */}
      <InfoCard title="Личные данные" className="flex-1">
        {/* Action button header */}
        <div className="flex justify-end items-center mb-4">
          {renderActionButton()}
        </div>

        {/* Premium Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              {/* Main loader */}
              <div className="flex items-center space-x-3">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent"
                       style={{
                         background: 'linear-gradient(135deg, #3772ff, #3267e6) padding-box, linear-gradient(135deg, #3772ff, transparent, #3267e6) border-box',
                         animation: 'spin 1s linear infinite'
                       }}></div>
                  <div className="absolute inset-2 rounded-full"
                       style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%)' }}></div>
                  <div className="absolute inset-3 rounded-full bg-white opacity-80"></div>
                </div>
                <div>
                  <div className="text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Загрузка данных
                  </div>
                  <div className="text-xs text-gray-500">Получение информации профиля...</div>
                </div>
              </div>

              {/* Pulse rings */}
              <div className="absolute -inset-4 rounded-full border border-blue-200 opacity-20 animate-ping"></div>
              <div className="absolute -inset-8 rounded-full border border-blue-100 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>
        )}

        {!loading && (
          <div className={`space-y-3 ${isEditing ? 'space-y-4' : 'space-y-0.5 sm:space-y-1'}`}>
            {personalFields.map(renderField)}
          </div>
        )}

        {/* Premium Additional Info Section */}
        {!isEditing && (
          <div className="mt-8 pt-6 relative">
            {/* Premium divider */}
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(55, 114, 255, 0.2) 50%, transparent 100%)' }}></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(50, 103, 230, 0.05) 100%)',
                       border: '1px solid rgba(55, 114, 255, 0.1)'
                     }}>
                  <UserIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-700">
                    Последнее обновление
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">Синхронизировано</span>
              </div>
            </div>
          </div>
        )}
      </InfoCard>
    </div>
  );
};