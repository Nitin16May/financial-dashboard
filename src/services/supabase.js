import { categorizeTransaction, CATEGORIES, cleanMerchantName } from '../utils/categorizer';

const DEFAULT_SUPABASE_URL = 'https://bprkehilaayfrhcxyrtc.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_8_tyzFQcB5j1FChrcSmRLg_CWPw8TwF';

const CONFIG_STORAGE_KEY = 'fin_dashboard_supabase_config_v1';
const CACHE_STORAGE_KEY = 'fin_dashboard_transactions_cache_v1';

export function getStoredCredentials() {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        url: parsed.url || DEFAULT_SUPABASE_URL,
        key: parsed.key || DEFAULT_SUPABASE_KEY,
        userId: parsed.userId || 'nitin'
      };
    }
  } catch (e) {
    console.warn('Failed to parse stored credentials', e);
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_KEY,
    userId: 'nitin'
  };
}

export function saveCredentials(config) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save credentials', e);
  }
}

export function resetCredentials() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export async function fetchTransactions() {
  const creds = getStoredCredentials();
  const cleanUrl = creds.url.replace(/\/+$/, '');

  try {
    const response = await fetch(
      `${cleanUrl}/rest/v1/transactions?select=*&order=date.desc`,
      {
        headers: {
          apikey: creds.key,
          Authorization: `Bearer ${creds.key}`,
          Range: '0-1500'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch transactions`);
    }

    const rawData = await response.json();
    
    // Enrich transactions
    const enrichedData = rawData.map(t => {
      const categoryId = categorizeTransaction(t);
      return {
        ...t,
        amount: parseFloat(t.amount || 0),
        categoryId,
        categoryMeta: CATEGORIES[categoryId] || CATEGORIES.MISC,
        cleanName: cleanMerchantName(t.name)
      };
    });

    // Cache locally
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(enrichedData));
    } catch (e) {
      console.warn('LocalStorage cache failed', e);
    }

    return enrichedData;
  } catch (error) {
    console.error('Failed to fetch live transactions from Supabase:', error);
    
    // Fallback to local cache if offline or error
    const cached = localStorage.getItem(CACHE_STORAGE_KEY);
    if (cached) {
      console.info('Serving transactions from local cache');
      return JSON.parse(cached);
    }
    
    throw error;
  }
}
