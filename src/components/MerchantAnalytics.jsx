import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  Calendar, 
  Receipt, 
  TrendingDown, 
  X, 
  ArrowLeft,
  Filter,
  BarChart3
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

export default function MerchantAnalytics({ transactions, initialMerchant = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalSpend'); // totalSpend | count | avgSpend | name
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedMerchant, setSelectedMerchant] = useState(initialMerchant);

  // Group by Merchant Name (amount < 0)
  const merchantSummary = useMemo(() => {
    const map = {};
    let grandTotalExpense = 0;

    transactions.forEach(t => {
      // Focus on debit/spending transactions
      if (t.amount < 0) {
        const amt = Math.abs(t.amount);
        const name = t.cleanName || t.name || 'Unknown';
        grandTotalExpense += amt;

        if (!map[name]) {
          map[name] = {
            name,
            count: 0,
            totalSpend: 0,
            transactions: [],
            accounts: new Set(),
            firstDate: t.date,
            lastDate: t.date
          };
        }

        const m = map[name];
        m.count += 1;
        m.totalSpend += amt;
        m.transactions.push(t);
        if (t.account) m.accounts.add(t.account);

        if (t.date < m.firstDate) m.firstDate = t.date;
        if (t.date > m.lastDate) m.lastDate = t.date;
      }
    });

    const list = Object.values(map).map(m => {
      const avgSpend = m.count > 0 ? m.totalSpend / m.count : 0;
      const pctOfTotal = grandTotalExpense > 0 ? ((m.totalSpend / grandTotalExpense) * 100).toFixed(1) : 0;
      return {
        ...m,
        avgSpend,
        pctOfTotal: parseFloat(pctOfTotal),
        accountList: Array.from(m.accounts).join(', ')
      };
    });

    return { list, grandTotalExpense };
  }, [transactions]);

  // Filtered & Sorted Merchants List
  const processedMerchants = useMemo(() => {
    return merchantSummary.list
      .filter(m => {
        if (!searchTerm) return true;
        return m.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [merchantSummary.list, searchTerm, sortField, sortOrder]);

  // Selected Merchant Analytics & Monthly Breakdown
  const selectedMerchantData = useMemo(() => {
    if (!selectedMerchant) return null;

    const mData = merchantSummary.list.find(m => m.name === selectedMerchant);
    if (!mData) return null;

    // Monthly breakdown for this merchant
    const monthlyMap = {};
    mData.transactions.forEach(t => {
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

    // Sorted transactions list for this merchant
    const sortedTxns = [...mData.transactions].sort((a, b) => b.date.localeCompare(a.date));

    return {
      ...mData,
      monthlyChartData,
      sortedTxns
    };
  }, [selectedMerchant, merchantSummary.list]);

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
      
      {/* Page Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <span>Spending by Merchant (GROUP BY Name)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated spend leaderboard for {merchantSummary.list.length} distinct merchants
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-900/90 px-3.5 py-2 rounded-xl border border-white/10">
          <span className="text-slate-400">Total Outflow:</span>
          <span className="text-sm font-extrabold text-rose-400">
            ₹{merchantSummary.grandTotalExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* If a merchant is selected, show detail view / modal drawer */}
      {selectedMerchantData ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Back Button & Banner */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedMerchant(null)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Merchants</span>
            </button>

            <span className="text-xs text-slate-400">
              Showing deep-dive analytics for <strong className="text-white">{selectedMerchantData.name}</strong>
            </span>
          </div>

          {/* Merchant Stats Header */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/80">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Merchant</span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{selectedMerchantData.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedMerchantData.accountList}</p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Total Spend</span>
                <div className="text-2xl font-extrabold text-rose-400 mt-0.5">
                  ₹{selectedMerchantData.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-400">{selectedMerchantData.pctOfTotal}% of all expenses</span>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Transactions</span>
                <div className="text-2xl font-extrabold text-indigo-300 mt-0.5">
                  {selectedMerchantData.count} <span className="text-xs font-normal text-slate-400">orders</span>
                </div>
                <span className="text-[11px] text-slate-400">Avg ₹{Math.round(selectedMerchantData.avgSpend).toLocaleString('en-IN')}/txn</span>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Activity Period</span>
                <div className="text-xs font-semibold text-slate-200 mt-2 font-mono">
                  {selectedMerchantData.firstDate} <br />
                  <span className="text-slate-500">to</span> {selectedMerchantData.lastDate}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Spend Chart for Selected Merchant */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Monthly Spend Trend: {selectedMerchantData.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Month-by-month spending timeline</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedMerchantData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                  <Tooltip content={<MerchantMonthlyTooltip merchantName={selectedMerchantData.name} />} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Transactions List for Selected Merchant */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">All {selectedMerchantData.name} Transactions</h3>

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
                  {selectedMerchantData.sortedTxns.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-300 whitespace-nowrap">{t.date}</td>
                      <td className="p-3 text-slate-200 font-sans">{t.name}</td>
                      <td className="p-3 text-slate-400 whitespace-nowrap font-sans">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {t.account}
                        </span>
                      </td>
                      <td className="p-3 text-right text-rose-400 font-extrabold font-mono">
                        -₹{Math.abs(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Main Merchant Leaderboard Table */
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant name (e.g. Zepto, Swiggy)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{processedMerchants.length}</span> merchants
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>Merchant Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center cursor-pointer hover:text-white" onClick={() => toggleSort('count')}>
                    <div className="flex items-center justify-center space-x-1">
                      <span>Transactions</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('totalSpend')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total Spend (₹)</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('avgSpend')}>
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
                {processedMerchants.length > 0 ? (
                  processedMerchants.map((m, idx) => (
                    <tr 
                      key={m.name}
                      onClick={() => setSelectedMerchant(m.name)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 text-center font-bold text-indigo-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="p-3.5 font-bold text-white group-hover:text-indigo-300 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span>{m.name}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-mono text-slate-300">
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-white/10 text-xs font-semibold">
                          {m.count}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-extrabold text-rose-400 text-sm">
                        ₹{m.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-300">
                        ₹{Math.round(m.avgSpend).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                          {m.pctOfTotal}%
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
                      No merchants found matching your search.
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

function MerchantMonthlyTooltip({ active, payload, merchantName }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{merchantName} - {data.label}</p>
        <p className="font-extrabold text-indigo-400">
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
