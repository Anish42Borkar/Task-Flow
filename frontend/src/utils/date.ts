import { useSettingsStore } from '../stores/settingsStore';

export function formatDateWithSetting(dateString?: string | Date | null, formatOverride?: string): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';

  const format = formatOverride || useSettingsStore.getState().dateFormat || 'DD MMM, YYYY';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[date.getMonth()];

  if (format.includes('YYYY-MM-DD')) {
    return `${year}-${month}-${day}`;
  } else if (format.includes('MM/DD/YYYY')) {
    return `${month}/${day}/${year}`;
  } else if (format.includes('DD/MM/YYYY')) {
    return `${day}/${month}/${year}`;
  } else {
    // Default: 'DD MMM, YYYY'
    return `${day} ${monthStr}, ${year}`;
  }
}
