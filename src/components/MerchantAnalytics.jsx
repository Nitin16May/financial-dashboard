import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Store, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  ArrowLeft,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
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

export default function MerchantAnalytics({ transactions, initialEntity = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(initialEntity);

  // Group transactions by Name for BOTH Inflows (amount > 0) and Outflows (amount < 0)
  const analytics = useMemo(() => {
    const inflowMap = {};
    const outflowMap = {};
    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach(t => {
      const amt = Math.abs(t.amount);
      const name = t.cleanName || t.name || 'Unknown';
      const isIncome = t.amount > 0;

      if (isIncome) {
        totalInflow += amt;
        if (!inflowMap[name]) {
          inflowMap[name] = {
            name,
            count: 0,
            totalAmount: 0,
            transactions: [],
            accounts: new Set(),
            firstDate: t.date,
            lastDate: t.date,
            isIncome: true
          };
        }
        const e = inflowMap[name];
        e.count += 1;
        e.totalAmount += amt;
        e.transactions.push(t);
        if (t.account) e.accounts.add(t.account);
        if (t.date < e.firstDate) e.firstDate = t.date;
        if (t.date > e.lastDate) e.lastDate = t.date;
      } else {
        totalOutflow += amt;
        if (!outflowMap[name]) {
          outflowMap[name] = {
            name,
            count: 0,
            totalAmount: 0,
            transactions: [],
            accounts: new Set(),
            firstDate: t.date,
            lastDate: t.date,
            isIncome: false
          };
        }
        const e = outflowMap[name];
        e.count += 1;
        e.totalAmount += amt;
        e.transactions.push(t);
        if (t.account) e.accounts.add(t.account);
        if (t.date < e.firstDate) e.firstDate = t.date;
        if (t.date > e.lastDate) e.lastDate = t.date;
      }
    });

    const formatList = (map, total) => {
      return Object.values(map)
        .map(e => ({
          ...e,
          avgAmount: e.count > 0 ? e.totalAmount / e.count : 0,
          pctOfTotal: total > 0 ? parseFloat(((e.totalAmount / total) * 100).toFixed(1)) : 0,
          accountList: Array.from(e.accounts).join(', ')
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
    };

    const inflows = formatList(inflowMap, totalInflow);
    const outflows = formatList(outflowMap, totalOutflow);

    return {
      inflows,
      outflows,
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      allEntities: [...inflows, ...outflows]
    };
  }, [transactions]);

  // Filtered lists by search term
  const filteredInflows = useMemo(() => {
    if (!searchTerm) return analytics.inflows;
    const q = searchTerm.toLowerCase();
    return analytics.inflows.filter(e => e.name.toLowerCase().includes(q));
  }, [analytics.inflows, searchTerm]);

  const filteredOutflows = useMemo(() => {
    if (!searchTerm) return analytics.outflows;
    const q = searchTerm.toLowerCase();
    return analytics.outflows.filter(e => e.name.toLowerCase().includes(q));
  }, [analytics.outflows, searchTerm]);

  // Selected Entity Analytics & Monthly Breakdown
  const selectedEntityData = useMemo(() => {
    if (!selectedEntity) return null;

    const eData = analytics.allEntities.find(e => e.name === selectedEntity);
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
  }, [selectedEntity, analytics.allEntities]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <span>Inflows & Outflows Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            1 Unified Page — Grouped by Salary Sources (Inflows) and Merchants (Outflows)
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search salary source or merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Top Total Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Inflows Card */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Inflows (Income/Credits)</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            +₹{analytics.totalInflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">{analytics.inflows.length} distinct income sources</span>
        </div>

        {/* Total Outflows Card */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Outflows (Merchants/Expenses)</span>
            <TrendingDown className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            -₹{analytics.totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">{analytics.outflows.length} distinct merchants</span>
        </div>

        {/* Net Flow Card */}
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Cash Balance Flow</span>
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div className={`text-2xl font-extrabold ${analytics.netFlow >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            {analytics.netFlow >= 0 ? '+' : ''}₹{analytics.netFlow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">Income minus Outflows</span>
        </div>

      </div>

      {/* If an entity is selected, show detail view */}
      {selectedEntityData ? (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedEntity(null)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inflows & Outflows Overview</span>
            </button>

            <span className="text-xs text-slate-400">
              Showing deep-dive analytics for <strong className="text-white">{selectedEntityData.name}</strong>
            </span>
          </div>

          {/* Header Banner */}
          <div className={`glass-panel p-6 rounded-2xl border bg-gradient-to-r ${
            selectedEntityData.isIncome
              ? 'border-emerald-500/30 from-emerald-950/30 to-slate-900/80'
              : 'border-rose-500/30 from-rose-950/30 to-slate-900/80'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {selectedEntityData.isIncome ? 'Income Source / Employer' : 'Merchant'}
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{selectedEntityData.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedEntityData.accountList}</p>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {selectedEntityData.isIncome ? 'Total Received' : 'Total Spent'}
                </span>
                <div className={`text-2xl font-extrabold mt-0.5 ${selectedEntityData.isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedEntityData.isIncome ? '+' : '-'}₹{selectedEntityData.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-400">{selectedEntityData.pctOfTotal}% of total {selectedEntityData.isIncome ? 'inflows' : 'outflows'}</span>
              </div>

              <div>
                <span className="text-xs uppercase font-semibold text-slate-400">Transactions</span>
                <div className="text-2xl font-extrabold text-indigo-300 mt-0.5">
                  {selectedEntityData.count} <span className="text-xs font-normal text-slate-400">entries</span>
                </div>
                <span className="text-[11px] text-slate-400">Avg ₹{Math.round(selectedEntityData.avgAmount).toLocaleString('en-IN')}/txn</span>
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

          {/* Monthly Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Monthly {selectedEntityData.isIncome ? 'Income' : 'Spend'} Trend: {selectedEntityData.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Month-by-month cash flow history</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedEntityData.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                  <Tooltip content={<EntityTooltip entityName={selectedEntityData.name} isIncome={selectedEntityData.isIncome} />} />
                  <Bar dataKey="amount" fill={selectedEntityData.isIncome ? '#10b981' : '#f43f5e'} radius={[6, 6, 0, 0]} />
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
        /* Single Page with Inflows & Outflows Tables Side-by-Side / Stacked */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SECTION 1: INFLOWS (INCOME & SALARY) */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">🟢 Inflows & Salary Sources</h3>
                  <p className="text-xs text-slate-400">GROUP BY Name for Income (`amount &gt; 0`)</p>
                </div>
              </div>

              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {filteredInflows.length} Sources
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Salary Source / Payer</th>
                    <th className="p-3 text-center">Count</th>
                    <th className="p-3 text-right">Received (₹)</th>
                    <th className="p-3 text-right">% Inc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInflows.length > 0 ? (
                    filteredInflows.map((e, idx) => (
                      <tr 
                        key={e.name}
                        onClick={() => setSelectedEntity(e.name)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 text-center font-bold text-emerald-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {e.name}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px]">
                            {e.count}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-emerald-400">
                          +₹{e.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {e.pctOfTotal}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No income sources found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: OUTFLOWS (SPENDING BY MERCHANT) */}
          <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">🔴 Outflows & Merchants</h3>
                  <p className="text-xs text-slate-400">GROUP BY Name for Spending (`amount &lt; 0`)</p>
                </div>
              </div>

              <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                {filteredOutflows.length} Merchants
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Merchant Name</th>
                    <th className="p-3 text-center">Count</th>
                    <th className="p-3 text-right">Spent (₹)</th>
                    <th className="p-3 text-right">% Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOutflows.length > 0 ? (
                    filteredOutflows.map((e, idx) => (
                      <tr 
                        key={e.name}
                        onClick={() => setSelectedEntity(e.name)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 text-center font-bold text-indigo-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {e.name}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[11px]">
                            {e.count}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-rose-400">
                          -₹{e.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {e.pctOfTotal}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No merchants found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

function EntityTooltip({ active, payload, entityName, isIncome }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{entityName} - {data.label}</p>
        <p className={`font-extrabold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
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
