import { categorizeTransaction, CATEGORIES, cleanMerchantName } from '../utils/categorizer';

const SUPABASE_URL = 'https://bprkehilaayfrhcxyrtc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8_tyzFQcB5j1FChrcSmRLg_CWPw8TwF';

const LOCAL_STORAGE_KEY = 'fin_dashboard_transactions_cache_v1';

export async function fetchTransactions() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?select=*&order=date.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: '0-1500'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(enrichedData));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    return enrichedData;
  } catch (error) {
    console.error('Failed to fetch live transactions from Supabase:', error);
    
    // Fallback to local cache if offline or error
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      console.info('Serving transactions from local cache');
      return JSON.parse(cached);
    }
    
    throw error;
  }
}
