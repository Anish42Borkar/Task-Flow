import { create } from 'zustand';
import { api } from '../services/api';

export interface SystemSettings {
  appName: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  twoFactor: boolean;
}

interface SettingsState extends SystemSettings {
  isLoading: boolean;
  isSaving: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<SystemSettings>) => Promise<SystemSettings>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  appName: 'TaskFlow',
  theme: 'Light',
  timezone: '(GMT+05:30) India Standard Time',
  dateFormat: 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
  twoFactor: false,
  isLoading: false,
  isSaving: false,

  fetchSettings: async () => {
    try {
      set({ isLoading: true });
      const data: any = await api.get('/settings');
      if (data) {
        set({
          appName: data.appName || 'TaskFlow',
          theme: data.theme || 'Light',
          timezone: data.timezone || '(GMT+05:30) India Standard Time',
          dateFormat: data.dateFormat || 'DD MMM, YYYY (e.g. 28 Oct, 2026)',
          twoFactor: !!data.twoFactor,
        });

        if (data.appName) {
          document.title = `${data.appName} - Manage Projects, Tasks & Teams`;
        }
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (payload: Partial<SystemSettings>) => {
    set({ isSaving: true });
    try {
      const data: any = await api.put('/settings', payload);
      const updated: SystemSettings = {
        appName: data?.appName || payload.appName || get().appName,
        theme: data?.theme || payload.theme || get().theme,
        timezone: data?.timezone || payload.timezone || get().timezone,
        dateFormat: data?.dateFormat || payload.dateFormat || get().dateFormat,
        twoFactor: data?.twoFactor !== undefined ? !!data.twoFactor : (payload.twoFactor !== undefined ? !!payload.twoFactor : get().twoFactor),
      };

      set({
        ...updated,
        isSaving: false,
      });

      if (updated.appName) {
        document.title = `${updated.appName} - Manage Projects, Tasks & Teams`;
      }

      return updated;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },
}));
