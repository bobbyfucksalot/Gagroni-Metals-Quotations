import { Quote, Client, Product, CompanySettings } from '@/types';
import { calculateQuoteTotals } from './tax-engine';
import { connectDB } from './db';
import { QuoteModel, ClientModel, ProductModel, SettingModel } from './models';

export const initialCompanySettings: CompanySettings = {
  companyName: 'GAGRONI METALS PRIVATE LIMITED',
  tagline: 'Precision Engineered Metal & Stainless Steel Solutions',
  taxId: '27AAACG9823M1Z8', // Maharashtra GSTIN format
  panNumber: 'AAACG9823M',
  cinNumber: 'U27200MH2016PTC281902',
  msmeNumber: '',
  iecNumber: '',
  email: 'sales@gagronimetals.com',
  phone: '+91 98200 45890',
  website: 'www.gagronimetals.com',
  address: 'Brindawan, Kota - Jhalawar Highway, NH-12',
  city: 'Jhalawar',
  state: 'Rajasthan',
  stateCode: '08',
  pincode: '326001',
  logoUrl: '/gagroni-metals-logo.png',
  signatureUrl: '',
  signatoryName: 'Faizan Uddin',
  signatoryTitle: 'Managing Director & Authorized Signatory',
  bankName: 'HDFC Bank Ltd.',
  bankAccountNo: '50200049281729',
  bankIfsc: 'HDFC0001289',
  bankBranch: 'Taloja Industrial Branch, Navi Mumbai',
  upiId: 'gagronimetals@hdfcbank',
  paymentQrUrl: '',
  paymentModePreference: 'both',
  defaultPaymentTerms: '50% Advance with Purchase Order, 50% against delivery / dispatch inspection.',
  defaultNotes: '1. Prices are valid for 15 days from quotation date due to metal market price fluctuations.\n2. Standard tolerance on dimensions ±0.5mm.\n3. Goods once sold will not be taken back unless manufacturing defect reported within 7 days.',
  defaultValidDays: 15,
  defaultPdfTheme: 'tally',
  currencySymbol: '₹',
};

export const initialClients: Client[] = [
  {
    id: 'cli-001',
    name: 'APEX INDUSTRIES LTD.',
    contactPerson: 'Rajesh Sharma',
    email: 'procurement@apexind.com',
    phone: '+91 98210 11223',
    billingAddress: '401-404, Solitaire Corporate Park, Andheri East, Mumbai 400093',
    taxId: '27AABCA1234A1Z1',
    state: 'Maharashtra',
    stateCode: '27',
    category: 'Enterprise',
    notes: 'Key client for heavy-duty industrial shelving, heavy structural beams, and cleanroom SS fixtures.',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'cli-002',
    name: 'NORTHSTAR RETAIL OUTFITS',
    contactPerson: 'Pooja Varma',
    email: 'pooja.v@northstarretail.in',
    phone: '+91 97654 33210',
    billingAddress: 'Tower 2, Phoenix Marketcity Commercial complex, Kurla, Mumbai 400070',
    taxId: '27BBCDE5678B2Z2',
    state: 'Maharashtra',
    stateCode: '27',
    category: 'Commercial',
    notes: 'High-end retail shop fit-out, decorative brass & mirror-finish gold PVD coated SS partitions.',
    createdAt: '2026-01-20T14:30:00Z',
  },
  {
    id: 'cli-003',
    name: 'MEHTA & SONS ARCHITECTURAL',
    contactPerson: 'Karan Mehta',
    email: 'karan@mehtasons.co.in',
    phone: '+91 98989 77665',
    billingAddress: '12, Loha Bhavan, Carnac Bunder, P. D’Mello Road, Mumbai 400009',
    taxId: '27CCDEF9012C3Z3',
    state: 'Maharashtra',
    stateCode: '27',
    category: 'Fabricator',
    notes: 'Frequent buyer of custom brass display units and precision laser-cut screens.',
    createdAt: '2026-02-01T09:15:00Z',
  },
  {
    id: 'cli-004',
    name: 'STUDIO FORM DESIGN STUDIO',
    contactPerson: 'Ananya Deshmukh',
    email: 'projects@studioform.in',
    phone: '+91 98190 44556',
    billingAddress: 'Unit 5, Mathuradas Mills Compound, Lower Parel, Mumbai 400013',
    taxId: '27DDGHJ3456D4Z4',
    state: 'Maharashtra',
    stateCode: '27',
    category: 'Commercial',
    notes: 'Interior design studio focusing on bespoke commercial counters and acoustic metal baffles.',
    createdAt: '2026-02-10T11:45:00Z',
  },
  {
    id: 'cli-005',
    name: 'KRAFT HOUSE WORKSTATIONS',
    contactPerson: 'Vikram Singhania',
    email: 'v.singhania@krafthouse.com',
    phone: '+91 99200 88990',
    billingAddress: 'B-18, Wagle Industrial Estate, Thane West 400604',
    taxId: '27EEFGH7890E5Z5',
    state: 'Maharashtra',
    stateCode: '27',
    category: 'Enterprise',
    notes: 'Bulk purchaser of powder-coated steel desk frames and perforated cable management trays.',
    createdAt: '2026-02-14T16:20:00Z',
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'SS 304 Grade Heavy Shelving Unit (4-Tier)',
    sku: 'GM-SS-304-SH4',
    category: 'Stainless Steel',
    description: 'Heavy duty SS 304 grade 4-tier storage rack. Gauge 16, laser-cut slotted uprights with anti-corrosion mirror buffed finish.',
    mrp: 32000,
    offerPrice: 28500,
    defaultGstRate: 18,
    unit: 'pcs',
    stockQty: 45,
    hsnCode: '730890',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'prod-002',
    name: 'SS 316L Pharmaceutical Cleanroom Workstation',
    sku: 'GM-SS-316-CRM',
    category: 'Stainless Steel',
    description: 'Pharma-grade SS 316L table with curved coved corners, electropolished surface, vibration-free reinforced base.',
    mrp: 58000,
    offerPrice: 52000,
    defaultGstRate: 18,
    unit: 'pcs',
    stockQty: 18,
    hsnCode: '940320',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-06T00:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'Architectural Brass Display Frame (Brushed Gold PVD)',
    sku: 'GM-BR-PVD-80',
    category: 'Brass & Copper',
    description: 'Solid brass hollow profile framing with brushed gold PVD finish. Resistant to tarnishing and UV discoloration.',
    mrp: 14500,
    offerPrice: 12800,
    defaultGstRate: 18,
    unit: 'meter',
    stockQty: 120,
    hsnCode: '740710',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-08T00:00:00Z',
  },
  {
    id: 'prod-004',
    name: 'MS Powder-Coated Modular Workstation Frame',
    sku: 'GM-MS-PC-MOD',
    category: 'Mild Steel',
    description: '50x50mm ERW steel tube framework with 80-micron epoxy polyester powder coating in Jet Black (RAL 9005).',
    mrp: 16800,
    offerPrice: 14200,
    defaultGstRate: 18,
    unit: 'pcs',
    stockQty: 60,
    hsnCode: '730890',
    imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'prod-005',
    name: 'Perforated Aluminum Ceiling Baffle Acoustic System',
    sku: 'GM-AL-BAF-150',
    category: 'Aluminum',
    description: 'Alloy 3003-H14 perforated sound-absorbing aluminum baffle panel, 150mm height, anodized champagne finish.',
    mrp: 950,
    offerPrice: 820,
    defaultGstRate: 18,
    unit: 'sqft',
    stockQty: 450,
    hsnCode: '761090',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'prod-006',
    name: 'Laser-Cut CNC Decorative MS Screen (Jali Partition)',
    sku: 'GM-CNC-MS-25',
    category: 'Custom Fabrication',
    description: '2.5mm thick MS sheet with intricate geometric CNC laser cut pattern, primer coated ready for PU paint.',
    mrp: 380,
    offerPrice: 320,
    defaultGstRate: 18,
    unit: 'sqft',
    stockQty: 800,
    hsnCode: '732690',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'prod-007',
    name: 'Industrial SS 304 Anchor Fastener Bolt Set (M12x100)',
    sku: 'GM-FAST-M12',
    category: 'Fasteners & Hardware',
    description: 'High tensile 304 grade stainless steel wedge anchor bolts with matching washers and nylon lock nuts.',
    mrp: 120,
    offerPrice: 95,
    defaultGstRate: 18,
    unit: 'pcs',
    stockQty: 2500,
    hsnCode: '731815',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-01-18T00:00:00Z',
  },
];

export const initialQuotes: Quote[] = [
  {
    id: 'quote-001',
    quoteNumber: 'GM-2026-0046',
    title: 'Industrial Heavy Duty Shelving & Fit-out',
    clientId: 'cli-001',
    clientName: 'APEX INNOVATIONS & INDUSTRIES LTD',
    clientContactPerson: 'Rajesh Sharma',
    clientEmail: 'procurement@apexind.com',
    clientPhone: '+91 98210 11223',
    clientAddress: '450 Innovation Parkway, Suite 800, Andheri East, Mumbai 400093',
    clientGst: '27AABCA1234A1Z1',
    clientState: 'Maharashtra',
    clientStateCode: '27',
    consigneeName: 'NEXUS GLOBAL LOGISTICS & FITOUTS',
    consigneeAddress: 'Warehouse Block 12, Taloja Logistics Park, Navi Mumbai 410208',
    consigneeGst: '27AABCA1234A1Z1',
    consigneeState: 'Maharashtra',
    consigneeStateCode: '27',
    status: 'Draft',
    statusHistory: [
      { status: 'Draft', timestamp: '2026-09-12T09:00:00Z', note: 'Created commercial estimate and Tally ERP confirmation' },
    ],
    issueDate: '2026-09-12',
    validUntil: '2026-09-27',
    currency: { base: 'INR', export: 'USD', rate: 0.012 },
    taxMode: 'gst_intra',
    lineItems: [
      {
        id: 'li-101',
        productId: 'prod-001',
        name: 'PROERGO EXECUTIVE SS SHELVING RACK (4-TIER)',
        description: 'High-precision SS 304 laser cut uprights with heavy-gauge ribbed decks and anti-vibration footings.',
        hsnCode: '9403.10',
        qty: 12,
        unit: 'units',
        unitPrice: 28500,
        taxRate: 18,
        discountPercent: 0,
        total: 342000,
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'li-102',
        productId: 'prod-002',
        name: 'SS 316L PHARMACEUTICAL CLEANROOM WORKBENCH',
        description: 'Pharma-grade SS 316L table with curved coved corners, electropolished surface.',
        hsnCode: '9403.20',
        qty: 2,
        unit: 'units',
        unitPrice: 52000,
        taxRate: 18,
        discountPercent: 0,
        total: 104000,
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'li-103',
        productId: 'prod-007',
        name: 'INDUSTRIAL ANCHOR BOLT & STRUCTURAL FASTENER SET',
        description: 'Grade 304 stainless steel wedge anchor bolts (M12x100mm) with nylon lock nuts.',
        hsnCode: '7318.15',
        qty: 150,
        unit: 'pcs',
        unitPrice: 100,
        taxRate: 18,
        discountPercent: 0,
        total: 15000,
        imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600&auto=format&fit=crop&q=80',
      },
    ],
    corporateFields: {
      deliveryNote: 'DN-GM-2026-890',
      supplierRef: 'SUP-0046',
      otherReferences: 'RFQ-2026-CORP',
      buyerOrderNo: 'PO-PENDING',
      buyerOrderDate: '2026-09-12',
      dispatchDocNo: 'LR-TRUCK-8890',
      dispatchedThrough: 'Cargo / Direct Road Transport',
      destination: 'Mumbai / Taloja Site',
      termsOfDelivery: 'FOB Destination / Fully Insured Transit',
      paymentTerms: 'Net 30 Days from Dispatch Inspection',
    },
    documentModules: {
      dualSignOff: true,
      amountInWords: true,
      hsnCodes: true,
      thumbnails: true,
    },
    notes: 'Subject to Navi Mumbai jurisdiction. Goods once sold will not be taken back.',
    terms: '1. 50% Advance with PO, 50% against Delivery.\n2. Warranty: 24 Months on structural welds.\n3. Taxes: GST extra as statutory breakdown.',
    totals: calculateQuoteTotals([
      { id: 'li-101', name: 'PROERGO EXECUTIVE SS SHELVING RACK (4-TIER)', description: '', hsnCode: '9403.10', qty: 12, unit: 'units', unitPrice: 28500, taxRate: 18, total: 342000 },
      { id: 'li-102', name: 'SS 316L CLEANROOM WORKBENCH', description: '', hsnCode: '9403.20', qty: 2, unit: 'units', unitPrice: 52000, taxRate: 18, total: 104000 },
      { id: 'li-103', name: 'FASTENER SET', description: '', hsnCode: '7318.15', qty: 150, unit: 'pcs', unitPrice: 100, taxRate: 18, total: 15000 },
    ], 'gst_intra', 0, 0),
    signature: {
      signatoryName: 'Faizan Uddin',
      signatoryTitle: 'Managing Director',
      signedAt: '2026-09-12T09:00:00Z',
    },
    version: 1,
    theme: 'tally',
    createdAt: '2026-09-12T09:00:00Z',
    updatedAt: '2026-09-12T09:00:00Z',
  },
  {
    id: 'quote-002',
    quoteNumber: 'GM-2026-0047',
    title: 'Storefront Fixtures & Gold PVD Brass Frame Partitions',
    clientId: 'cli-002',
    clientName: 'NORTHSTAR RETAIL OUTFITS',
    clientContactPerson: 'Pooja Varma',
    clientEmail: 'pooja.v@northstarretail.in',
    clientPhone: '+91 97654 33210',
    clientAddress: 'Tower 2, Phoenix Marketcity Commercial complex, Kurla, Mumbai 400070',
    clientGst: '27BBCDE5678B2Z2',
    clientState: 'Maharashtra',
    clientStateCode: '27',
    status: 'Sent',
    statusHistory: [
      { status: 'Draft', timestamp: '2026-09-04T10:00:00Z', note: 'Created quote for flagship retail boutique' },
      { status: 'Sent', timestamp: '2026-09-05T15:30:00Z', note: 'Sent quote with CAD drawings to Pooja Varma' },
    ],
    issueDate: '2026-09-05',
    validUntil: '2026-09-20',
    currency: { base: 'INR', export: 'USD', rate: 0.012 },
    taxMode: 'gst_intra',
    lineItems: [
      {
        id: 'li-201',
        productId: 'prod-003',
        name: 'Architectural Brass Display Frame (Brushed Gold PVD)',
        description: 'Solid brass hollow profile framing with brushed gold PVD finish.',
        hsnCode: '740710',
        qty: 12,
        unit: 'meter',
        unitPrice: 12800,
        taxRate: 18,
        discountPercent: 0,
        total: 153600,
        imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'li-202',
        productId: 'prod-006',
        name: 'Laser-Cut CNC Decorative MS Screen (Jali Partition)',
        description: '2.5mm thick MS sheet with intricate geometric CNC laser cut pattern.',
        hsnCode: '732690',
        qty: 94,
        unit: 'sqft',
        unitPrice: 320,
        taxRate: 18,
        discountPercent: 0,
        total: 30080,
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      },
    ],
    corporateFields: {
      rfqRef: 'RFQ-NSR-2026-08',
      paymentTerms: '50% Advance, balance against dispatch',
      incoterms: 'Ex-Works Navi Mumbai',
      deliveryTime: '10 Days',
    },
    documentModules: {
      dualSignOff: true,
      amountInWords: true,
      hsnCodes: true,
      thumbnails: true,
    },
    notes: 'PVD coating comes with a 5-year anti-tarnish guarantee under indoor climate-controlled conditions.',
    terms: 'Transit insurance to be borne by buyer.',
    totals: calculateQuoteTotals([
      { id: 'li-201', name: 'Architectural Brass Display Frame', description: '', hsnCode: '740710', qty: 12, unit: 'meter', unitPrice: 12800, taxRate: 18, total: 153600 },
      { id: 'li-202', name: 'Laser-Cut CNC Decorative Screen', description: '', hsnCode: '732690', qty: 94, unit: 'sqft', unitPrice: 320, taxRate: 18, total: 30080 },
    ], 'gst_intra', 0, 0),
    signature: {
      signatoryName: 'Faizan Uddin',
      signatoryTitle: 'Managing Director',
      signedAt: '2026-09-05T15:30:00Z',
    },
    version: 1,
    theme: 'executive',
    createdAt: '2026-09-04T10:00:00Z',
    updatedAt: '2026-09-05T15:30:00Z',
  },
];

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataStore {
  private memoryQuotes: Quote[] = [];
  private memoryClients: Client[] = [];
  private memoryProducts: Product[] = [];
  private memorySettings: CompanySettings = { ...initialCompanySettings };
  private seeded = false;
  private isSeeding = false;

  private quotesCache: CacheEntry<Quote[]> | null = null;
  private clientsCache: CacheEntry<Client[]> | null = null;
  private productsCache: CacheEntry<Product[]> | null = null;
  private settingsCache: CacheEntry<CompanySettings> | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds high-speed memory cache

  private async ensureSeeded() {
    if (this.seeded || this.isSeeding) return;
    this.isSeeding = true;
    try {
      const setting = await SettingModel.findOne().lean();
      if (!setting) {
        await SettingModel.create(initialCompanySettings);
        console.log('[MongoDB] Seeded company settings to Quotation.settings');
      }
      this.seeded = true;
    } catch (e) {
      console.warn('[MongoDB] Seeding notice:', (e as Error)?.message || e);
    } finally {
      this.isSeeding = false;
    }
  }

  // --- QUOTES ---
  async getQuotes(): Promise<Quote[]> {
    const now = Date.now();
    if (this.quotesCache && now - this.quotesCache.timestamp < this.CACHE_TTL) {
      return this.quotesCache.data;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const quotes = await QuoteModel.find().sort({ createdAt: -1 }).lean();
      const result = quotes.map((q: any) => {
        const { _id, __v, ...rest } = q;
        return rest as Quote;
      });
      this.quotesCache = { data: result, timestamp: now };
      return result;
    }
    return this.memoryQuotes;
  }

  async getQuoteById(id: string): Promise<Quote | undefined> {
    // If quote is already in cached quotes list, return directly in 0ms
    if (this.quotesCache) {
      const cached = this.quotesCache.data.find((q) => q.id === id || q.quoteNumber === id);
      if (cached) return cached;
    }

    const conn = await connectDB();
    const altId = id.startsWith('QT-') ? id.replace('QT-', 'GM-') : id.startsWith('GM-') ? id.replace('GM-', 'QT-') : id;
    if (conn) {
      await this.ensureSeeded();
      const quote = await QuoteModel.findOne({ $or: [{ id }, { quoteNumber: id }, { quoteNumber: altId }] }).lean();
      if (quote) {
        const { _id, __v, ...rest } = quote as any;
        return rest as Quote;
      }
      return undefined;
    }
    return this.memoryQuotes.find((q) => q.id === id || q.quoteNumber === id || q.quoteNumber === altId);
  }

  async createQuote(quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'> & { quoteNumber?: string }): Promise<Quote> {
    const conn = await connectDB();
    const id = `quote-${Date.now()}`;
    const now = new Date().toISOString();

    let count = this.memoryQuotes.length + 1;
    if (conn) {
      await this.ensureSeeded();
      count = (await QuoteModel.countDocuments()) + 1;
    }

    const pad = String(count).padStart(4, '0');
    const quoteNumber = quote.quoteNumber || `GM-2026-${pad}`;

    const newQuote: Quote = {
      ...quote,
      id,
      quoteNumber,
      createdAt: now,
      updatedAt: now,
    };

    if (conn) {
      await QuoteModel.create(newQuote);
      console.log(`[MongoDB] Saved new quotation ${quoteNumber} to Quotation.quotations`);
    }
    this.memoryQuotes.unshift(newQuote);
    this.quotesCache = null; // Invalidate cache for instant freshness
    return newQuote;
  }

  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote | null> {
    const now = new Date().toISOString();
    const conn = await connectDB();

    if (conn) {
      await this.ensureSeeded();
      const updated = await QuoteModel.findOneAndUpdate(
        { $or: [{ id }, { quoteNumber: id }] },
        { $set: { ...updates, updatedAt: now } },
        { new: true }
      ).lean();
      if (updated) {
        const { _id, __v, ...rest } = updated as any;
        const memIdx = this.memoryQuotes.findIndex((q) => q.id === id || q.quoteNumber === id);
        if (memIdx !== -1) {
          this.memoryQuotes[memIdx] = rest as Quote;
        }
        this.quotesCache = null; // Invalidate cache
        return rest as Quote;
      }
    }

    const index = this.memoryQuotes.findIndex((q) => q.id === id || q.quoteNumber === id);
    if (index === -1) return null;

    const existing = this.memoryQuotes[index];
    const updated: Quote = {
      ...existing,
      ...updates,
      updatedAt: now,
    };

    this.memoryQuotes[index] = updated;
    this.quotesCache = null;
    return updated;
  }

  async deleteQuote(id: string): Promise<boolean> {
    const conn = await connectDB();
    let success = false;
    if (conn) {
      await this.ensureSeeded();
      const res = await QuoteModel.deleteOne({ $or: [{ id }, { quoteNumber: id }] });
      success = (res.deletedCount || 0) > 0;
    }
    const initialLen = this.memoryQuotes.length;
    this.memoryQuotes = this.memoryQuotes.filter((q) => q.id !== id && q.quoteNumber !== id);
    if (!conn) {
      success = this.memoryQuotes.length < initialLen;
    }
    this.quotesCache = null;
    return success;
  }

  // --- CLIENTS ---
  async getClients(): Promise<Client[]> {
    const now = Date.now();
    if (this.clientsCache && now - this.clientsCache.timestamp < this.CACHE_TTL) {
      return this.clientsCache.data;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const clients = await ClientModel.find().sort({ createdAt: -1 }).lean();
      const result = clients.map((c: any) => {
        const { _id, __v, ...rest } = c;
        return rest as Client;
      });
      this.clientsCache = { data: result, timestamp: now };
      return result;
    }
    return this.memoryClients;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    if (this.clientsCache) {
      const found = this.clientsCache.data.find((c) => c.id === id);
      if (found) return found;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const client = await ClientModel.findOne({ id }).lean();
      if (client) {
        const { _id, __v, ...rest } = client as any;
        return rest as Client;
      }
      return undefined;
    }
    return this.memoryClients.find((c) => c.id === id);
  }

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const conn = await connectDB();
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (conn) {
      await this.ensureSeeded();
      await ClientModel.create(newClient);
    }
    this.memoryClients.unshift(newClient);
    this.clientsCache = null; // Invalidate cache
    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const updated = await ClientModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();
      if (updated) {
        const { _id, __v, ...rest } = updated as any;
        const memIdx = this.memoryClients.findIndex((c) => c.id === id);
        if (memIdx !== -1) {
          this.memoryClients[memIdx] = rest as Client;
        }
        this.clientsCache = null; // Invalidate cache
        return rest as Client;
      }
    }

    const index = this.memoryClients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.memoryClients[index] = { ...this.memoryClients[index], ...updates };
    this.clientsCache = null;
    return this.memoryClients[index];
  }

  async deleteClient(id: string): Promise<boolean> {
    const conn = await connectDB();
    let success = false;
    if (conn) {
      await this.ensureSeeded();
      const res = await ClientModel.deleteOne({ id });
      success = (res.deletedCount || 0) > 0;
    }
    const initialLen = this.memoryClients.length;
    this.memoryClients = this.memoryClients.filter((c) => c.id !== id);
    if (!conn) {
      success = this.memoryClients.length < initialLen;
    }
    this.clientsCache = null;
    return success;
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    const now = Date.now();
    if (this.productsCache && now - this.productsCache.timestamp < this.CACHE_TTL) {
      return this.productsCache.data;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const products = await ProductModel.find().sort({ createdAt: -1 }).lean();
      const result = products.map((p: any) => {
        const { _id, __v, ...rest } = p;
        return rest as Product;
      });
      this.productsCache = { data: result, timestamp: now };
      return result;
    }
    return this.memoryProducts;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    if (this.productsCache) {
      const found = this.productsCache.data.find((p) => p.id === id);
      if (found) return found;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const product = await ProductModel.findOne({ id }).lean();
      if (product) {
        const { _id, __v, ...rest } = product as any;
        return rest as Product;
      }
      return undefined;
    }
    return this.memoryProducts.find((p) => p.id === id);
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const conn = await connectDB();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (conn) {
      await this.ensureSeeded();
      await ProductModel.create(newProduct);
    }
    this.memoryProducts.unshift(newProduct);
    this.productsCache = null;
    return newProduct;
  }

  async bulkAddProducts(products: Array<Omit<Product, 'id' | 'createdAt'>>): Promise<Product[]> {
    const conn = await connectDB();
    const added: Product[] = products.map((p, idx) => ({
      ...p,
      id: `prod-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    if (conn) {
      await this.ensureSeeded();
      await ProductModel.insertMany(added);
    }
    this.memoryProducts.unshift(...added);
    this.productsCache = null;
    return added;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const updated = await ProductModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      ).lean();
      if (updated) {
        const { _id, __v, ...rest } = updated as any;
        const memIdx = this.memoryProducts.findIndex((p) => p.id === id);
        if (memIdx !== -1) {
          this.memoryProducts[memIdx] = rest as Product;
        }
        this.productsCache = null;
        return rest as Product;
      }
    }

    const index = this.memoryProducts.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.memoryProducts[index] = { ...this.memoryProducts[index], ...updates };
    this.productsCache = null;
    return this.memoryProducts[index];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const conn = await connectDB();
    let success = false;
    if (conn) {
      await this.ensureSeeded();
      const res = await ProductModel.deleteOne({ id });
      success = (res.deletedCount || 0) > 0;
    }
    const initialLen = this.memoryProducts.length;
    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== id);
    if (!conn) {
      success = this.memoryProducts.length < initialLen;
    }
    this.productsCache = null;
    return success;
  }

  // --- SETTINGS ---
  async getSettings(): Promise<CompanySettings> {
    const now = Date.now();
    if (this.settingsCache && now - this.settingsCache.timestamp < this.CACHE_TTL) {
      return this.settingsCache.data;
    }

    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const setting = await SettingModel.findOne().lean();
      if (setting) {
        const { _id, __v, ...rest } = setting as any;
        const result = rest as CompanySettings;
        this.settingsCache = { data: result, timestamp: now };
        return result;
      }
    }
    return this.memorySettings;
  }

  async updateSettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    const conn = await connectDB();
    if (conn) {
      await this.ensureSeeded();
      const updated = await SettingModel.findOneAndUpdate(
        {},
        { $set: updates },
        { new: true, upsert: true }
      ).lean();
      if (updated) {
        const { _id, __v, ...rest } = updated as any;
        this.memorySettings = { ...this.memorySettings, ...rest };
        this.settingsCache = null;
        return this.memorySettings;
      }
    }

    this.memorySettings = { ...this.memorySettings, ...updates };
    this.settingsCache = null;
    return this.memorySettings;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __appStore: DataStore | undefined;
}

export const store = globalThis.__appStore || new DataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__appStore = store;
}

