import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  Calendar, 
  Receipt, 
  TrendingDown, 
  TrendingUp,
  X, 
  ArrowLeft,
  Filter,
  BarChart3,
  Briefcase,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function MerchantAnalytics({ transactions, initialMerchant = null, initialType = 'EXPENSE' }) {
  const [viewType, setViewType] = useState('EXPENSE'); // 'EXPENSE' (Spending) | 'INCOME' (Salary/Credits)
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalAmount'); // totalAmount | count | avgAmount | name
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedEntity, setSelectedEntity] = useState(initialMerchant);

  // Group transactions by Name based on viewType (INCOME vs EXPENSE)
  const entitySummary = useMemo(() => {
    const map = {};
    let grandTotal = 0;

    transactions.forEach(t => {
      const isIncome = t.amount > 0;
      const matchesType = (viewType === 'INCOME' && isIncome) || (viewType === 'EXPENSE' && !isIncome);

      if (matchesType) {
        const amt = Math.abs(t.amount);
        const name = t.cleanName || t.name || 'Unknown';
        grandTotal += amt;

        if (!map[name]) {
          map[name] = {
            name,
            count: 0,
            totalAmount: 0,
            transactions: [],
            accounts: new Set(),
            firstDate: t.date,
            lastDate: t.date
          };
        }

        const e = map[name];
        e.count += 1;
        e.totalAmount += amt;
        e.transactions.push(t);
        if (t.account) e.accounts.add(t.account);

        if (t.date < e.firstDate) e.firstDate = t.date;
        if (t.date > e.lastDate) e.lastDate = t.date;
      }
    });

    const list = Object.values(map).map(e => {
      const avgAmount = e.count > 0 ? e.totalAmount / e.count : 0;
      const pctOfTotal = grandTotal > 0 ? ((e.totalAmount / grandTotal) * 100).toFixed(1) : 0;
      return {
        ...e,
        avgAmount,
        pctOfTotal: parseFloat(pctOfTotal),
        accountList: Array.from(e.accounts).join(', ')
      };
    });

    return { list, grandTotal };
  }, [transactions, viewType]);

  // Filtered & Sorted Entities List
  const processedEntities = useMemo(() => {
    return entitySummary.list
      .filter(e => {
        if (!searchTerm) return true;
        return e.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [entitySummary.list, searchTerm, sortField, sortOrder]);

  // Selected Entity Analytics & Monthly Breakdown
  const selectedEntityData = useMemo(() => {
    if (!selectedEntity) return null;

    const eData = entitySummary.list.find(e => e.name === selectedEntity);
    if (!eData) return null;

    // Monthly breakdown for this entity
    const monthlyMap = {};
    eData.transactions.forEach(t => {
      const month = t.date ? t.date.slice(0, 7) : 'Unknown';
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, amount: 0, count: 0 };
      }
      monthlyMap[month].amount += Math.abs(t.amount);
      monthlyMap[month].count += 1;
    });

    const monthlyChartData = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        label: formatMonthLabel(m.month)
      }));

    const sortedTxns = [...eData.transactions].sort((a, b) => b.date.localeCompare(a.date));

    return {
      ...eData,
      monthlyChartData,
      sortedTxns
    };
  }, [selectedEntity, entitySummary.list]);

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
      
      {/* Page Header & View Switcher */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {viewType === 'INCOME' ? (
              <Briefcase className="w-5 h-5 text-emerald-400" />
            ) : (
              <Store className="w-5 h-5 text-indigo-400" />
            )}
            <span>
              {viewType === 'INCOME' ? 'Salary & Income Sources' : 'Spending by Merchant'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            GROUP BY Name — {entitySummary.list.length} distinct {viewType === 'INCOME' ? 'income payers / sources' : 'merchants'}
          </p>
        </div>

        {/* Income vs Expense Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => {
              setViewType('EXPENSE');
              setSelectedEntity(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewType === 'EXPENSE'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Merchants (Outflows)</span>
          </button>

          <button
            onClick={() => {
              setViewType('INCOME');
              setSelectedEntity(null);
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewType === 'INCOME'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Salary & Credits (Inflows)</span>
          </button>
        </div>
      </div>

      {/* Selected Entity (Salary / Merchant) Deep Dive View */}
      {selectedEntityData ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedEntity(null)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All {viewType === 'INCOME' ? 'Income Sources' : 'Merchants'}</span>
            </button>

            <span className="text-xs text-slate-400">
              Showing deep-dive analytics for <strong className="text-white">{selectedEntityData.name}</strong>
            </span>
          </div>

          {/* Stats Header Banner */}
          <div className={`glass-panel p-6 rounded-2xl border bg-gradient-to-r ${
            viewType === 'INCOME'
              ? 'border-emerald-500/30 from-emerald-950/30 to-slate-900/80'
              : 'border-indigo-500/30 from-indigo-950/30 to-slate-900/80'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {viewType === 'INCOME' ? 'Income Source / Employer' : 'Merchant'}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{selectedEntityData.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedEntityData.accountList}</p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {viewType === 'INCOME' ? 'Total Received' : 'Total Spent'}
                </span>
                <div className={`text-2xl font-extrabold mt-0.5 ${viewType === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {viewType === 'INCOME' ? '+' : '-'}₹{selectedEntityData.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-400">{selectedEntityData.pctOfTotal}% of total {viewType === 'INCOME' ? 'income' : 'expenses'}</span>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Transactions</span>
                <div className="text-2xl font-extrabold text-indigo-300 mt-0.5">
                  {selectedEntityData.count} <span className="text-xs font-normal text-slate-400">entries</span>
                </div>
                <span className="text-[11px] text-slate-400">Avg ₹{Math.round(selectedEntityData.avgAmount).toLocaleString('en-IN')}/deposit</span>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Activity Period</span>
                <div className="text-xs font-semibold text-slate-200 mt-2 font-mono">
                  {selectedEntityData.firstDate} <br />
                  <span className="text-slate-500">to</span> {selectedEntityData.lastDate}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Monthly {viewType === 'INCOME' ? 'Income' : 'Spend'} Trend: {selectedEntityData.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Month-by-month cash flow history</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedEntityData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                  <Tooltip content={<EntityMonthlyTooltip entityName={selectedEntityData.name} isIncome={viewType === 'INCOME'} />} />
                  <Bar dataKey="amount" fill={viewType === 'INCOME' ? '#10b981' : '#6366f1'} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">All {selectedEntityData.name} Transactions</h3>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Bank Transaction Description</th>
                    <th className="p-3">Account</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {selectedEntityData.sortedTxns.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-300 whitespace-nowrap">{t.date}</td>
                      <td className="p-3 text-slate-200 font-sans">{t.name}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {t.account}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-extrabold font-mono ${t.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Main Leaderboard Table View */
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={viewType === 'INCOME' ? "Search employer / salary source..." : "Search merchant name (Zepto, Swiggy)..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="text-xs text-slate-400">
              Total {viewType === 'INCOME' ? 'Income' : 'Outflow'}: <strong className={viewType === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}>
                ₹{entitySummary.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>{viewType === 'INCOME' ? 'Salary Source / Payer Name' : 'Merchant Name'}</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center cursor-pointer hover:text-white" onClick={() => toggleSort('count')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Transactions</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('totalAmount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>{viewType === 'INCOME' ? 'Total Received (₹)' : 'Total Spend (₹)'}</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('avgAmount')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Avg / Txn (₹)</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">% of Total</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {processedEntities.length > 0 ? (
                  processedEntities.map((e, idx) => (
                    <tr 
                      key={e.name}
                      onClick={() => setSelectedEntity(e.name)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 text-center font-bold text-indigo-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="p-3.5 font-bold text-white group-hover:text-indigo-300 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span>{e.name}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-mono text-slate-300">
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-white/10 text-xs font-semibold">
                          {e.count}
                        </span>
                      </td>

                      <td className={`p-3.5 text-right font-mono font-extrabold text-sm ${viewType === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {viewType === 'INCOME' ? '+' : '-'}₹{e.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-300">
                        ₹{Math.round(e.avgAmount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                          {e.pctOfTotal}%
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button className="p-1.5 rounded-lg bg-white/5 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No entries found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function EntityMonthlyTooltip({ active, payload, entityName, isIncome }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{entityName} - {data.label}</p>
        <p className={`font-extrabold ${isIncome ? 'text-emerald-400' : 'text-indigo-400'}`}>
          {isIncome ? 'Received: +' : 'Spent: -'}₹{data.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
