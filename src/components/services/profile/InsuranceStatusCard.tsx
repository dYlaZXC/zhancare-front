"use client";

import { 
  Shield, 
  CheckCircle, 
  Calendar,
  CreditCard,
  Phone,
  FileText,
  AlertTriangle,
  ExternalLink,
  Download,
  RefreshCw,
  Building,
  User,
  Clock
} from "lucide-react";
import { useState } from "react";
import { InfoCard } from "./InfoCard";

interface InsurancePolicy {
  id: string;
  company: string;
  policyNumber: string;
  status: 'active' | 'expired' | 'pending' | 'suspended';
  coverage: string;
  validFrom: Date;
  validTo: Date;
  premium: number;
  deductible: number;
  coverageLimit: number;
}

interface InsuranceStatusCardProps {
  insurance?: InsurancePolicy;
  onViewDetails?: () => void;
  onRenewPolicy?: () => void;
  onContactInsurance?: () => void;
  showDetailedInfo?: boolean;
}

export const InsuranceStatusCard = ({
  insurance,
  onViewDetails,
  onRenewPolicy,
  onContactInsurance,
  showDetailedInfo = true
}: InsuranceStatusCardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Default values when no insurance data is provided
  const defaultInsurance: InsurancePolicy = {
    id: "Не указано",
    company: "Не указано",
    policyNumber: "Не указано",
    status: "unknown" as any,
    coverage: "Не указано",
    validFrom: null as any,
    validTo: null as any,
    premium: 0,
    deductible: 0,
    coverageLimit: 0
  };

  const insuranceData = insurance || defaultInsurance;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          text: 'Активен',
          description: 'Полис действует'
        };
      case 'expired':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          text: 'Истек',
          description: 'Требует продления'
        };
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock,
          text: 'Ожидает',
          description: 'На рассмотрении'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Shield,
          text: 'Не указано',
          description: 'Статус не определен'
        };
    }
  };

  const statusInfo = getStatusInfo(insuranceData.status);
  const StatusIcon = statusInfo.icon;

  const daysUntilExpiry = insuranceData.validTo ? Math.ceil((insuranceData.validTo.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Не указано';
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Не указано';
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const coverageBenefits = [
    { name: 'Стационарное лечение', covered: true, limit: '100%' },
    { name: 'Амбулаторное лечение', covered: true, limit: '90%' },
    { name: 'Скорая помощь', covered: true, limit: '100%' },
    { name: 'Лабораторные анализы', covered: true, limit: '85%' },
    { name: 'Стоматология', covered: true, limit: '50%' },
    { name: 'Офтальмология', covered: false, limit: '0%' }
  ];

  return (
    <InfoCard title="Статус страхования">
      {/* Main Status Section */}
      <div className={`
        p-4 rounded-xl border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}
        ${isExpiringSoon ? 'ring-2 ring-yellow-300 ring-opacity-50' : ''}
        transition-all duration-300
      `}>
        {/* Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
              <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold text-sm ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
                {isExpiringSoon && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                    Истекает через {daysUntilExpiry} дней
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">{statusInfo.description}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            title="Обновить статус"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Policy Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Building className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-900">{insuranceData.company}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Полис: {insuranceData.policyNumber}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Действует до: {formatDate(insuranceData.validTo)}</span>
          </div>
        </div>
      </div>

      {/* Coverage Summary */}
      {showDetailedInfo && (
        <div className="mt-4 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-base sm:text-lg font-bold text-blue-600 truncate">
                {formatCurrency(insuranceData.coverageLimit)}
              </div>
              <div className="text-xs text-gray-600">Лимит покрытия</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-base sm:text-lg font-bold text-green-600 truncate">
                {formatCurrency(insuranceData.deductible)}
              </div>
              <div className="text-xs text-gray-600">Франшиза</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-base sm:text-lg font-bold text-purple-600 truncate">
                {formatCurrency(insuranceData.premium)}
              </div>
              <div className="text-xs text-gray-600">Годовая премия</div>
            </div>
          </div>

          {/* Coverage Details Toggle */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">Детали покрытия</span>
              <ExternalLink className={`w-4 h-4 text-gray-500 transition-transform ${showFullDetails ? 'rotate-90' : ''}`} />
            </button>

            {showFullDetails && (
              <div className="border-t border-gray-200 p-3 space-y-2">
                {coverageBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      {benefit.covered ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-700">{benefit.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      benefit.covered ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {benefit.limit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={onViewDetails}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          <span>Подробнее</span>
        </button>
        <button
          onClick={onContactInsurance}
          className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <Phone className="w-4 h-4" />
          <span>Связаться</span>
        </button>
      </div>

      {/* Renewal Alert */}
      {isExpiringSoon && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Срок действия полиса истекает
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Рекомендуем продлить полис заранее, чтобы избежать перерывов в страховом покрытии
              </p>
              <button
                onClick={onRenewPolicy}
                className="mt-2 text-xs font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Продлить полис →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <User className="w-3 h-3" />
          <span>ID полиса: {insuranceData.id}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Обновлено: {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </InfoCard>
  );
};