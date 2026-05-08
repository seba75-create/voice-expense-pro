import { Expense } from '../types';

const STORAGE_KEY = 'voice_expenses_data';
const SETTINGS_KEY = 'voice_expenses_settings';

export const storage = {
  getExpenses: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const expenses = data ? JSON.parse(data) : [];
      // Always normalize on read to fix any legacy broken data
      return expenses.map(storage.normalizeExpense);
    } catch (e) {
      console.error('Error reading from storage', e);
      return [];
    }
  },

  normalizeExpense: (exp: any): Expense => {
    // 1. Find a reliable timestamp first
    let timestamp = exp.timestamp;
    const possibleKeys = ['Fecha Registro', 'Fecha de Registro', 'fechaRegistro', 'Timestamp', 'Fecha', 'fecha'];
    
    for (const key of possibleKeys) {
      const val = (exp as any)[key];
      if (val) {
        // Handle DD/MM/YYYY HH:MM:SS
        if (typeof val === 'string' && val.includes('/') && val.includes(':')) {
          const [dPart, tPart] = val.split(' ');
          const [d, m, y] = dPart.split('/');
          const [h, min, s] = tPart.split(':');
          const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h) || 0, parseInt(min) || 0, parseInt(s) || 0);
          if (!isNaN(dObj.getTime())) {
            timestamp = dObj.getTime();
            break;
          }
        }
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          timestamp = parsed.getTime();
          break;
        }
      }
    }
    if (!timestamp || isNaN(timestamp)) timestamp = Date.now();

    // 2. Normalize Date (YYYY-MM-DD)
    let date = exp.date || (exp as any).Fecha || (exp as any).fecha;
    
    // If date is missing, invalid format, or a weird string like "Tue Apr..."
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Try to parse whatever we have in 'date' first
      const parsedDate = new Date(date || timestamp);
      if (!isNaN(parsedDate.getTime())) {
        date = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
      } else {
        // Fallback to today ONLY if we have absolutely nothing better
        const today = new Date();
        date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
    }

    // 3. Normalize Amount (Handle 1.000,00 € -> 1000.00)
    let amount = exp.amount !== undefined ? exp.amount : (exp as any).Monto || (exp as any).monto;
    if (typeof amount === 'string') {
      let s = amount.replace(/[€$]/g, '').replace(/\s/g, '').trim();
      if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.includes(',')) {
        s = s.replace(',', '.');
      }
      amount = parseFloat(s);
    }
    if (amount === undefined || isNaN(amount)) amount = 0;

    return {
      ...exp,
      id: exp.id || (exp as any).ID || exp.id || crypto.randomUUID(),
      date,
      amount,
      timestamp,
      description: exp.description || (exp as any).Descripción || (exp as any).descripción || '',
      category: exp.category || (exp as any).Categoría || (exp as any).categoría || 'Otros',
      synced: exp.synced ?? true
    };
  },

  saveExpense: (expense: Expense): void => {
    try {
      const expenses = storage.getExpenses();
      expenses.push(storage.normalizeExpense(expense));
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
        expenses[index] = storage.normalizeExpense(updated);
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
      const merged = [...pending];

      remoteExpenses.forEach(remote => {
        const normalizedRemote = storage.normalizeExpense(remote);
        
        const existingIndex = merged.findIndex(m => 
          m.id === normalizedRemote.id || 
          (m.date === normalizedRemote.date && m.amount === normalizedRemote.amount && m.description === normalizedRemote.description)
        );

        if (existingIndex !== -1) {
          merged[existingIndex] = { ...normalizedRemote, synced: true };
        } else {
          merged.push({ ...normalizedRemote, synced: true });
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
