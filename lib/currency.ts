export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateAgainstINR: number; // How many units of target currency for 1 INR (e.g. USD is ~0.0116)
  inrPerUnit: number; // How many INR for 1 unit of target currency (e.g. 1 USD = ~86.50 INR)
}

export const SUPPORTED_CURRENCIES: { [key: string]: { name: string; symbol: string; defaultInrPerUnit: number } } = {
  INR: { name: 'Indian Rupee', symbol: '₹', defaultInrPerUnit: 1 },
  USD: { name: 'US Dollar', symbol: '$', defaultInrPerUnit: 86.50 },
  EUR: { name: 'Euro', symbol: '€', defaultInrPerUnit: 92.80 },
  GBP: { name: 'British Pound', symbol: '£', defaultInrPerUnit: 110.20 },
  AED: { name: 'UAE Dirham', symbol: 'AED ', defaultInrPerUnit: 23.55 },
  SAR: { name: 'Saudi Riyal', symbol: 'SAR ', defaultInrPerUnit: 23.05 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', defaultInrPerUnit: 64.80 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', defaultInrPerUnit: 56.40 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', defaultInrPerUnit: 62.10 },
  JPY: { name: 'Japanese Yen', symbol: '¥', defaultInrPerUnit: 0.58 },
};

interface CachedRates {
  timestamp: number;
  rates: { [key: string]: number }; // INR to Currency rate (e.g. USD: 0.01156)
}

let cachedRates: CachedRates | null = null;
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 hours

/**
 * Fetch live exchange rates from public API with caching & offline fallback
 */
export async function getLiveExchangeRates(): Promise<{ [key: string]: { rateAgainstINR: number; inrPerUnit: number } }> {
  const now = Date.now();
  if (cachedRates && now - cachedRates.timestamp < CACHE_DURATION) {
    const result: { [key: string]: { rateAgainstINR: number; inrPerUnit: number } } = {};
    for (const code of Object.keys(SUPPORTED_CURRENCIES)) {
      const rateAgainstINR = cachedRates.rates[code] || 1 / SUPPORTED_CURRENCIES[code].defaultInrPerUnit;
      result[code] = {
        rateAgainstINR,
        inrPerUnit: 1 / rateAgainstINR,
      };
    }
    return result;
  }

  try {
    // Free open exchange rate endpoint with strict 1.5s timeout to prevent page blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: controller.signal,
      next: { revalidate: 14400 },
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = {
          timestamp: now,
          rates: data.rates,
        };

        const result: { [key: string]: { rateAgainstINR: number; inrPerUnit: number } } = {};
        for (const code of Object.keys(SUPPORTED_CURRENCIES)) {
          const rateAgainstINR = data.rates[code] || 1 / SUPPORTED_CURRENCIES[code].defaultInrPerUnit;
          result[code] = {
            rateAgainstINR,
            inrPerUnit: 1 / rateAgainstINR,
          };
        }
        return result;
      }
    }
  } catch {
    // Fallback gracefully to default calibrated rates
  }

  // Fallback defaults
  const fallbackResult: { [key: string]: { rateAgainstINR: number; inrPerUnit: number } } = {};
  for (const code of Object.keys(SUPPORTED_CURRENCIES)) {
    const inrPerUnit = SUPPORTED_CURRENCIES[code].defaultInrPerUnit;
    fallbackResult[code] = {
      rateAgainstINR: 1 / inrPerUnit,
      inrPerUnit,
    };
  }
  return fallbackResult;
}

/**
 * Convert number to Western / International words (Dollars, Euros, Pounds, etc.)
 */
export function numberToInternationalWords(amount: number, currencyCode: string = 'USD'): string {
  if (isNaN(amount) || amount === 0) return `${currencyCode} Zero Only`;

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return singleDigits[n];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (remainder > 0) res += ' ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  const [wholeStr, centsStr] = amount.toFixed(2).split('.');
  let whole = parseInt(wholeStr, 10);
  const cents = parseInt(centsStr, 10);

  if (whole === 0 && cents === 0) return `${currencyCode} Zero Only`;

  const billion = Math.floor(whole / 1000000000);
  whole %= 1000000000;

  const million = Math.floor(whole / 1000000);
  whole %= 1000000;

  const thousand = Math.floor(whole / 1000);
  whole %= 1000;

  const hundredAndBelow = whole;

  let words = '';
  if (billion > 0) words += convertThreeDigits(billion) + ' Billion ';
  if (million > 0) words += convertThreeDigits(million) + ' Million ';
  if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
  if (hundredAndBelow > 0) words += convertThreeDigits(hundredAndBelow) + ' ';

  words = words.trim();

  const currencyNames: { [key: string]: { major: string; minor: string } } = {
    USD: { major: 'US Dollars', minor: 'Cents' },
    EUR: { major: 'Euros', minor: 'Cents' },
    GBP: { major: 'Pounds Sterling', minor: 'Pence' },
    AED: { major: 'UAE Dirhams', minor: 'Fils' },
    SAR: { major: 'Saudi Riyals', minor: 'Halalas' },
    SGD: { major: 'Singapore Dollars', minor: 'Cents' },
    AUD: { major: 'Australian Dollars', minor: 'Cents' },
    CAD: { major: 'Canadian Dollars', minor: 'Cents' },
    JPY: { major: 'Japanese Yen', minor: 'Sen' },
    INR: { major: 'Rupees', minor: 'Paise' },
  };

  const curr = currencyNames[currencyCode] || { major: currencyCode, minor: 'Cents' };
  let result = words ? `${curr.major} ${words}` : '';

  if (cents > 0) {
    const centsWords = convertTwoDigits(cents);
    if (result) {
      result += ` and ${centsWords} ${curr.minor}`;
    } else {
      result = `${centsWords} ${curr.minor}`;
    }
  }

  return (result + ' Only').replace(/\s+/g, ' ');
}

/**
 * Format any currency with appropriate locale and symbol
 */
export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  if (isNaN(amount)) return '0.00';

  const info = SUPPORTED_CURRENCIES[currencyCode] || { symbol: currencyCode + ' ', name: currencyCode };

  if (currencyCode === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return `${info.symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
