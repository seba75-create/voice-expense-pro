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

      // Merge: take all remote expenses and add any local pending ones
      // This ensures we don't lose data that hasn't been synced yet
      const merged = [...pending];

      remoteExpenses.forEach(remote => {
        // Validación más flexible de la fecha
        let date = remote.date;
        if (typeof date === 'string' && date.includes('/')) {
          // Convertir DD/MM/YYYY a YYYY-MM-DD si es necesario
          const parts = date.split('/');
          if (parts.length === 3) {
            if (parts[2].length === 4) date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            else if (parts[0].length === 4) date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }

        // Simple check to avoid duplicates if possible (by date, amount and desc)
        const exists = merged.some(m =>
          m.date === date &&
          m.amount === remote.amount &&
          m.description === remote.description
        );
        if (!exists) {
          merged.push({ ...remote, date, synced: true });
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
