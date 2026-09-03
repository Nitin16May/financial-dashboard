import React, { useState, useMemo } from 'react';
import { 
  CATEGORIES 
} from '../utils/categorizer';
import { 
  Utensils, 
  ShoppingBag, 
  Gem, 
  TrainTrack, 
  ArrowLeftRight, 
  CreditCard, 
  Tv, 
  HeartPulse, 
  Wrench, 
  TrendingUp, 
  MoreHorizontal,
  Search,
  ArrowUpDown,
  Filter,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const ICON_MAP = {
  Utensils,
  ShoppingBag,
  Gem,
  TrainTrack,
  ArrowLeftRight,
  CreditCard,
  Tv,
  HeartPulse,
  Wrench,
  TrendingUp,
  MoreHorizontal
};

export default function CategoryDeepDive({ transactions, initialCategoryId = 'FOOD' }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Compute category totals across all transactions
  const categoryStats = useMemo(() => {
    const map = {};
    let totalExpense = 0;

    Object.keys(CATEGORIES).forEach(id => {
      map[id] = {
        meta: CATEGORIES[id],
        totalAmount: 0,
        count: 0
      };
    });

    transactions.forEach(t => {
      const catId = t.categoryId;
      const amt = Math.abs(t.amount);
      if (t.amount < 0 || catId === 'INCOME') {
        if (map[catId]) {
          map[catId].totalAmount += amt;
          map[catId].count += 1;
        }
        if (t.amount < 0) totalExpense += amt;
      }
    });

    return { map, totalExpense };
  }, [transactions]);

  // Selected Category deep data analytics
  const selectedCategoryMeta = CATEGORIES[selectedCategoryId] || CATEGORIES.MISC;

  const categoryData = useMemo(() => {
    const filtered = transactions.filter(t => t.categoryId === selectedCategoryId);

    // Monthly breakdown for this specific category
    const monthlyMap = {};
    const merchantMap = {};
    let totalCategorySpent = 0;

    filtered.forEach(t => {
      const amt = Math.abs(t.amount);
      totalCategorySpent += amt;

      const month = t.date ? t.date.slice(0, 7) : 'Unknown';
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, amount: 0, count: 0 };
      }
      monthlyMap[month].amount += amt;
      monthlyMap[month].count += 1;

      const merchant = t.cleanName;
      if (!merchantMap[merchant]) {
        merchantMap[merchant] = { name: merchant, amount: 0, count: 0 };
      }
      merchantMap[merchant].amount += amt;
      merchantMap[merchant].count += 1;
    });

    const monthlyChartData = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        label: formatMonthLabel(m.month)
      }));

    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.amount - a.amount);

    return {
      txns: filtered,
      totalCategorySpent,
      monthlyChartData,
      topMerchants
    };
  }, [transactions, selectedCategoryId]);

  // Filtered & sorted transaction log for table view
  const processedCategoryTxns = useMemo(() => {
    return categoryData.txns
      .filter(t => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.cleanName.toLowerCase().includes(q) ||
          (t.account && t.account.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'amount') {
          valA = Math.abs(valA);
          valB = Math.abs(valB);
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [categoryData.txns, searchTerm, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Selection Carousel / Grid */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Category Deep-Dive Explorer</h2>
          </div>
          <span className="text-xs text-slate-400">Select a category to view monthly spend trends</span>
        </div>

        {/* Category Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.values(CATEGORIES).map((cat) => {
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
            const stats = categoryStats.map[cat.id];
            const isSelected = selectedCategoryId === cat.id;
            const pctOfTotal = categoryStats.totalExpense > 0 && cat.id !== 'INCOME'
              ? ((stats.totalAmount / categoryStats.totalExpense) * 100).toFixed(1)
              : 0;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`p-3.5 rounded-xl text-left border transition-all relative overflow-hidden group flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'glass-panel border-indigo-500 shadow-lg shadow-indigo-500/20 bg-slate-900/90'
                    : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center" 
                    style={{ backgroundColor: cat.bgColor, color: cat.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {cat.id !== 'INCOME' && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {pctOfTotal}%
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="text-xs font-extrabold text-slate-200 mt-0.5">
                    ₹{stats.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Header Banner */}
      <div 
        className="glass-panel p-6 rounded-2xl border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ borderColor: selectedCategoryMeta.borderColor }}
      >
        <div className="flex items-center space-x-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: selectedCategoryMeta.bgColor, color: selectedCategoryMeta.color }}
          >
            {React.createElement(ICON_MAP[selectedCategoryMeta.icon] || MoreHorizontal, { className: 'w-7 h-7' })}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-white">{selectedCategoryMeta.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${selectedCategoryMeta.badgeClass}`}>
                {categoryData.txns.length} Transactions
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Monthly spent analysis and merchant breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 bg-slate-950/60 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Total Spent</span>
            <div className="text-2xl font-black text-white">
              ₹{categoryData.totalCategorySpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Avg / Transaction</span>
            <div className="text-lg font-bold text-slate-200">
              ₹{categoryData.txns.length ? Math.round(categoryData.totalCategorySpent / categoryData.txns.length).toLocaleString('en-IN') : 0}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Spend Trend Chart & Top Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Monthly Spending Trend: {selectedCategoryMeta.name}</span>
              </h3>
              <p className="text-xs text-slate-400">Month-by-month spending history</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {categoryData.monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                  <Tooltip content={<CategoryMonthlyTooltip color={selectedCategoryMeta.color} />} />
                  <Bar dataKey="amount" fill={selectedCategoryMeta.color} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No transactions logged in this category for the selected timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Category Top Merchants Leaderboard */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Category Top Payees</h3>
            <p className="text-xs text-slate-400 mb-4">Highest spending destinations in {selectedCategoryMeta.name}</p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {categoryData.topMerchants.slice(0, 6).map((m, idx) => {
                const pct = categoryData.totalCategorySpent > 0
                  ? ((m.amount / categoryData.totalCategorySpent) * 100).toFixed(1)
                  : 0;

                return (
                  <div key={m.name} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-xs font-bold text-indigo-400 flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-white truncate max-w-[130px]">{m.name}</h4>
                        <span className="text-[10px] text-slate-400">{m.count} txns ({pct}%)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">₹{m.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Filtered Category Transactions Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Category Transaction Logs</h3>
            <p className="text-xs text-slate-400">All {processedCategoryTxns.length} entries for {selectedCategoryMeta.name}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchant or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="p-3 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Merchant / Payee Name</th>
                <th className="p-3">Account</th>
                <th className="p-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Amount (₹)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedCategoryTxns.length > 0 ? (
                processedCategoryTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 text-slate-300 font-mono whitespace-nowrap">{t.date}</td>
                    <td className="p-3 font-medium text-white">
                      <div className="font-semibold">{t.cleanName}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{t.name}</div>
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                        {t.account}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold font-mono text-slate-200">
                      ₹{Math.abs(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No transactions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function CategoryMonthlyTooltip({ active, payload, color }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{data.label}</p>
        <p className="font-extrabold text-white" style={{ color }}>
          Spent: ₹{data.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
        <p className="text-slate-400">{data.count} transactions</p>
      </div>
    );
  }
  return null;
}

function formatMonthLabel(ym) {
  if (!ym || ym === 'Unknown') return ym;
  const [y, m] = ym.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
