import React from 'react';
import { Expense } from '../types';

interface DashboardProps {
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000;

  const todayExpenses = expenses.filter(e => e.timestamp >= startOfToday && e.timestamp < endOfToday);

  const monthlyTotal = expenses
    .filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const dailyTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlyByCategory = expenses
    .filter(e => {
      const d = new Date(e.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const categories = Object.entries(monthlyByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-sm text-slate-500 font-medium">Total Mes</span>
          <span className="text-2xl font-bold text-slate-800 mt-2">${monthlyTotal.toFixed(2)}</span>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100 flex flex-col justify-between">
          <span className="text-sm text-blue-600 font-medium">Gasto Diario</span>
          <span className="text-2xl font-bold text-blue-600 mt-2">${dailyTotal.toFixed(2)}</span>
        </div>
      </div>
      
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Resumen por Categoría (Mes)</h3>
          <div className="space-y-2">
            {categories.map(([cat, amount]) => (
              <div key={cat} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500">{cat}</span>
                <span className="font-semibold text-slate-800">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
