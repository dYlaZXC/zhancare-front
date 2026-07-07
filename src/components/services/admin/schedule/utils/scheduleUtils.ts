/**
 * Schedule utility functions
 */

export interface StatusColor {
  bg: string;
  text: string;
  label: string;
}

/**
 * Get color scheme for event status
 */
export const getStatusColor = (status: string): StatusColor => {
  switch (status) {
    case 'scheduled':
      return { bg: '#ebf1ff', text: '#3772ff', label: 'Запланировано' };
    case 'in_progress':
      return { bg: '#fef3c7', text: '#f59e0b', label: 'В процессе' };
    case 'completed':
      return { bg: '#d1fae5', text: '#10b981', label: 'Завершено' };
    case 'cancelled':
      return { bg: '#fee2e2', text: '#ef4444', label: 'Отменено' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: 'Неизвестно' };
  }
};

export interface PaymentColor {
  bg: string;
  text: string;
  label: string;
  dot: string;
}

export const getPaymentStatusColor = (status: string): PaymentColor => {
  switch (status) {
    case 'paid':
      return { bg: '#dcfce7', text: '#15803d', label: 'Оплачено', dot: '#22c55e' };
    case 'partial':
      return { bg: '#fef3c7', text: '#b45309', label: 'Частично', dot: '#f59e0b' };
    case 'unpaid':
      return { bg: '#fee2e2', text: '#dc2626', label: 'Не оплачено', dot: '#ef4444' };
    case 'refunded':
      return { bg: '#dbeafe', text: '#1d4ed8', label: 'Возврат', dot: '#3b82f6' };
    case 'not_required':
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: 'Не требуется', dot: '#9ca3af' };
  }
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  free: 'Бесплатно',
  pay_at_clinic: 'В клинике',
  full_prepay: 'Полная предоплата',
  partial_prepay: 'Частичная предоплата',
};

/**
 * Get type color scheme
 */
export const getTypeColor = (type: 'consultation' | 'appointment' | 'diagnostics'): { bg: string; text: string; label: string } => {
  switch (type) {
    case 'consultation':
      return { bg: '#ede9fe', text: '#7c3aed', label: 'Консультация' };
    case 'appointment':
      return { bg: '#dbeafe', text: '#2563eb', label: 'Прием' };
    case 'diagnostics':
      return { bg: '#cffafe', text: '#0891b2', label: 'Диагностика' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', label: 'Неизвестно' };
  }
};
