"use client";

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, Upload, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialValue?: string;
  defaultSignatureUrl?: string;
}

export default function SignaturePad({ onSave, initialValue, defaultSignatureUrl }: SignaturePadProps) {
  const [tab, setTab] = useState<'draw' | 'upload'>('upload');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string>(initialValue || defaultSignatureUrl || '');

  useEffect(() => {
    if (initialValue) {
      setCurrentSignature(initialValue);
    } else if (defaultSignatureUrl && !currentSignature) {
      setCurrentSignature(defaultSignatureUrl);
      onSave(defaultSignatureUrl);
    }
  }, [initialValue, defaultSignatureUrl]);

  // If in draw mode, initialize or restore canvas
  useEffect(() => {
    if (tab !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 450;
    canvas.height = 160;
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentSignature && currentSignature.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = currentSignature;
    }
  }, [tab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setCurrentSignature(dataUrl);
      onSave(dataUrl);
    }
  };

  const handleClearDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setCurrentSignature('');
    onSave('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCurrentSignature(dataUrl);
        onSave(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setCurrentSignature('');
    setHasDrawn(false);
    onSave('');
  };

  const handleUseDefault = () => {
    if (defaultSignatureUrl) {
      setCurrentSignature(defaultSignatureUrl);
      onSave(defaultSignatureUrl);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Tabs Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'inline-flex', background: '#F4F4F5', padding: '3px', borderRadius: '8px', border: '1px solid #E4E4E7' }}>
          <button
            type="button"
            onClick={() => setTab('upload')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'upload' ? '#FFFFFF' : 'transparent',
              color: tab === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'upload' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Upload size={13} /> Upload Signature Image
          </button>
          <button
            type="button"
            onClick={() => setTab('draw')}
            style={{
              padding: '5px 12px',
              fontSize: '11.5px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'draw' ? '#FFFFFF' : 'transparent',
              color: tab === 'draw' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'draw' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PenTool size={13} /> Draw Signature
          </button>
        </div>

        {defaultSignatureUrl && currentSignature !== defaultSignatureUrl && (
          <button
            type="button"
            onClick={handleUseDefault}
            className="btn-secondary"
            style={{ height: '28px', fontSize: '11px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <CheckCircle2 size={12} style={{ color: 'var(--accent-emerald)' }} /> Use Company Signature
          </button>
        )}
      </div>

      {/* Upload Mode */}
      {tab === 'upload' && (
        <div>
          {currentSignature ? (
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                background: '#FFFFFF',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    background: '#FAFAFA',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '140px',
                    height: '64px',
                  }}
                >
                  <img
                    src={currentSignature}
                    alt="Active Signature"
                    style={{ maxHeight: '54px', maxWidth: '160px', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#047857', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={14} /> Signature Attached
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Will appear on the quotation above the Authorized Signatory title.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  className="btn-secondary"
                  style={{ height: '32px', fontSize: '11px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <Upload size={12} /> Change Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveSignature}
                  style={{
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: '#B91C1C',
                    height: '32px',
                    fontSize: '11px',
                    padding: '0 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '600',
                  }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label
              style={{
                border: '2px dashed #CBD5E1',
                borderRadius: '10px',
                background: '#FAFAF9',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <Upload size={22} style={{ color: 'var(--accent-emerald)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Click to upload Admin / Authorized Signature
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Upload PNG (transparent background recommended), JPG or WebP of your signature or stamp
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          )}
        </div>
      )}

      {/* Draw Mode */}
      {tab === 'draw' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '10px',
              background: '#FAFAF9',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ width: '100%', height: '160px', touchAction: 'none', cursor: 'crosshair' }}
            />

            {!hasDrawn && !currentSignature && (
              <div
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <PenTool size={14} /> Draw authorized digital signature here with mouse or finger
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={handleClearDraw}
              className="btn-secondary"
              style={{ height: '30px', fontSize: '11px', padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={12} /> Clear Canvas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
