import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { VoiceMicFAB } from './components/VoiceMicFAB';
import { Settings } from './components/Settings';
import { storage } from './utils/storage';
import { syncService } from './utils/syncService';
import { Expense } from './types';
import { ParsedData } from './utils/voiceParser';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();

    // Initial fetch from Google Sheets
    const initialFetch = async () => {
      const remoteData = await syncService.fetchAll();
      if (remoteData) {
        storage.mergeExpenses(remoteData);
        loadData();
      }
    };
    initialFetch();

    syncService.initBackgroundSync((success) => {
      if (success) {
        showToast('Sincronización exitosa', 'success');
        loadData(); // Reload to update UI icons
      }
    });
  }, []);

  const loadData = () => {
    const data = storage.getExpenses();
    console.log('Loading local data:', data.length, 'records');
    setExpenses(data);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveExpense = async (data: ParsedData) => {
    if (!data.amount) {
      showToast('No se pudo determinar el monto.', 'error');
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date: data.date,
      amount: data.amount,
      description: data.description,
      category: data.category,
      synced: false,
      timestamp: Date.now()
    };

    storage.saveExpense(newExpense);
    loadData();
    showToast('Gasto guardado localmente', 'success');

    // Attempt sync immediately
    if (navigator.onLine) {
      const syncSuccess = await syncService.syncPending();
      if (syncSuccess) {
        loadData();
        showToast('Gasto sincronizado', 'success');
      }
    }
  };

  const handleUpdateExpense = async (updated: Expense) => {
    storage.updateExpense(updated);
    loadData();
    showToast('Actualizando...', 'success');
    
    if (navigator.onLine) {
      const success = await syncService.editRemote(updated);
      if (success) {
        storage.markAsSynced([updated.id]);
        loadData();
        showToast('Actualizado en la planilla', 'success');
      }
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      storage.removeExpense(id);
      loadData();
      showToast('Eliminando...', 'success');
      
      if (navigator.onLine) {
        const success = await syncService.deleteRemote(id);
        if (success) {
          showToast('Eliminado de la planilla', 'success');
        }
      }
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 flex flex-col relative overflow-hidden shadow-2xl sm:border-x sm:border-slate-200">
      <header className="bg-white px-5 py-4 shadow-sm flex items-center justify-between z-10 relative">
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Voice-Expense<span className="text-primary">.Pro</span></h1>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-28">
        <Dashboard expenses={expenses} />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Tus Gastos</h2>
          <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">
            {expenses.length} registros
          </span>
        </div>

        <ExpenseList 
          expenses={expenses} 
          onUpdate={handleUpdateExpense}
          onDelete={handleDeleteExpense}
        />
      </main>

      <VoiceMicFAB onSave={handleSaveExpense} />

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          onRefresh={loadData}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in">
          <div className={`px-4 py-2 rounded-full shadow-lg font-medium text-sm text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
