"use client";

import { 
  Calendar,
  FileText,
  FlaskConical,
  Pill,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
  Stethoscope,
  Heart,
  Activity,
  Bell
} from "lucide-react";
import { useState } from "react";
import { InfoCard } from "./InfoCard";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  hoverColor: string;
  badge?: string;
  urgent?: boolean;
  onClick: () => void;
}

interface QuickActionsCardProps {
  onActionClick?: (actionId: string) => void;
  showNotifications?: boolean;
}

export const QuickActionsCard = ({ 
  onActionClick,
  showNotifications = true 
}: QuickActionsCardProps) => {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Mock notification counts
  const notifications = {
    appointments: 2,
    results: 1,
    messages: 3
  };

  const quickActions: QuickAction[] = [
    {
      id: 'appointment',
      title: 'Записаться на прием',
      description: 'Выберите врача и удобное время',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      badge: showNotifications && notifications.appointments > 0 ? `${notifications.appointments}` : undefined,
      onClick: () => handleActionClick('appointment')
    },
    {
      id: 'medical-history',
      title: 'История болезни',
      description: 'Просмотр медицинской карты',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      onClick: () => handleActionClick('medical-history')
    },
    {
      id: 'test-results',
      title: 'Результаты анализов',
      description: 'Лабораторные исследования',
      icon: FlaskConical,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      badge: showNotifications && notifications.results > 0 ? `${notifications.results}` : undefined,
      urgent: false, // Changed from notifications.results > 0 to remove blinking
      onClick: () => handleActionClick('test-results')
    },
    {
      id: 'prescriptions',
      title: 'Рецепты и лекарства',
      description: 'Управление назначениями',
      icon: Pill,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      onClick: () => handleActionClick('prescriptions')
    },
    {
      id: 'teleconsult',
      title: 'Телемедицина',
      description: 'Консультация онлайн',
      icon: Phone,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100',
      onClick: () => handleActionClick('teleconsult')
    },
    {
      id: 'messages',
      title: 'Сообщения врача',
      description: 'Чат с медперсоналом',
      icon: MessageCircle,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      hoverColor: 'hover:bg-pink-100',
      badge: showNotifications && notifications.messages > 0 ? `${notifications.messages}` : undefined,
      onClick: () => handleActionClick('messages')
    }
  ];

  const handleActionClick = async (actionId: string) => {
    setLoadingAction(actionId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (onActionClick) {
      onActionClick(actionId);
    }
    
    setLoadingAction(null);
  };

  const renderActionButton = (action: QuickAction) => {
    const isHovered = hoveredAction === action.id;
    const isLoading = loadingAction === action.id;
    const IconComponent = action.icon;

    return (
      <button
        key={action.id}
        onClick={action.onClick}
        onMouseEnter={() => setHoveredAction(action.id)}
        onMouseLeave={() => setHoveredAction(null)}
        disabled={isLoading}
        className={`
          group relative w-full text-left p-4 rounded-xl transition-all duration-200 
          ${action.bgColor} ${action.hoverColor}
          ${isHovered ? 'transform scale-[1.02] shadow-lg' : 'shadow-sm'}
          ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
          touch-manipulation min-h-[72px] flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        `}
      >
        {/* Main Content */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Icon with loading state */}
          <div className={`
            relative p-2 rounded-lg ${action.bgColor} 
            ${isHovered ? 'transform rotate-6' : ''}
            transition-transform duration-200
          `}>
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <IconComponent className={`w-5 h-5 ${action.color}`} />
            )}
            
            {/* Notification indicator (static) */}
            {action.badge && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {action.title}
              </h3>
              {action.badge && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-bounce">
                  {action.badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
              {action.description}
            </p>
          </div>
        </div>

        {/* Arrow indicator */}
        <ArrowRight className={`
          w-4 h-4 text-gray-400 transition-all duration-200
          ${isHovered ? 'text-gray-600 transform translate-x-1' : ''}
          group-hover:text-gray-600
        `} />

        {/* Hover overlay effect */}
        <div className={`
          absolute inset-0 rounded-xl transition-opacity duration-200 pointer-events-none
          ${isHovered ? 'bg-white bg-opacity-20' : 'opacity-0'}
        `} />
      </button>
    );
  };

  // Quick stats for context
  const quickStats = [
    { icon: Stethoscope, label: 'Врачей', value: '12+', color: 'text-blue-600' },
    { icon: Heart, label: 'Здоровье', value: '98%', color: 'text-red-500' },
    { icon: Activity, label: 'Активность', value: 'Высокая', color: 'text-green-600' }
  ];

  return (
    <InfoCard title="Быстрые действия">
      {/* Quick Stats Header */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        {quickStats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-xs font-semibold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Actions Grid */}
      <div className="space-y-3">
        {quickActions.map(renderActionButton)}
      </div>

      {/* Emergency Section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors group">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <Bell className="w-4 h-4 group-hover:animate-bounce" />
            <span className="font-medium text-sm">Экстренный вызов</span>
            <span className="text-xs bg-red-100 px-2 py-1 rounded-full">24/7</span>
          </div>
          <p className="text-xs text-red-500 mt-1">Круглосуточная медицинская помощь</p>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Обновлено: {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {showNotifications && (notifications.appointments + notifications.results + notifications.messages) > 0 && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Bell className="w-3 h-3" />
            <span className="font-medium">
              {notifications.appointments + notifications.results + notifications.messages} новых
            </span>
          </div>
        )}
      </div>
    </InfoCard>
  );
};