import { LineItem, QuoteTotals } from '@/types';

/**
 * Convert number to words in Indian numbering system (Lakh, Crore, Thousand, Hundred)
 */
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'FifFifteen'.replace('FifFifteen', 'Fifteen'),
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
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

  const [rupeesStr, paiseStr] = amount.toFixed(2).split('.');
  let rupees = parseInt(rupeesStr, 10);
  const paise = parseInt(paiseStr, 10);

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  let words = '';

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;

  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;

  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;

  const hundredAndBelow = rupees;

  if (crore > 0) {
    words += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertThreeDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertThreeDigits(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    words += convertThreeDigits(hundredAndBelow) + ' ';
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : '';

  if (paise > 0) {
    const paiseWords = convertTwoDigits(paise);
    if (result) {
      result += ` and ${paiseWords} Paise`;
    } else {
      result = `${paiseWords} Paise`;
    }
  }

  return (result + ' Only').replace(/\s+/g, ' ');
}

/**
 * Format currency in Indian Rupees notation (e.g. ₹ 4,82,500.00 or ₹ 4,82,500)
 */
export function formatINR(amount: number, decimals: boolean = false): string {
  if (isNaN(amount)) return '₹ 0';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return formatter.format(amount);
}

/**
 * Compute line items total and aggregate quote financial figures
 */
export function calculateQuoteTotals(
  items: LineItem[],
  taxMode: 'gst_intra' | 'gst_inter' | 'flat' = 'gst_intra',
  extraDiscountPercent: number = 0,
  shipping: number = 0
): QuoteTotals {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let totalTax = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  // Compute individual line totals
  items.forEach((item) => {
    const hasMrpDiscount = typeof item.mrp === 'number' && item.mrp > item.unitPrice;
    const effectiveRate = hasMrpDiscount ? item.mrp! : item.unitPrice;
    const rawTotal = item.qty * effectiveRate;
    
    let discountAmount = 0;
    if (hasMrpDiscount) {
      discountAmount = (item.mrp! - item.unitPrice) * item.qty;
    } else if (item.discountPercent) {
      discountAmount = (rawTotal * item.discountPercent) / 100;
    }

    const itemTaxable = Math.max(0, rawTotal - discountAmount);
    const itemTax = (itemTaxable * (item.taxRate || 0)) / 100;

    subtotal += rawTotal;
    itemDiscountTotal += discountAmount;
    totalTax += itemTax;
  });

  const baseTaxable = subtotal - itemDiscountTotal;
  const extraDiscountAmount = extraDiscountPercent > 0 ? (baseTaxable * extraDiscountPercent) / 100 : 0;
  const taxableAmount = Math.max(0, baseTaxable - extraDiscountAmount);

  // If extra discount was applied, scale the total tax proportionally
  const effectiveTax = baseTaxable > 0 ? (taxableAmount / baseTaxable) * totalTax : 0;

  if (taxMode === 'gst_intra') {
    cgst = effectiveTax / 2;
    sgst = effectiveTax / 2;
    igst = 0;
  } else if (taxMode === 'gst_inter') {
    cgst = 0;
    sgst = 0;
    igst = effectiveTax;
  } else {
    // flat
    cgst = 0;
    sgst = 0;
    igst = effectiveTax;
  }

  const grandTotal = Math.round(taxableAmount + effectiveTax + (shipping || 0));
  const amountInWords = numberToIndianWords(grandTotal);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemDiscountTotal: Math.round(itemDiscountTotal * 100) / 100,
    extraDiscountPercent,
    extraDiscountAmount: Math.round(extraDiscountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(effectiveTax * 100) / 100,
    shipping: shipping || 0,
    grandTotal,
    amountInWords,
  };
}

export interface IndianState {
  name: string;
  code: string;
}

export const INDIAN_STATES: IndianState[] = [
  { name: 'Rajasthan', code: '08' },
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' },
  { name: 'Bihar', code: '10' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' },
  { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' },
  { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Odisha', code: '21' },
  { name: 'Puducherry', code: '34' },
  { name: 'Punjab', code: '03' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' },
  { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
];

export function getGstStateCode(stateName: string): string {
  if (!stateName) return '08';
  const clean = stateName.trim().toLowerCase();
  const found = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === clean || s.code === clean
  );
  return found ? found.code : '08';
}

export function determineTaxMode(clientState: string, companyState: string = 'Rajasthan'): 'gst_intra' | 'gst_inter' {
  const cState = (clientState || '').trim().toLowerCase();
  const sellerState = (companyState || 'Rajasthan').trim().toLowerCase();

  // If state matches seller state or both are Rajasthan, apply Intra-state (CGST + SGST)
  if (
    cState === sellerState ||
    (cState.includes('rajasthan') && sellerState.includes('rajasthan')) ||
    cState === '08'
  ) {
    return 'gst_intra';
  }
  return 'gst_inter';
}
