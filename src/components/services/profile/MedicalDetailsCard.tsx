"use client";

import { useState, useEffect } from "react";
import { Edit, Check, X, Droplet, Shield, FileText, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { InfoCard } from "./InfoCard";
import { InfoRow } from "./InfoRow";
import { User } from "./types";
import { api } from "@/utils/api";

interface MedicalDetailsCardProps {
  user: User;
  onRefetch?: () => void;
}

interface MedicalField {
  key: keyof User | string;
  label: string;
  icon?: React.ComponentType<any>;
  type?: 'text' | 'select' | 'date';
  options?: Array<{value: string, label: string}>;
  placeholder?: string;
}

export const MedicalDetailsCard = ({ user: initialUser, onRefetch }: MedicalDetailsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User>(initialUser);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);

  // Fetch real API data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user-profile/profile/');
        setUser(response.data);
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        setUser(initialUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [initialUser]);

  const medicalFields: MedicalField[] = [
    {
      key: 'blood_type',
      label: 'Группа крови',
      icon: Droplet,
      type: 'select',
      options: [
        { value: '', label: 'Не указана' },
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' }
      ]
    },
    {
      key: 'rhesus_factor',
      label: 'Резус-фактор',
      icon: Droplet,
      type: 'select',
      options: [
        { value: '', label: 'Не указан' },
        { value: 'positive', label: 'Положительный' },
        { value: 'negative', label: 'Отрицательный' }
      ]
    },
    {
      key: 'fluorography_status',
      label: 'Статус флюорографии',
      icon: FileText,
      type: 'select',
      options: [
        { value: '', label: 'Не указана' },
        { value: 'normal', label: 'Норма' },
        { value: 'abnormal', label: 'Отклонения' },
        { value: 'pending', label: 'Ожидает результата' },
        { value: 'expired', label: 'Просрочена' }
      ]
    },
    {
      key: 'fluorography_date',
      label: 'Дата флюорографии',
      icon: Calendar,
      type: 'date',
      placeholder: 'ГГГГ-ММ-ДД'
    },
    {
      key: 'immunization_status',
      label: 'Статус иммунизации',
      icon: Shield,
      type: 'select',
      options: [
        { value: '', label: 'Не указано' },
        { value: 'up_to_date', label: 'Актуальная' },
        { value: 'partial', label: 'Частичная' },
        { value: 'expired', label: 'Просрочена' },
        { value: 'none', label: 'Отсутствует' }
      ]
    },
    {
      key: 'immunization_date',
      label: 'Дата последней иммунизации',
      icon: Calendar,
      type: 'date',
      placeholder: 'ГГГГ-ММ-ДД'
    }
  ];

  const handleEdit = () => {
    setIsEditing(true);
    const actualUserData: Partial<User> = {};
    Object.keys(user).forEach(key => {
      const userKey = key as keyof User;
      const value = user[userKey];
      if (value && value.toString().trim() !== '') {
        (actualUserData as any)[userKey] = value;
      }
    });
    setEditedUser(actualUserData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({});
  };

  const handleSave = async () => {
    try {
      const apiData = {
        blood_type: editedUser.blood_type,
        rhesus_factor: editedUser.rhesus_factor,
        fluorography_status: editedUser.fluorography_status,
        fluorography_date: editedUser.fluorography_date,
        immunization_status: editedUser.immunization_status,
        immunization_date: editedUser.immunization_date,
      };

      await api.patch('/user-profile/profile/', apiData);
      toast.success("Медицинские данные успешно обновлены!");

      // Refetch the user data from API
      const response = await api.get('/user-profile/profile/');
      setUser(response.data);

      setIsEditing(false);
      setEditedUser({});

      if (onRefetch) {
        onRefetch();
      }
    } catch (error: any) {
      console.error('Error updating medical data:', error);
      if (error?.response?.status === 400) {
        toast.error("Ошибка валидации данных");
      } else {
        toast.error("Ошибка при обновлении данных");
      }
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    // If value is empty string (user selected "Не указано"), set it as undefined
    const finalValue = value === '' ? undefined : value;
    setEditedUser(prev => ({ ...prev, [fieldKey]: finalValue }));
  };

  const getFieldValue = (field: MedicalField): string => {
    const value = user[field.key as keyof User];
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

  const renderField = (field: MedicalField) => {
    const currentValue = getFieldValue(field);
    const rawValue = user[field.key as keyof User];
    const editValue = editedUser[field.key as keyof User]?.toString() ||
                     (rawValue && rawValue.toString().trim() !== '' ? rawValue.toString() : '');

    if (isEditing) {
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
                <div className="text-xs text-gray-500 mt-0.5">
                  Медицинская информация
                </div>
              </div>
            </label>
          </div>

          {field.type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 backdrop-blur-sm text-gray-900 focus:ring-blue-500"
              style={{
                background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)',
                border: '2px solid rgba(55, 114, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.4)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(50, 103, 230, 0.03) 100%)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)';
              }}
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 backdrop-blur-sm text-gray-900 focus:ring-blue-500 placeholder-gray-400"
              style={{
                background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)',
                border: '2px solid rgba(55, 114, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.4)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(50, 103, 230, 0.03) 100%)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(55, 114, 255, 0.03) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(50, 103, 230, 0.02) 100%)';
              }}
            />
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

  // Calculate medical data completion
  const calculateMedicalCompletion = (): number => {
    const totalFields = medicalFields.length;
    const completedFields = medicalFields.filter(field => {
      const value = user[field.key as keyof User];
      return value && value.toString().trim() !== '';
    }).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Premium Medical Status Card */}
      <div className="relative overflow-hidden p-6 rounded-2xl border backdrop-blur-xl shadow-xl"
           style={{
             background: `
               linear-gradient(135deg,
                 rgba(55, 114, 255, 0.08) 0%,
                 rgba(50, 103, 230, 0.04) 50%,
                 rgba(44, 91, 204, 0.02) 100%
               )
             `,
             borderColor: 'rgba(55, 114, 255, 0.15)',
             boxShadow: `
               0 20px 25px -5px rgba(55, 114, 255, 0.08),
               0 10px 10px -5px rgba(55, 114, 255, 0.04),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
             `
           }}>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl animate-pulse"
               style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.4) 0%, transparent 70%)', animationDuration: '4s' }}></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15 blur-lg animate-bounce"
               style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.5) 0%, transparent 70%)', animationDuration: '5s' }}></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}>
              <span className="text-white font-bold">🏥</span>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Медицинские данные
              </h3>
              <p className="text-sm text-gray-600">
                Заполнено {calculateMedicalCompletion()}% • {medicalFields.filter(field => {
                  const value = user[field.key as keyof User];
                  return value && value.toString().trim() !== '';
                }).length} из {medicalFields.length} полей
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center space-x-3">
            {renderActionButton()}
          </div>
        </div>

        {/* Medical completion mini progress */}
        <div className="mt-4 relative">
          <div className="w-full h-1.5 rounded-full overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #e8e8e8 0%, #dddddd 100%)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${calculateMedicalCompletion()}%`,
                background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)',
                boxShadow: '0 1px 3px rgba(55, 114, 255, 0.3)'
              }}>
            </div>
          </div>
        </div>
      </div>

      {/* Main Medical Card */}
      <InfoCard title="">
        {/* Remove the old header since we have the new status card above */}

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
                  Загрузка медицинских данных
                </div>
                <div className="text-xs text-gray-500">Получение информации...</div>
              </div>
            </div>

            {/* Pulse rings */}
            <div className="absolute -inset-4 rounded-full border border-blue-200 opacity-20 animate-ping"></div>
            <div className="absolute -inset-8 rounded-full border border-blue-100 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>
      )}

        {!loading && (
          <div className={`space-y-4 ${isEditing ? 'space-y-6' : 'space-y-2'}`}>
            {medicalFields.map(renderField)}
          </div>
        )}
      </InfoCard>
    </div>
  );
};
