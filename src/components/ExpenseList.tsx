import React, { useState } from 'react';
import { Expense } from '../types';
import { CloudOff, CheckCircle2, ShoppingCart, Coffee, Home, Car, GraduationCap, HelpCircle, Edit2, Trash2, X, Check } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onUpdate: (updated: Expense) => void;
  onDelete: (id: string) => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Casa': return <Home className="w-5 h-5 text-indigo-500" />;
    case 'Supermercado': return <ShoppingCart className="w-5 h-5 text-blue-500" />;
    case 'Comida': return <Coffee className="w-5 h-5 text-orange-500" />;
    case 'Auto': return <Car className="w-5 h-5 text-slate-600" />;
    case 'Colegio': return <GraduationCap className="w-5 h-5 text-emerald-500" />;
    default: return <HelpCircle className="w-5 h-5 text-slate-400" />;
  }
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const todayExpenses = expenses
    .filter(e => e.date === todayStr)
    .sort((a, b) => b.timestamp - a.timestamp);

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm(expense);
  };

  const handleSave = () => {
    if (editingId && editForm.amount && editForm.description) {
      onUpdate({ ...editForm, synced: false } as Expense);
      setEditingId(null);
    }
  };

  if (todayExpenses.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-sm italic">No hay gastos para hoy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todayExpenses.map((expense) => (
        <div key={expense.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all hover:border-slate-200">
          {editingId === expense.id ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.amount || ''}
                  onChange={e => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                  placeholder="Monto"
                />
                <select
                  className="border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.category || ''}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {['Casa', 'Supermercado', 'Comida', 'Auto', 'Colegio', 'Otros'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={editForm.description || ''}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descripción"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={handleSave} className="p-2 text-blue-600 hover:text-blue-800">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className="bg-slate-50 p-3 rounded-full">
                  <CategoryIcon category={expense.category} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 capitalize leading-tight">{expense.description || expense.category}</p>
                  <div className="flex items-center text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 space-x-2">
                    <span className="text-blue-500/70">{expense.category}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      {expense.synced ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <CloudOff className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-lg">${expense.amount.toFixed(2)}</span>
                </div>
                
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEditing(expense)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(expense.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
