"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'compact' | 'sidebar' | 'switch';
  className?: string;
}

export default function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('gm_theme') === 'dark' ||
      (!localStorage.getItem('gm_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setTheme(isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const handleThemeChange = () => {
      const currentDark = document.documentElement.classList.contains('dark');
      setTheme(currentDark ? 'dark' : 'light');
    };

    window.addEventListener('gm-theme-change', handleThemeChange);
    return () => window.removeEventListener('gm-theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('gm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('gm_theme', 'light');
    }

    window.dispatchEvent(new Event('gm-theme-change'));
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: variant === 'sidebar' ? '100%' : '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'transparent',
        }}
      />
    );
  }

  // Sidebar Variant: Full width row with toggle switch
  if (variant === 'sidebar') {
    const isDark = theme === 'dark';
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={className}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: isDark ? '#171A24' : '#F4F4F5',
          border: `1px solid ${isDark ? '#2D3344' : '#E4E4E7'}`,
          borderRadius: '10px',
          cursor: 'pointer',
          color: isDark ? '#E5E7EB' : '#374151',
          fontSize: '12px',
          fontWeight: '600',
          transition: 'all 200ms ease',
          marginBottom: '10px',
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDark ? (
            <Moon size={15} style={{ color: '#38BDF8' }} />
          ) : (
            <Sun size={15} style={{ color: '#F59E0B' }} />
          )}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </div>

        {/* Animated toggle pill */}
        <div
          style={{
            width: '36px',
            height: '20px',
            borderRadius: '12px',
            background: isDark ? 'var(--accent-emerald, #10B981)' : '#D1D5DB',
            position: 'relative',
            transition: 'background 200ms ease',
            padding: '2px',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transform: isDark ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </button>
    );
  }

  // Compact Header Variant: Sleek icon button with glow
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-theme-toggle ${className}`}
      style={{
        height: '36px',
        minWidth: '36px',
        padding: '0 10px',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#2D3344' : '#E4E4E7'}`,
        background: isDark ? '#171A24' : '#FFFFFF',
        color: isDark ? '#F3F4F6' : '#374151',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        transition: 'all 180ms ease',
        boxShadow: isDark ? '0 0 12px rgba(56, 189, 248, 0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <>
          <Moon size={15} style={{ color: '#38BDF8' }} />
          <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>Dark</span>
        </>
      ) : (
        <>
          <Sun size={15} style={{ color: '#F59E0B' }} />
          <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Light</span>
        </>
      )}
    </button>
  );
}
