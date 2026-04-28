import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { storage } from '../utils/storage';

interface SettingsProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose, onRefresh }) => {
  const [gasUrl, setGasUrl] = useState('');

  useEffect(() => {
    const settings = storage.getSettings();
    setGasUrl(settings.gasUrl || '');
  }, []);

  const handleSave = () => {
    storage.saveSettings({ gasUrl });
    onClose();
  };

  const handleClearData = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todos los datos locales? Esta acción no se puede deshacer.')) {
      storage.clearExpenses();
      onRefresh();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 shadow-xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Ajustes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            Cerrar
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL de Google Apps Script
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              rows={4}
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <p className="text-xs text-slate-500 mt-2">
              Esta URL se usará para sincronizar tus gastos con Google Sheets.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleSave}
            className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium flex items-center justify-center space-x-2 hover:bg-slate-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ajustes</span>
          </button>

          <button
            onClick={handleClearData}
            className="w-full bg-white text-red-600 border border-red-200 rounded-xl py-3 font-medium flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors"
          >
            <span>Borrar Datos Locales</span>
          </button>
        </div>
      </div>
    </div>
  );
};
