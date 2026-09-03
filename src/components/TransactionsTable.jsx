import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  Filter, 
  CreditCard, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';
import { CATEGORIES } from '../utils/categorizer';

export default function TransactionsTable({ transactions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [txnType, setTxnType] = useState('ALL'); // ALL | INCOME | EXPENSE
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Accounts list for dropdown
  const accountsList = useMemo(() => {
    const set = new Set();
    transactions.forEach(t => {
      if (t.account) set.add(t.account);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filter & sort
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (txnType === 'INCOME' && t.amount <= 0) return false;
      if (txnType === 'EXPENSE' && t.amount >= 0) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && t.categoryId !== selectedCategory) return false;

      // Account filter
      if (selectedAccount !== 'ALL' && t.account !== selectedAccount) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchClean = t.cleanName.toLowerCase().includes(q);
        const matchAcc = t.account && t.account.toLowerCase().includes(q);
        const matchDate = t.date && t.date.includes(q);
        if (!matchName && !matchClean && !matchAcc && !matchDate) return false;
      }

      return true;
    }).sort((a, b) => {
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
  }, [transactions, searchTerm, selectedCategory, selectedAccount, txnType, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // CSV Export handler
  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Clean Merchant Name', 'Raw Name', 'Amount (INR)', 'Account', 'Category'];
    const rows = filtered.map(t => [
      t.id,
      t.date,
      `"${t.cleanName.replace(/"/g, '""')}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.account || ''}"`,
      `"${t.categoryMeta?.name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Controls Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">All Transactions Explorer</h2>
            <p className="text-xs text-slate-400">Showing {filtered.length} of {transactions.length} total entries</p>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV ({filtered.length})</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchant, bank string, date..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
              {Object.values(CATEGORIES).map(cat => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs appearance-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Accounts</option>
              {accountsList.map(acc => (
                <option key={acc} value={acc} className="bg-slate-900 text-white">
                  {acc}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10">
            {['ALL', 'INCOME', 'EXPENSE'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setTxnType(type);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  txnType === type
                    ? type === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : type === 'EXPENSE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Main Transactions Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-3.5 cursor-pointer hover:text-white" onClick={() => toggleSort('cleanName')}>
                  <div className="flex items-center space-x-1">
                    <span>Merchant / Description</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Account</th>
                <th className="p-3.5 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Amount (₹)</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.length > 0 ? (
                paginated.map((t) => {
                  const isIncome = t.amount > 0;
                  const catMeta = t.categoryMeta || CATEGORIES.MISC;

                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-3.5 text-slate-300 font-mono whitespace-nowrap">{t.date}</td>
                      
                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                          {t.cleanName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-md mt-0.5">
                          {t.name}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catMeta.badgeClass}`}>
                          <span>{catMeta.name}</span>
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-[11px]">
                          {t.account}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-extrabold whitespace-nowrap">
                        <span className={isIncome ? 'text-emerald-400 text-sm' : 'text-slate-200 text-sm'}>
                          {isIncome ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No transactions found matching the applied filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filtered.length} items)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="glass-input px-2 py-1.5 rounded-lg text-xs"
            >
              <option value={25} className="bg-slate-900 text-white">25 / page</option>
              <option value={50} className="bg-slate-900 text-white">50 / page</option>
              <option value={100} className="bg-slate-900 text-white">100 / page</option>
            </select>
          </div>
        </div>

      </div>

    </div>
  );
}
