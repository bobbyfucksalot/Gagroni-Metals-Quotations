'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ExtraCharge } from '@/types';

const PRESETS = ['Transport Charge', 'Labour Charge', 'Installation Charge', 'Packing Charge'];

const newId = () => `chg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

interface Props {
  charges: ExtraCharge[];
  onChange: (charges: ExtraCharge[]) => void;
}

/** Custom charge rows (name + amount) added on top of the quotation total, after tax. */
export default function ExtraChargesEditor({ charges, onChange }: Props) {
  const update = (id: string, patch: Partial<ExtraCharge>) =>
    onChange(charges.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const add = (name = '') => onChange([...charges, { id: newId(), name, amount: 0 }]);
  const remove = (id: string) => onChange(charges.filter((c) => c.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
        Additional Charges (+18% GST)
      </label>

      {charges.map((c) => (
        <div key={c.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            className="qc-input"
            style={{ height: '30px', fontSize: '12px', flex: 1, minWidth: 0 }}
            placeholder="Charge name (e.g. Transport)"
            value={c.name}
            onChange={(e) => update(c.id, { name: e.target.value })}
          />
          <input
            type="number"
            min="0"
            className="qc-input"
            style={{ height: '30px', fontSize: '12px', width: '96px' }}
            placeholder="₹ Amount"
            value={c.amount || ''}
            onChange={(e) => update(c.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
          />
          <button
            type="button"
            onClick={() => remove(c.id)}
            title="Remove charge"
            style={{ border: 'none', background: 'transparent', color: '#B91C1C', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '4px' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {PRESETS.filter((p) => !charges.some((c) => c.name === p)).map((p) => (
          <button
            key={p}
            type="button"
            className="btn-secondary"
            onClick={() => add(p)}
            style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
          >
            <Plus size={11} /> {p}
          </button>
        ))}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => add()}
          style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
        >
          <Plus size={11} /> Custom
        </button>
      </div>
    </div>
  );
}
