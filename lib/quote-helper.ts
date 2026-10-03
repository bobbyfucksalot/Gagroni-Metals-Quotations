import { Quote, LineItem } from '@/types';

function formatItemTitle(itemNames: string[]): string {
  if (itemNames.length === 1) {
    return `Quotation for ${itemNames[0]}`;
  }
  if (itemNames.length === 2) {
    return `Quotation for ${itemNames[0]} & ${itemNames[1]}`;
  }
  return `Quotation for ${itemNames[0]} (+${itemNames.length - 1} more items)`;
}

/**
 * Resolves the display title / machine description for a quotation.
 * If title is empty, or if title starts with "Quotation for ..." but the machine in that title
 * does not match any actual item in lineItems, it dynamically derives the title from the actual machine(s).
 */
export function resolveQuoteTitle(
  quote: Partial<Quote> | { title?: string; lineItems?: Array<Partial<LineItem>> }
): string {
  const lineItems = quote.lineItems || [];
  const validItems = lineItems.filter((i) => i && i.name && i.name.trim());
  const itemNames = validItems.map((i) => i.name!.trim());

  if (itemNames.length === 0) {
    return quote.title?.trim() || 'Commercial Quotation';
  }

  const currentTitle = (quote.title || '').trim();

  // If title is missing or generic placeholder
  if (!currentTitle || currentTitle === 'Fabrication & Structural Metal Works') {
    return formatItemTitle(itemNames);
  }

  // If title follows the auto-generated pattern "Quotation for ..."
  // Check if that machine is actually part of this quote's line items.
  if (currentTitle.toLowerCase().startsWith('quotation for ')) {
    const titleMachine = currentTitle.slice(14).trim().toLowerCase();
    const matchesAnyItem = itemNames.some((name) => {
      const n = name.toLowerCase();
      return n.includes(titleMachine) || titleMachine.includes(n);
    });

    if (!matchesAnyItem) {
      // It's a stale or mismatched product title! Return the actual machine name from line items
      return formatItemTitle(itemNames);
    }
  }

  return currentTitle;
}
