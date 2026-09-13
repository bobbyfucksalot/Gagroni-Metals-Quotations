"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({ message, type = 'success' }: ToastProps) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={16} style={{ color: '#10B981' }} />,
    error: <AlertCircle size={16} style={{ color: '#EF4444' }} />,
    info: <Info size={16} style={{ color: '#3B82F6' }} />,
  };

  return (
    <div className="qc-toast">
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}
