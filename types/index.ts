export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Paid' | 'Overdue';

export type QuoteTheme = 'tally' | 'executive' | 'classic' | 'modern' | 'procurement';

export interface StatusChangeEvent {
  status: QuoteStatus;
  timestamp: string;
  note?: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  hsnCode: string;
  qty: number;
  unit: string;
  mrp?: number;
  unitPrice: number; // Offer Price
  taxRate: number; // e.g. 18 for 18% GST
  discountPercent?: number;
  discountAmount?: number;
  total: number;
  imageUrl?: string;
}

export interface ExtraField {
  id: string;
  label: string;
  value: string;
}

export interface QuoteCorporateFields {
  rfqRef?: string;
  poNumber?: string;
  paymentTerms?: string;
  incoterms?: string;
  deliveryTime?: string;
  warranty?: string;
  deliveryNote?: string;
  supplierRef?: string;
  otherReferences?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  extraFields?: ExtraField[];
  customFields?: ExtraField[];
  [key: string]: any;
}

export interface QuoteMarketingPage {
  enabled: boolean;
  imageUrl?: string;
  title?: string;
  description?: string;
}

export interface QuoteDocumentModules {
  dualSignOff: boolean;
  amountInWords: boolean;
  hsnCodes: boolean;
  thumbnails: boolean;
  productPhotos?: boolean;
  signOff?: boolean;
  marketingPage?: boolean;
}

export interface QuoteTotals {
  subtotal: number;
  itemDiscountTotal: number;
  extraDiscountPercent: number;
  extraDiscountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  shipping: number;
  grandTotal: number;
  amountInWords: string;
}

export interface QuoteSignature {
  imageUrl?: string;
  signedAt?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  clientSignatureUrl?: string;
  clientSignedAt?: string;
  clientSignatoryName?: string;
}

export interface QuoteVersion {
  version: number;
  updatedAt: string;
  summary: string;
  totals: QuoteTotals;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  clientContactPerson?: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientGst?: string;
  clientState?: string;
  clientStateCode?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeGst?: string;
  consigneeState?: string;
  consigneeStateCode?: string;
  status: QuoteStatus;
  statusHistory: StatusChangeEvent[];
  issueDate: string;
  validUntil: string;
  currency: {
    base: string;
    export: string;
    rate: number;
  };
  taxMode: 'gst_intra' | 'gst_inter' | 'flat'; // intra=CGST+SGST, inter=IGST, flat=single tax
  lineItems: LineItem[];
  corporateFields: QuoteCorporateFields;
  documentModules: QuoteDocumentModules;
  notes: string;
  terms: string;
  totals: QuoteTotals;
  marketingPage?: QuoteMarketingPage;
  signature?: QuoteSignature;
  version: number;
  versionHistory?: QuoteVersion[];
  theme: QuoteTheme;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email?: string;
  phone: string;
  billingAddress: string;
  taxId: string; // GSTIN
  state?: string;
  stateCode?: string;
  category: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  mrp: number;
  offerPrice: number;
  defaultGstRate: number;
  unit: string;
  imageUrl?: string;
  stockQty?: number;
  hsnCode: string;
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  taxId: string; // GSTIN
  panNumber: string;
  cinNumber?: string;
  msmeNumber?: string;
  iecNumber?: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  stateCode?: string;
  pincode: string;
  logoUrl: string;
  signatureUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
  paymentQrUrl?: string;
  paymentModePreference?: 'both' | 'bank_only' | 'qr_only';
  defaultPaymentTerms: string;
  defaultNotes: string;
  defaultValidDays: number;
  defaultPdfTheme: QuoteTheme;
  currencySymbol: string;
}

export interface AuthSession {
  user: {
    email: string;
    name: string;
    role: string;
  };
}
