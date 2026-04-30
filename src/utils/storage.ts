import { Expense } from '../types';

const STORAGE_KEY = 'voice_expenses_data';
const SETTINGS_KEY = 'voice_expenses_settings';

export const storage = {
  getExpenses: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from storage', e);
      return [];
    }
  },

  saveExpense: (expense: Expense): void => {
    try {
      const expenses = storage.getExpenses();
      expenses.push(expense);
      // Sort by timestamp descending
      expenses.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  },

  clearExpenses: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },

  updateExpense: (updated: Expense): void => {
    try {
      const expenses = storage.getExpenses();
      const index = expenses.findIndex(e => e.id === updated.id);
      if (index !== -1) {
        expenses[index] = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      }
    } catch (e) {
      console.error('Error updating expense', e);
    }
  },

  removeExpense: (id: string): void => {
    try {
      const expenses = storage.getExpenses().filter(e => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error('Error removing expense', e);
    }
  },

  markAsSynced: (ids: string[]): void => {
    try {
      const expenses = storage.getExpenses();
      const updated = expenses.map(exp =>
        ids.includes(exp.id) ? { ...exp, synced: true } : exp
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating sync status', e);
    }
  },

  getPendingSync: (): Expense[] => {
    return storage.getExpenses().filter(exp => !exp.synced);
  },

  mergeExpenses: (remoteExpenses: Expense[]): void => {
    try {
      const localExpenses = storage.getExpenses();
      const pending = localExpenses.filter(e => !e.synced);

      // Merge: take all remote expenses and add any local pending ones PRUEBA
      // This ensures we don't lose data that hasn't been synced yet
      const merged = [...pending];

      remoteExpenses.forEach(remote => {
        // Normalización de fecha (YYYY-MM-DD)
        let date = remote.date;
        if (typeof date === 'string' && date.includes('/')) {
          const parts = date.split('/');
          if (parts.length === 3) {
            if (parts[2].length === 4) date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            else if (parts[0].length === 4) date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }

        // Búsqueda flexible de timestamp en la planilla
        let timestamp = remote.timestamp;
        const possibleKeys = ['Fecha Registro', 'Fecha de Registro', 'fechaRegistro', 'Timestamp', 'Fecha'];
        
        for (const key of possibleKeys) {
          const val = (remote as any)[key];
          if (val && typeof val === 'string' && val.includes(':')) {
            try {
              const [dPart, tPart] = val.split(' ');
              const [d, m, y] = dPart.split(dPart.includes('/') ? '/' : '-');
              const [h, min, s] = tPart.split(':');
              timestamp = new Date(
                parseInt(y), 
                parseInt(m) - 1, 
                parseInt(d), 
                parseInt(h) || 0, 
                parseInt(min) || 0, 
                parseInt(s) || 0
              ).getTime();
              if (!isNaN(timestamp)) break;
            } catch (e) {}
          }
        }

        if (!timestamp || isNaN(timestamp)) timestamp = Date.now();

        // Usar ID para evitar duplicados si existe, si no, usar combinación de datos
        const remoteId = remote.id || (remote as any).ID;
        const existingIndex = merged.findIndex(m => 
          (remoteId && m.id === remoteId) || 
          (!remoteId && m.date === date && m.amount === remote.amount && m.description === remote.description)
        );

        const normalizedRemote = { 
          ...remote, 
          id: remoteId || remote.id || crypto.randomUUID(),
          date, 
          timestamp, 
          synced: true 
        };

        if (existingIndex !== -1) {
          merged[existingIndex] = normalizedRemote;
        } else {
          merged.push(normalizedRemote);
        }
      });

      merged.sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.error('Error merging expenses', e);
    }
  },

  getSettings: () => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        gasUrl: 'https://script.google.com/macros/s/AKfycbyGtcI3gv-GagqBZmrqze5nox-wDUwwHd1i2YrdQiRcJODnUrQyXGlw6_Ro4biKKTLA/exec'
      };
    } catch (e) {
      return { gasUrl: '' };
    }
  },

  saveSettings: (settings: { gasUrl: string }) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
