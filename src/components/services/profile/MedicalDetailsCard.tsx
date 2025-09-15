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
    setEditedUser(prev => ({ ...prev, [fieldKey]: value }));
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
        <div key={field.key} className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
              {field.icon && <field.icon className="w-4 h-4 text-gray-500" />}
              <span>{field.label}</span>
            </label>
          </div>

          {field.type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
    <InfoCard title="Медицинские данные">
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
        <div className={`space-y-3 ${isEditing ? 'space-y-4' : 'space-y-1'}`}>
          {medicalFields.map(renderField)}
        </div>
      )}
    </InfoCard>
  );
};
