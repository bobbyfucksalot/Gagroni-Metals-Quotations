import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    let products = await store.getProducts();

    if (category && category !== 'All') {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.hsnCode.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ products, count: products.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if bulk import
    if (Array.isArray(body)) {
      const added = await store.bulkAddProducts(body);
      return NextResponse.json({ success: true, count: added.length, products: added }, { status: 201 });
    }

    const { name, sku, category, description, mrp, offerPrice, defaultGstRate, unit, stockQty, hsnCode, imageUrl } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: 'Product name and SKU are required' }, { status: 400 });
    }

    const newProduct = await store.createProduct({
      name,
      sku,
      category: category || 'Stainless Steel',
      description: description || '',
      mrp: Number(mrp) || 0,
      offerPrice: Number(offerPrice) || Number(mrp) || 0,
      defaultGstRate: Number(defaultGstRate) || 18,
      unit: unit || 'pcs',
      stockQty: Number(stockQty) || 0,
      hsnCode: hsnCode || '730890',
      imageUrl: imageUrl || '',
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
