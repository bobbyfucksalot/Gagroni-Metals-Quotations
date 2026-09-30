import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

// Never serve script-capable types (svg, html, xhtml) from our own origin.
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const image = await store.getProductImage(id);

  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(image);
  if (!match) {
    // Remote photo: only ever redirect to an absolute http(s) URL.
    try {
      const target = new URL(image);
      if (target.protocol === 'https:' || target.protocol === 'http:') {
        return NextResponse.redirect(target);
      }
    } catch {
      // not an absolute URL
    }
    return new NextResponse(null, { status: 404 });
  }

  const [, rawMime, isBase64, payload] = match;
  const mime = rawMime.toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return new NextResponse(null, { status: 415 });
  }

  const body = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload));

  return new NextResponse(body, {
    headers: {
      'Content-Type': mime,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': 'inline; filename="image"',
      // URL carries a ?v=<length> version, so a changed image gets a new URL.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
