import mongoose, { Schema } from 'mongoose';

// 1. Quote Schema & Model
const QuoteSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    quoteNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    clientId: { type: String },
    clientName: { type: String, required: true },
    clientContactPerson: { type: String },
    clientEmail: { type: String },
    clientPhone: { type: String },
    clientAddress: { type: String },
    clientGst: { type: String },
    clientState: { type: String },
    clientStateCode: { type: String },
    consigneeName: { type: String },
    consigneeAddress: { type: String },
    consigneeGst: { type: String },
    consigneeState: { type: String },
    consigneeStateCode: { type: String },
    status: { type: String, default: 'Draft' },
    statusHistory: { type: Array, default: [] },
    issueDate: { type: String },
    validUntil: { type: String },
    currency: { type: Schema.Types.Mixed },
    taxMode: { type: String, default: 'gst_intra' },
    lineItems: { type: Array, default: [] },
    corporateFields: { type: Schema.Types.Mixed, default: {} },
    documentModules: { type: Schema.Types.Mixed, default: {} },
    notes: { type: String, default: '' },
    terms: { type: String, default: '' },
    totals: { type: Schema.Types.Mixed, default: {} },
    marketingPage: { type: Schema.Types.Mixed },
    signature: { type: Schema.Types.Mixed },
    version: { type: Number, default: 1 },
    versionHistory: { type: Array, default: [] },
    theme: { type: String, default: 'tally' },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  {
    timestamps: false,
    strict: false,
  }
);

QuoteSchema.index({ createdAt: -1 });
QuoteSchema.index({ clientId: 1 });
QuoteSchema.index({ status: 1 });

export const QuoteModel = mongoose.models.Quote || mongoose.model('Quote', QuoteSchema, 'quotations');

// 2. Client Schema & Model
const ClientSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    contactPerson: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    taxId: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    category: { type: String, default: 'Commercial' },
    notes: { type: String, default: '' },
    createdAt: { type: String },
  },
  {
    timestamps: false,
    strict: false,
  }
);

ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ name: 1 });

export const ClientModel = mongoose.models.Client || mongoose.model('Client', ClientSchema, 'clients');

// 3. Product Schema & Model
const ProductSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, default: 'Stainless Steel' },
    description: { type: String, default: '' },
    mrp: { type: Number, default: 0 },
    offerPrice: { type: Number, default: 0 },
    defaultGstRate: { type: Number, default: 18 },
    unit: { type: String, default: 'pcs' },
    imageUrl: { type: String, default: '' },
    stockQty: { type: Number, default: 0 },
    hsnCode: { type: String, default: '730890' },
    createdAt: { type: String },
  },
  {
    timestamps: false,
    strict: false,
  }
);

ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ category: 1 });

export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema, 'products');

// 4. Company Settings Schema & Model
const SettingSchema = new Schema(
  {
    companyName: { type: String, default: 'GAGRONI METALS PRIVATE LIMITED' },
    tagline: { type: String, default: '' },
    taxId: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    cinNumber: { type: String, default: '' },
    msmeNumber: { type: String, default: '' },
    iecNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    pincode: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    signatoryName: { type: String, default: '' },
    signatoryTitle: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankAccountNo: { type: String, default: '' },
    bankIfsc: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    upiId: { type: String, default: '' },
    paymentQrUrl: { type: String, default: '' },
    paymentModePreference: { type: String, default: 'both' },
    defaultPaymentTerms: { type: String, default: '' },
    defaultNotes: { type: String, default: '' },
    defaultValidDays: { type: Number, default: 15 },
    defaultPdfTheme: { type: String, default: 'tally' },
    currencySymbol: { type: String, default: '₹' },
  },
  {
    timestamps: false,
    strict: false,
  }
);

export const SettingModel = mongoose.models.Setting || mongoose.model('Setting', SettingSchema, 'settings');
