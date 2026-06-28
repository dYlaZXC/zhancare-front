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
