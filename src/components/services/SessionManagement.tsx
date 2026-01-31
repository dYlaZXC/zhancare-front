"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  LogOut,
  RefreshCw,
  Shield,
  Clock,
  MapPin
} from "lucide-react";

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
};

export const SessionManagement = () => {
  const {
    sessions,
    sessionsLoading,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions
  } = useAuth();

  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Только что";
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Активные сессии</h3>
          </div>
          <button
            onClick={() => fetchSessions()}
            disabled={sessionsLoading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Управляйте сессиями на всех ваших устройствах
        </p>
      </div>

      {/* Sessions List */}
      <div className="divide-y divide-gray-100">
        {sessionsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Загрузка сессий...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Активные сессии не найдены
          </div>
        ) : (
          sessions.map((session) => {
            const DeviceIcon = deviceIcons[session.device_type] || HelpCircle;

            return (
              <div
                key={session.id}
                className={`p-4 flex items-center justify-between ${
                  session.is_current ? 'bg-green-50' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    session.is_current ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <DeviceIcon className={`w-5 h-5 ${
                      session.is_current ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {session.device_name}
                      </span>
                      {session.is_current && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Текущая
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastActivity(session.last_activity)}
                      </span>
                      {session.ip_address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Завершить</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {otherSessionsCount > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {confirmRevokeAll ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Завершить все {otherSessionsCount} других сессий?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRevokeAll(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    revokeAllOtherSessions();
                    setConfirmRevokeAll(false);
                  }}
                  className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRevokeAll(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти из всех других сессий ({otherSessionsCount})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
