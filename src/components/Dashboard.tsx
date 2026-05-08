import React from 'react';
import { Expense } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const monthStr = `${year}-${month}`;

  const todayExpenses = expenses.filter(e => e.date === todayStr);

  const monthlyTotal = expenses
    .filter(e => e.date.startsWith(monthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const dailyTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlyByCategory = expenses
    .filter(e => e.date.startsWith(monthStr))
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const categories = Object.entries(monthlyByCategory).sort((a, b) => b[1] - a[1]);

  // Lógica para gráficos de los últimos 6 meses
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const last6Months: { key: string; name: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    last6Months.push({
      key: `${y}-${m}`,
      name: monthNames[d.getMonth()]
    });
  }

  const categoryMonthlyData = expenses.reduce((acc, e) => {
    const monthKey = e.date.substring(0, 7);
    if (last6Months.some(m => m.key === monthKey)) {
      if (!acc[e.category]) acc[e.category] = {};
      acc[e.category][monthKey] = (acc[e.category][monthKey] || 0) + e.amount;
    }
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const chartData = Object.entries(categoryMonthlyData).map(([category, data]) => ({
    category,
    points: last6Months.map(m => ({
      name: m.name,
      value: data[m.key] || 0
    })).filter(p => p.value > 0)
  })).filter(d => d.points.length > 0);

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

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

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Gasto por Categoría (6 meses)</h3>
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory scrollbar-hide">
            {chartData.map((data) => (
              <div key={data.category} className="min-w-[85%] sm:min-w-[300px] bg-slate-50 rounded-xl p-4 snap-center border border-slate-100 shadow-sm">
                <h4 className="text-xs font-bold text-slate-600 mb-2 text-center uppercase tracking-wider">{data.category}</h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.points}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.points.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Monto']}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
