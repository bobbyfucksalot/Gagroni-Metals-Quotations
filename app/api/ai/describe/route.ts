import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, category, unit } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const lower = name.toLowerCase();
    let enhancedDescription = '';

    if (lower.includes('ss 304') || lower.includes('304') || lower.includes('stainless')) {
      enhancedDescription = `Premium SS 304 grade austenitic stainless steel fabrication with 16-gauge precision CNC laser cutting, smooth TIG welded seams, passivated and satin mirror finish (No. 4). Corrosion-resistant for indoor and industrial environments.`;
    } else if (lower.includes('316') || lower.includes('cleanroom') || lower.includes('pharma')) {
      enhancedDescription = `Pharma-grade SS 316L electropolished stainless steel construction with coved internal radiuses, crevice-free seamless welds, and mirror polish (Ra < 0.4µm). Conforms to FDA & cGMP cleanroom hygiene standards.`;
    } else if (lower.includes('brass') || lower.includes('copper') || lower.includes('gold')) {
      enhancedDescription = `Architectural grade solid brass extrusion profile with multi-stage physical vapor deposition (PVD) titanium gold coating. UV-resistant clear lacquer seal preventing oxidation and fingerprint marking.`;
    } else if (lower.includes('mild steel') || lower.includes('ms') || lower.includes('jali') || lower.includes('powder')) {
      enhancedDescription = `Commercial heavy-gauge mild steel structure with 7-tank chemical pre-treatment and 80+ micron electrostatic epoxy polyester powder coat finish in matte texture. Excellent structural integrity and wear resistance.`;
    } else if (lower.includes('aluminum') || lower.includes('baffle') || lower.includes('sheet')) {
      enhancedDescription = `High-strength Architectural Aluminum Alloy 6063-T6 / 3003-H14 with acoustic perforation pattern, non-combustible sound-dampening fleece backing, and electro-anodized surface finish.`;
    } else if (lower.includes('bolt') || lower.includes('fastener') || lower.includes('hardware')) {
      enhancedDescription = `High tensile stainless steel fastener kit with cold-forged threads, self-locking nylon insert nuts, and heavy Belleville spring washers ensuring vibration-proof anchor reliability.`;
    } else {
      enhancedDescription = `Custom manufactured ${name} fabricated to tight engineering tolerances (±0.5mm) using high-grade structural alloys, deburred edges, and protective transit film packaging.`;
    }

    return NextResponse.json({ description: enhancedDescription });
  } catch {
    return NextResponse.json({ error: 'AI description generation failed' }, { status: 500 });
  }
}
