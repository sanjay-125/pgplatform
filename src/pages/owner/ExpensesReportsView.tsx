import React, { useState, useEffect } from 'react';
import { Property, Expense, FinancialSummary } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Plus, Trash2, Calendar, TrendingUp, IndianRupee, AlertCircle } from 'lucide-react';

interface ExpensesReportsViewProps {
  property: Property;
  onOpenAddExpense: () => void;
}

export const ExpensesReportsView: React.FC<ExpensesReportsViewProps> = ({
  property,
  onOpenAddExpense,
}) => {
  const { showToast } = useToast();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sumData, expData] = await Promise.all([
        api.getSummary(property.id, period),
        api.getExpenses(property.id, period),
      ]);
      setSummary(sumData);
      setExpenses(expData);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [property.id, period]);

  const handleDeleteExpense = async (id: number, category: string) => {
    if (!confirm(`Delete this ${category} expense?`)) return;
    try {
      await api.deleteExpense(id);
      showToast('Expense record deleted');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n || 0);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses & Cash Flow</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track monthly operating bills, utilities, vendor costs, and net operating income.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-slate-700 uppercase">Month:</span>
            <input
              type="month"
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rent Income
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-2 block">
            {formatCurrency(summary?.collectedRent || 0)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Expected: {formatCurrency(summary?.expectedRent || 0)}</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Operating Expenses
          </span>
          <span className="text-2xl font-black text-amber-600 mt-2 block">
            {formatCurrency(summary?.totalExpenses || 0)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">{expenses.length} bills recorded</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Cash Flow
          </span>
          <span
            className={`text-2xl font-black mt-2 block ${
              (summary?.netCashFlow || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary?.netCashFlow || 0)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Rent minus operating costs</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Outstanding Rent
          </span>
          <span className="text-2xl font-black text-rose-600 mt-2 block">
            {formatCurrency(summary?.outstandingRent || 0)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Uncollected for {period}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      {summary?.expenseBreakdown && summary.expenseBreakdown.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">Expense Breakdown by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {summary.expenseBreakdown.map((cat) => (
              <div key={cat.category} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block truncate">{cat.category}</span>
                <span className="text-base font-black text-slate-900 block mt-1">
                  {formatCurrency(cat.cat_total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Recorded Expenses</h2>
            <p className="text-xs text-slate-500">All expenditures recorded for {period}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 font-semibold animate-pulse text-sm">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No expenses recorded for this month. Click &quot;Add Expense&quot; to log your bills.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Description / Note</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">{e.note}</td>
                    <td className="py-3.5 px-3 text-xs text-slate-500">{e.date}</td>
                    <td className="py-3.5 px-3 font-black text-rose-600">{formatCurrency(e.amount)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id, e.category)}
                        title="Delete Expense"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
