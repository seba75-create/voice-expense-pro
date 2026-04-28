import { storage } from './storage';

export const syncService = {
  syncPending: async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    const pending = storage.getPendingSync();
    if (pending.length === 0) return true;

    const settings = storage.getSettings();
    if (!settings.gasUrl) {
      console.warn('Google Apps Script URL not configured');
      return false;
    }

    try {
      // In a real app, we'd probably batch these, but let's send them individually or as a JSON array
      // Gas endpoints often accept POST or GET. Let's assume POST with JSON body.
      const response = await fetch(settings.gasUrl, {
        method: 'POST',
        // Gas needs no-cors or plain text often if not configured correctly,
        // but let's try standard JSON first. If Gas is configured to accept POST with JSON.
        // Or we use application/x-www-form-urlencoded
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS often handles plain text JSON better due to CORS
        },
        body: JSON.stringify({ action: 'syncExpenses', data: pending })
      });

      // Assuming GAS returns { status: 'success' } or similar
      const result = await response.json();
      
      if (result.status === 'success' || response.ok) {
        storage.markAsSynced(pending.map(p => p.id));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Sync failed', e);
      return false;
    }
  },

  fetchAll: async (): Promise<any[] | null> => {
    if (!navigator.onLine) return null;

    const settings = storage.getSettings();
    if (!settings.gasUrl) return null;

    try {
      console.log('Iniciando fetch remoto a:', settings.gasUrl);
      const response = await fetch(settings.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getExpenses' })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Resultado del fetch:', result);
      
      if (result.status === 'success') {
        console.log(`Se recibieron ${result.data.length} registros de la planilla.`);
        return result.data;
      } else {
        console.error('Error en la respuesta de Google:', result.message);
        return null;
      }
    } catch (e) {
      console.error('Error crítico al obtener datos:', e);
      return null;
    }
  },

  editRemote: async (expense: any): Promise<boolean> => {
    if (!navigator.onLine) return false;
    const settings = storage.getSettings();
    try {
      const response = await fetch(settings.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'editExpense', data: expense })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (e) {
      console.error('Edit sync failed', e);
      return false;
    }
  },

  deleteRemote: async (id: string): Promise<boolean> => {
    if (!navigator.onLine) return false;
    const settings = storage.getSettings();
    try {
      const response = await fetch(settings.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteExpense', id })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (e) {
      console.error('Delete sync failed', e);
      return false;
    }
  },

  initBackgroundSync: (onSyncComplete?: (success: boolean) => void) => {
    window.addEventListener('online', async () => {
      console.log('Back online, attempting sync...');
      const success = await syncService.syncPending();
      if (onSyncComplete) onSyncComplete(success);
    });
  }
};
