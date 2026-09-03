import React, { useMemo } from 'react';
import { 
  CalendarRange, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
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
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts';

export default function MonthlyComparison({ transactions }) {
  // Aggregate data by month & date
  const monthlyStats = useMemo(() => {
    const monthsMap = {};
    const daysMap = {};

    transactions.forEach(t => {
      const month = t.date ? t.date.slice(0, 7) : 'Unknown';
      const day = t.date || 'Unknown';
      const amt = t.amount;

      // Monthly aggregation
      if (!monthsMap[month]) {
        monthsMap[month] = {
          month,
          income: 0,
          expense: 0,
          count: 0,
          datesSet: new Set()
        };
      }
      monthsMap[month].count += 1;
      monthsMap[month].datesSet.add(day);

      // Daily aggregation
      if (!daysMap[day]) {
        daysMap[day] = { date: day, income: 0, expense: 0, net: 0 };
      }

      if (amt > 0) {
        monthsMap[month].income += amt;
        daysMap[day].income += amt;
      } else {
        const absAmt = Math.abs(amt);
        monthsMap[month].expense += absAmt;
        daysMap[day].expense += absAmt;
      }
      daysMap[day].net += amt;
    });

    const monthlyList = Object.values(monthsMap)
      .sort((a, b) => b.month.localeCompare(a.month)) // Descending for table
      .map(m => {
        const net = m.income - m.expense;
        const savingsRate = m.income > 0 ? ((net / m.income) * 100).toFixed(1) : 0;
        const activeDays = m.datesSet.size || 1;
        const dailyAvg = m.expense / activeDays;
        return {
          ...m,
          net,
          savingsRate,
          activeDays,
          dailyAvg,
          label: formatMonthLabel(m.month)
        };
      });

    // Chronological list for charts
    const monthlyChartData = [...monthlyList].reverse();

    // Daily spending timeline (last 60 active days)
    const dailyChartData = Object.values(daysMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60)
      .map(d => ({
        ...d,
        label: d.date.slice(5) // MM-DD format
      }));

    return {
      monthlyList,
      monthlyChartData,
      dailyChartData
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-indigo-400" />
            <span>Date-to-Date & Monthly Financial Stats</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Month-over-month income, expense, and daily spending velocity</p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/10 text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>{monthlyStats.monthlyList.length} Months Tracked</span>
        </div>
      </div>

      {/* Monthly Bar Chart Comparison */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Monthly Cash Flow Comparison</h3>
            <p className="text-xs text-slate-400">Comparing total income vs expenses per month</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats.monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
              <Tooltip content={<MonthlyBarTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Bar dataKey="income" name="Income (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Spending Velocity Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Daily Spending Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">Daily outflow spikes & peak spending days</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyStats.dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
              <Tooltip content={<DailyLineTooltip />} />
              <Line type="monotone" dataKey="expense" name="Daily Outflow" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Monthly Breakdown Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Monthly Financial Table</h3>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3">Txns</th>
                <th className="p-3 text-right">Income (₹)</th>
                <th className="p-3 text-right">Expenses (₹)</th>
                <th className="p-3 text-right">Net Flow (₹)</th>
                <th className="p-3 text-right">Savings Rate</th>
                <th className="p-3 text-right">Avg Daily Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {monthlyStats.monthlyList.map((m) => (
                <tr key={m.month} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-white font-sans">{m.label}</td>
                  <td className="p-3 text-slate-400">{m.count}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">
                    ₹{m.income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-rose-400 font-bold">
                    ₹{m.expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`p-3 text-right font-extrabold ${m.net >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                    {m.net >= 0 ? '+' : ''}₹{m.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-sans">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      m.savingsRate > 20
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : m.savingsRate >= 0
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {m.savingsRate}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    ₹{Math.round(m.dailyAvg).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function MonthlyBarTooltip({ active, payload, label }) {
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

function DailyLineTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-slate-200">{data.date}</p>
        <p className="font-extrabold text-rose-400">
          Daily Outflow: ₹{data.expense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </p>
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
