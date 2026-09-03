import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import MerchantAnalytics from './components/MerchantAnalytics';
import CashbackFees from './components/CashbackFees';
import CategoryDeepDive from './components/CategoryDeepDive';
import MonthlyComparison from './components/MonthlyComparison';
import TransactionsTable from './components/TransactionsTable';
import { fetchTransactions } from './services/supabase';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';


export default function App() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // App Navigation State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategoryId, setSelectedCategoryId] = useState('FOOD');
  const [selectedMerchant, setSelectedMerchant] = useState(null);


  // Date Filtering State
  const [datePreset, setDatePreset] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Initial Data Fetch
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions();
      setAllTransactions(data);
    } catch (err) {
      setError(err.message || 'Failed to load transaction data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Filter transactions based on date preset / custom date range
  const filteredTransactions = useMemo(() => {
    if (!allTransactions.length) return [];

    if (datePreset === 'ALL') {
      return allTransactions;
    }

    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (datePreset === 'THIS_MONTH') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      return allTransactions.filter(t => t.date >= startStr);
    }

    if (datePreset === 'LAST_MONTH') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      const startStr = `${year}-${month}-01`;
      const endStr = `${year}-${month}-31`;
      return allTransactions.filter(t => t.date >= startStr && t.date <= endStr);
    }

    if (datePreset === 'LAST_90') {
      const past90 = new Date();
      past90.setDate(past90.getDate() - 90);
      const startStr = past90.toISOString().slice(0, 10);
      return allTransactions.filter(t => t.date >= startStr);
    }

    if (datePreset === 'CUSTOM') {
      return allTransactions.filter(t => {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
        return true;
      });
    }

    return allTransactions;
  }, [allTransactions, datePreset, customStartDate, customEndDate]);

  // Jump to Category Deep-Dive tab from overview
  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    setActiveTab('category');
  };

  return (
    <div className="min-h-screen pb-16">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Loading Skeleton View */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel p-6 rounded-2xl h-32 skeleton-shimmer"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl h-80 skeleton-shimmer"></div>
              <div className="glass-panel p-6 rounded-2xl h-80 skeleton-shimmer"></div>
            </div>
          </div>
        ) : error ? (
          /* Error State View */
          <div className="glass-panel p-8 rounded-2xl border border-rose-500/30 text-center max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Failed to Load Dashboard Data</h3>
            <p className="text-xs text-slate-400 mb-6">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : (
          /* Tab Contents */
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                transactions={filteredTransactions}
                onSelectCategory={handleSelectCategory}
                onSelectMerchant={(m) => {
                  setSelectedMerchant(m);
                  setActiveTab('merchant');
                }}
              />
            )}

            {activeTab === 'merchant' && (
              <MerchantAnalytics
                transactions={filteredTransactions}
                initialMerchant={selectedMerchant}
              />
            )}

            {activeTab === 'cashback' && (
              <CashbackFees
                transactions={filteredTransactions}
              />
            )}

            {activeTab === 'category' && (
              <CategoryDeepDive
                transactions={filteredTransactions}
                initialCategoryId={selectedCategoryId}
              />
            )}



            {activeTab === 'monthly' && (
              <MonthlyComparison
                transactions={filteredTransactions}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTable
                transactions={filteredTransactions}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 mt-12 text-center text-xs text-slate-500 border-t border-white/5 pt-6">
        <p>FinancePulse Analytics • Powered by Supabase & React • {allTransactions.length} Transactions Analyzed</p>
      </footer>

    </div>
  );
}
