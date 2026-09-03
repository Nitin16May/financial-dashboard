import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { CATEGORIES } from '../utils/categorizer';

export default function DashboardOverview({ transactions, onSelectCategory, onSelectMerchant }) {
  // Aggregate KPIs

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const accounts = {};
    const categories = {};
    const merchants = {};
    const monthlyMap = {};

    transactions.forEach(t => {
      const amt = t.amount;
      const acc = t.account || 'Unknown';
      const catId = t.categoryId;
      const merchant = t.cleanName;
      const month = t.date ? t.date.slice(0, 7) : 'Unknown';

      // Monthly aggregation
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expense: 0 };
      }

      // Accounts aggregation
      if (!accounts[acc]) {
        accounts[acc] = { name: acc, income: 0, expense: 0, total: 0 };
      }

      if (amt > 0) {
        income += amt;
        monthlyMap[month].income += amt;
        accounts[acc].income += amt;
      } else {
        const absAmt = Math.abs(amt);
        expense += absAmt;
        monthlyMap[month].expense += absAmt;
        accounts[acc].expense += absAmt;

        // Categories aggregation (Expenses only)
        if (!categories[catId]) {
          categories[catId] = {
            id: catId,
            name: CATEGORIES[catId]?.name || 'Misc',
            color: CATEGORIES[catId]?.color || '#6b7280',
            amount: 0,
            count: 0
          };
        }
        categories[catId].amount += absAmt;
        categories[catId].count += 1;

        // Merchants aggregation
        if (!merchants[merchant]) {
          merchants[merchant] = { name: merchant, amount: 0, count: 0, categoryId: catId };
        }
        merchants[merchant].amount += absAmt;
        merchants[merchant].count += 1;
      }

      accounts[acc].total += Math.abs(amt);
    });

    const net = income - expense;
    const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : 0;
    const daysCount = new Set(transactions.map(t => t.date)).size || 1;
    const avgDailyExpense = expense / daysCount;

    // Monthly chart data sorted chronologically
    const monthlyData = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        label: formatMonthLabel(m.month)
      }));

    // Category pie data
    const categoryData = Object.values(categories)
      .sort((a, b) => b.amount - a.amount);

    // Account bar data
    const accountData = Object.values(accounts)
      .sort((a, b) => b.expense - a.expense);

    // Top 5 Merchants
    const topMerchants = Object.values(merchants)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      income,
      expense,
      net,
      savingsRate,
      avgDailyExpense,
      daysCount,
      count: transactions.length,
      monthlyData,
      categoryData,
      accountData,
      topMerchants
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income Card */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Income</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
            ₹{stats.income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            <span>Credits from {stats.count} transactions</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Spending</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
            ₹{stats.expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-xs text-rose-400 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            <span>Avg ₹{Math.round(stats.avgDailyExpense).toLocaleString('en-IN')}/day</span>
          </div>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Cash Flow</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl lg:text-3xl font-extrabold mb-1 ${stats.net >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            {stats.net >= 0 ? '+' : ''}₹{stats.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-xs text-slate-400 font-medium space-x-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
              {stats.savingsRate}% Savings Rate
            </span>
          </div>
        </div>

        {/* Transactions & Accounts Overview */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Accounts</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white mb-1">
            {stats.accountData.length} <span className="text-base font-normal text-slate-400">Accounts</span>
          </div>
          <div className="flex items-center text-xs text-purple-400 font-medium">
            <span>{stats.count} Total logged entries</span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid: Timeline & Category Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Timeline Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span>Cash Flow Timeline (Income vs Expense)</span>
              </h2>
              <p className="text-xs text-slate-400">Monthly breakdown of inflows and outflows</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-300">Income</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-300">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-purple-400" />
                  <span>Category Distribution</span>
                </h2>
                <p className="text-xs text-slate-400">Spending breakdown by category</p>
              </div>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400">Total Spent</span>
                <span className="text-sm font-bold text-white">₹{(stats.expense/1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
            {stats.categoryData.slice(0, 5).map((cat) => {
              const pct = stats.expense > 0 ? ((cat.amount / stats.expense) * 100).toFixed(1) : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-slate-200 font-medium group-hover:text-white transition-colors">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">₹{cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold">{pct}%</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Account Spending & Top Merchants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Account Spending Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-bold text-white mb-1">Account & Card Activity</h2>
          <p className="text-xs text-slate-400 mb-4">Total cash outflows per linked account</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.accountData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fill: '#f3f4f6', fontSize: 11 }} width={95} />
                <Tooltip content={<AccountTooltip />} />
                <Bar dataKey="expense" name="Expense" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Merchants Leaderboard */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Top Spending Destinations</h2>
              <p className="text-xs text-slate-400">Merchants with highest accumulated spend</p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.topMerchants.map((m, idx) => {
              const catMeta = CATEGORIES[m.categoryId] || CATEGORIES.MISC;
              return (
                <div 
                  key={m.name} 
                  onClick={() => onSelectMerchant && onSelectMerchant(m.name)}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate max-w-[200px] sm:max-w-[280px]">{m.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] border ${catMeta.badgeClass}`}>
                          {catMeta.name}
                        </span>
                        <span>• {m.count} txns</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-400">₹{m.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
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

function CategoryTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs">
        <p className="font-bold text-white mb-1" style={{ color: data.color }}>{data.name}</p>
        <p className="text-slate-300">Spent: <span className="font-bold text-white">₹{data.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></p>
        <p className="text-slate-400">{data.count} transactions</p>
      </div>
    );
  }
  return null;
}

function AccountTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-white">{data.name}</p>
        <p className="text-emerald-400">Income: ₹{data.income.toLocaleString('en-IN')}</p>
        <p className="text-rose-400">Spent: ₹{data.expense.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
}

function formatMonthLabel(ym) {
  if (!ym || ym === 'Unknown') return ym;
  const [y, m] = ym.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
