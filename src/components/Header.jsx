import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Store,
  PieChart, 
  Gift,
  CalendarRange, 
  ReceiptText, 
  Calendar, 
  Zap, 
  RefreshCw,
  Key,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { getStoredCredentials, saveCredentials, resetCredentials } from '../services/supabase';

export default function Header({
  activeTab,
  setActiveTab,
  datePreset,
  setDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  onRefresh,
  isRefreshing
}) {
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsForm, setCredsForm] = useState(() => getStoredCredentials());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'merchant', label: 'Sources & Merchants', icon: Store },
    { id: 'cashback', label: 'Cashback & Fees', icon: Gift },

    { id: 'category', label: 'Category Deep-Dive', icon: PieChart },
    { id: 'monthly', label: 'Date-to-Date Stats', icon: CalendarRange },
    { id: 'transactions', label: 'All Transactions', icon: ReceiptText }
  ];

  const presets = [
    { id: 'ALL', label: 'All Time' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'LAST_MONTH', label: 'Last Month' },
    { id: 'LAST_90', label: 'Last 90 Days' },
    { id: 'CUSTOM', label: 'Custom Range' }
  ];

  const handleSaveCreds = (e) => {
    e.preventDefault();
    saveCredentials(credsForm);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowCredsModal(false);
      onRefresh();
    }, 800);
  };

  const handleResetCreds = () => {
    resetCredentials();
    const defaultCreds = getStoredCredentials();
    setCredsForm(defaultCreds);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowCredsModal(false);
      onRefresh();
    }, 800);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinancePulse
              </h1>
              <div className="flex items-center space-x-2 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                
                {/* Clickable Credentials Badge */}
                <button
                  onClick={() => setShowCredsModal(true)}
                  className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  title="Configure Supabase Connection Credentials"
                >
                  <span>Supabase Live</span>
                  <Key className="w-3 h-3 ml-0.5 opacity-80" />
                </button>

                <span className="text-slate-500">• {credsForm.userId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setShowCredsModal(true)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
              title="Credentials Settings"
            >
              <Key className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1.5 rounded-xl border border-white/10 w-full lg:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter Controls & Credentials Button */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center bg-slate-900/60 p-1 rounded-lg border border-white/10">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  datePreset === p.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-lg border border-white/10 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Credentials Settings Button */}
          <button
            onClick={() => setShowCredsModal(true)}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium transition-colors"
            title="Manage API Credentials"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Credentials</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-medium transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

      </div>

      {/* Supabase Connection Credentials Modal */}
      {showCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/15 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Supabase Credentials & API</h3>
                  <p className="text-xs text-slate-400">Manage live database connection settings</p>
                </div>
              </div>

              <button
                onClick={() => setShowCredsModal(false)}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCreds} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  required
                  value={credsForm.url}
                  onChange={(e) => setCredsForm({ ...credsForm, url: e.target.value })}
                  placeholder="https://your-project.supabase.co"
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Publishable / Anon API Key
                </label>
                <textarea
                  rows={3}
                  required
                  value={credsForm.key}
                  onChange={(e) => setCredsForm({ ...credsForm, key: e.target.value })}
                  placeholder="sb_publishable_..."
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  User ID / Profile Name
                </label>
                <input
                  type="text"
                  value={credsForm.userId}
                  onChange={(e) => setCredsForm({ ...credsForm, userId: e.target.value })}
                  placeholder="nitin"
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>

              {saveSuccess && (
                <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>Credentials updated successfully! Reconnecting...</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleResetCreds}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCredsModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    Save & Reconnect
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </header>
  );
}
