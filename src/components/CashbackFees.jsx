import React, { useState, useMemo } from 'react';
import { 
  Gift, 
  Receipt, 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function CashbackFees({ transactions }) {
  const [activeSubTab, setActiveSubTab] = useState('ALL'); // ALL | CASHBACKS | FEES | INTEREST

  // Classify transactions into Cashbacks, Fees, and Interest
  const analytics = useMemo(() => {
    const cashbacks = [];
    const fees = [];
    const interest = [];
    const accountMap = {};

    let totalCashback = 0;
    let totalFees = 0;
    let totalInterest = 0;

    transactions.forEach(t => {
      const name = (t.name || '').toUpperCase();
      const amt = floatVal(t.amount);
      const acc = t.account || 'Unknown';

      if (!accountMap[acc]) {
        accountMap[acc] = { name: acc, cashback: 0, fees: 0, interest: 0, net: 0 };
      }

      // Check if fee/charge
      const isFee = (
        name.includes('FEE') ||
        name.includes('CHARGE') ||
        name.includes('ANNUAL') ||
        name.includes('JOINING') ||
        name.includes('EMI PROCESSING') ||
        name.includes('PENALTY') ||
        (name.includes('INTEREST') && amt < 0)
      );


      // Check if cashback/refund/reward
      const isCashback = (
        name.includes('CASHBACK') ||
        name.includes('REFUND') ||
        name.includes('REBATE') ||
        name.includes('BHIMCASH') ||
        (name.includes('DISTRICT') && name.includes('REFUND')) ||
        (name.includes('CRED') && amt > 0 && amt < 2000)
      );

      // Check if bank savings interest income
      const isInterestIncome = (
        amt > 0 && (name.includes('INTEREST PAID') || name.includes('INT.PD') || name === 'INTEREST')
      );

      if (isCashback) {
        cashbacks.push({ ...t, type: 'CASHBACK', absAmount: Math.abs(amt) });
        totalCashback += Math.abs(amt);
        accountMap[acc].cashback += Math.abs(amt);
        accountMap[acc].net += Math.abs(amt);
      } else if (isFee) {
        fees.push({ ...t, type: 'FEE', absAmount: Math.abs(amt) });
        totalFees += Math.abs(amt);
        accountMap[acc].fees += Math.abs(amt);
        accountMap[acc].net -= Math.abs(amt);
      } else if (isInterestIncome) {
        interest.push({ ...t, type: 'INTEREST', absAmount: Math.abs(amt) });
        totalInterest += Math.abs(amt);
        accountMap[acc].interest += Math.abs(amt);
        accountMap[acc].net += Math.abs(amt);
      }
    });

    const netBenefit = totalCashback + totalInterest - totalFees;
    const accountList = Object.values(accountMap).sort((a, b) => b.cashback - a.cashback);

    // Monthly breakdown for chart
    const monthlyMap = {};
    [...cashbacks, ...fees, ...interest].forEach(t => {
      const month = t.date ? t.date.slice(0, 7) : 'Unknown';
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, cashback: 0, fee: 0, interest: 0 };
      }
      if (t.type === 'CASHBACK') monthlyMap[month].cashback += t.absAmount;
      if (t.type === 'FEE') monthlyMap[month].fee += t.absAmount;
      if (t.type === 'INTEREST') monthlyMap[month].interest += t.absAmount;
    });

    const monthlyChartData = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        label: formatMonthLabel(m.month)
      }));

    return {
      cashbacks,
      fees,
      interest,
      totalCashback,
      totalFees,
      totalInterest,
      netBenefit,
      accountList,
      monthlyChartData
    };
  }, [transactions]);

  // Combined logs list based on subtab
  const displayedLogs = useMemo(() => {
    let list = [];
    if (activeSubTab === 'ALL') {
      list = [...analytics.cashbacks, ...analytics.fees, ...analytics.interest];
    } else if (activeSubTab === 'CASHBACKS') {
      list = analytics.cashbacks;
    } else if (activeSubTab === 'FEES') {
      list = analytics.fees;
    } else if (activeSubTab === 'INTEREST') {
      list = analytics.interest;
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [analytics, activeSubTab]);

  return (
    <div className="space-y-6">
      
      {/* Page Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            <span>Cashbacks, Rewards & Card Fees Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit credit card joining fees, processing charges, fuel cashbacks, refunds, and interest earnings
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-900/90 px-3.5 py-2 rounded-xl border border-white/10">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-medium">Net Card Value:</span>
          <span className={`text-sm font-extrabold ${analytics.netBenefit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {analytics.netBenefit >= 0 ? '+' : ''}₹{analytics.netBenefit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Cashbacks & Refunds */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cashbacks & Refunds</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 mb-1">
            +₹{analytics.totalCashback.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {analytics.cashbacks.length} cashback & refund entries
          </span>
        </div>

        {/* Total Card Fees & Charges */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fees & Charges</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-400 mb-1">
            -₹{analytics.totalFees.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {analytics.fees.length} joining fee & charge entries
          </span>
        </div>

        {/* Savings Interest Earned */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Interest Earned</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-indigo-300 mb-1">
            +₹{analytics.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Bank interest credits
          </span>
        </div>

        {/* Net Value Outcome */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Card & Account Gain</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-extrabold mb-1 ${analytics.netBenefit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {analytics.netBenefit >= 0 ? '+' : ''}₹{analytics.netBenefit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Rewards minus Fees & Charges
          </span>
        </div>

      </div>

      {/* Monthly Chart & Account Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Cashback vs Fees Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-1">Monthly Cashbacks vs Fees</h3>
          <p className="text-xs text-slate-400 mb-4">Tracking monthly reward credits against card fees & charges</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CashbackFeeTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="cashback" name="Cashback & Refunds (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fee" name="Card Fees (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interest" name="Interest Credit (₹)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Breakdown List */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Account & Card Ledger</h3>
            <p className="text-xs text-slate-400 mb-4">Cashbacks vs Fees per linked account</p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.accountList.map((acc) => (
                <div key={acc.name} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{acc.name}</span>
                    <span className={`text-xs font-extrabold ${acc.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {acc.net >= 0 ? '+' : ''}₹{acc.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-emerald-400">+₹{acc.cashback.toFixed(2)} CB</span>
                    {acc.interest > 0 && <span className="text-indigo-400">+₹{acc.interest.toFixed(2)} Int</span>}
                    <span className="text-rose-400">-₹{acc.fees.toFixed(2)} Fees</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Filtered Logs Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Cashback & Fee Transactions Log</h3>

          {/* Subtab Filter */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10">
            {[
              { id: 'ALL', label: 'All Entries' },
              { id: 'CASHBACKS', label: 'Cashbacks' },
              { id: 'FEES', label: 'Card Fees' },
              { id: 'INTEREST', label: 'Interest' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>


        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Bank Transaction Description</th>
                <th className="p-3">Account</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {displayedLogs.length > 0 ? (
                displayedLogs.map((t) => {
                  const isFee = t.type === 'FEE';
                  const isCB = t.type === 'CASHBACK';
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-300 whitespace-nowrap">{t.date}</td>
                      <td className="p-3 font-sans whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCB
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isFee
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-white font-medium">{t.name}</td>
                      <td className="p-3 font-sans text-slate-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {t.account}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-extrabold ${isFee ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isFee ? '-' : '+'}₹{t.absAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No entries found in this view.
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

function CashbackFeeTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200 border-b border-white/10 pb-1 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between space-x-4">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
            <span className="font-bold text-white">₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function floatVal(val) {
  return parseFloat(val || 0);
}

function formatMonthLabel(ym) {
  if (!ym || ym === 'Unknown') return ym;
  const [y, m] = ym.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
