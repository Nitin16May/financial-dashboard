export const CATEGORIES = {
  INCOME: {
    id: 'INCOME',
    name: 'Income & Salary',
    color: '#10b981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: 'TrendingUp'
  },
  JEWELLERY: {
    id: 'JEWELLERY',
    name: 'Jewellery & Luxury',
    color: '#f59e0b', // Amber/Gold
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: 'Gem'
  },
  FOOD: {
    id: 'FOOD',
    name: 'Food & Dining',
    color: '#f97316', // Orange
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    icon: 'Utensils'
  },
  SHOPPING: {
    id: 'SHOPPING',
    name: 'Shopping & Retail',
    color: '#a855f7', // Purple
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: 'ShoppingBag'
  },
  TRAVEL: {
    id: 'TRAVEL',
    name: 'Travel & Transit',
    color: '#3b82f6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: 'TrainTrack'
  },
  TRANSFERS: {
    id: 'TRANSFERS',
    name: 'Transfers & Personal',
    color: '#06b6d4', // Cyan
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    icon: 'ArrowLeftRight'
  },
  BILLS: {
    id: 'BILLS',
    name: 'Bills & Credit Cards',
    color: '#ef4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    icon: 'CreditCard'
  },
  SUBSCRIPTIONS: {
    id: 'SUBSCRIPTIONS',
    name: 'Subscriptions & Entertainment',
    color: '#6366f1', // Indigo
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    icon: 'Tv'
  },
  HEALTH: {
    id: 'HEALTH',
    name: 'Health & Medical',
    color: '#14b8a6', // Teal
    bgColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    icon: 'HeartPulse'
  },
  SERVICES: {
    id: 'SERVICES',
    name: 'Services & Utilities',
    color: '#8b5cf6', // Violet
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    icon: 'Wrench'
  },
  MISC: {
    id: 'MISC',
    name: 'General & Misc',
    color: '#6b7280', // Gray
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.4)',
    badgeClass: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    icon: 'MoreHorizontal'
  }
};

/**
 * Intelligent Category Classification Rules
 */
export function categorizeTransaction(transaction) {
  const amount = floatVal(transaction.amount);
  const name = (transaction.name || '').toUpperCase();

  // If positive amount, default to Income unless explicit refund
  if (amount > 0) {
    if (name.includes('REFUND') || name.includes('CASHBACK') || name.includes('PAYTM TRA')) {
      return CATEGORIES.MISC.id;
    }
    return CATEGORIES.INCOME.id;
  }

  // Expenses Matching
  if (name.includes('TANISHQ') || name.includes('TITAN COMPANY') || name.includes('GOLD') || name.includes('JEWEL')) {
    return CATEGORIES.JEWELLERY.id;
  }

  if (
    name.includes('SWIGGY') ||
    name.includes('ZEPTO') ||
    name.includes('DOMINOS') ||
    name.includes('ZOMATO') ||
    name.includes('THEOBROMA') ||
    name.includes('VIJETHA') ||
    name.includes('FRUIT') ||
    name.includes('FOOD') ||
    name.includes('RESTAURANT') ||
    name.includes('BAKERY') ||
    name.includes('SUPER MARKET')
  ) {
    return CATEGORIES.FOOD.id;
  }

  if (
    name.includes('FLIPKART') ||
    name.includes('AMAZON') ||
    name.includes('VIJAY SALES') ||
    name.includes('CLOTH') ||
    name.includes('PURPLE FACE') ||
    name.includes('APPAREL')
  ) {
    return CATEGORIES.SHOPPING.id;
  }

  if (
    name.includes('IRCTC') ||
    name.includes('UBER') ||
    name.includes('OLA') ||
    name.includes('RAPIDO') ||
    name.includes('TICKET') ||
    name.includes('RAIL') ||
    name.includes('AIR') ||
    name.includes('FASTAG')
  ) {
    return CATEGORIES.TRAVEL.id;
  }

  if (
    name.includes('NETFLIX') ||
    name.includes('SPOTIFY') ||
    name.includes('PRIME') ||
    name.includes('JIO') ||
    name.includes('RELIANCE JIO') ||
    name.includes('BIGTREE') ||
    name.includes('BOOKMYSHOW') ||
    name.includes('HOTSTAR')
  ) {
    return CATEGORIES.SUBSCRIPTIONS.id;
  }

  if (
    name.includes('SBI CARDS') ||
    name.includes('HDFC CARD') ||
    name.includes('CREDIT CARD') ||
    name.includes('JOINING FEE') ||
    name.includes('BILL') ||
    name.includes('ELECTRICITY') ||
    name.includes('PAYMENT #')
  ) {
    return CATEGORIES.BILLS.id;
  }

  if (
    name.includes('MEDICAL') ||
    name.includes('PHARMACY') ||
    name.includes('HOSPITAL') ||
    name.includes('HEALTH') ||
    name.includes('CLINIC') ||
    name.includes('DOCTOR')
  ) {
    return CATEGORIES.HEALTH.id;
  }

  if (
    name.includes('SELF TRANSFER') ||
    name.includes('P2A/') ||
    name.includes('TRANSFER') ||
    name.includes('ROHIT') ||
    name.includes('DOMMETI') ||
    name.includes('GUBBALA') ||
    name.includes('SRINIVAS') ||
    name.includes('PITHANI')
  ) {
    return CATEGORIES.TRANSFERS.id;
  }

  if (
    name.includes('LAUNDRY') ||
    name.includes('FABRIC FRESH') ||
    name.includes('CLEAN') ||
    name.includes('SERVICE')
  ) {
    return CATEGORIES.SERVICES.id;
  }

  return CATEGORIES.MISC.id;
}

/**
 * Clean merchant display name from raw UPI / NEFT bank strings
 */
export function cleanMerchantName(rawName) {
  if (!rawName) return 'Unknown Merchant';
  let clean = rawName;

  // Extract merchant name from UPI patterns e.g., UPI/P2M/12345/Merchant Name/UPI/BANK
  if (clean.includes('UPI/P2M/') || clean.includes('UPI/P2A/')) {
    const parts = clean.split('/');
    if (parts.length >= 4 && parts[3].trim()) {
      clean = parts[3].trim();
    }
  }

  // Remove common banking suffixes
  clean = clean
    .replace(/\/UPI\/.*$/, '')
    .replace(/\/Sent u\/.*$/, '')
    .replace(/\/YES BANK.*$/, '')
    .replace(/\/AXIS BANK.*$/, '')
    .replace(/\/HDFC BANK.*$/, '')
    .replace(/\/ICICI Bank.*$/, '')
    .replace(/,HYDERABAD/gi, '')
    .replace(/,BENGALURU/gi, '')
    .trim();

  return clean || rawName;
}

function floatVal(val) {
  return parseFloat(val || 0);
}
