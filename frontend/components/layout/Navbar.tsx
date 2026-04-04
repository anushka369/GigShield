'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Shield } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { locale, setLocale } = useLanguage()

  const showToggle =
    pathname.startsWith('/onboarding') || pathname.startsWith('/dashboard')

  const LanguageToggle = () => (
    <div
      style={{
        display: 'flex',
        border: '1.5px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => setLocale('en')}
        style={{
          padding: '4px 10px',
          background: locale === 'en' ? 'var(--brand-primary)' : 'transparent',
          color: locale === 'en' ? 'white' : 'var(--text-secondary)',
          fontWeight: 600,
          fontSize: '0.78rem',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: 1.4,
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('hi')}
        style={{
          padding: '4px 10px',
          background: locale === 'hi' ? 'var(--brand-primary)' : 'transparent',
          color: locale === 'hi' ? 'white' : 'var(--text-secondary)',
          fontWeight: 600,
          fontSize: '0.82rem',
          border: 'none',
          borderLeft: '1.5px solid var(--border)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: 1.4,
        }}
      >
        हिं
      </button>
    </div>
  )

  return (
    <nav
      style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          <span style={{ color: 'var(--brand-primary)' }}>
            <Shield size={24} />
          </span>
          <span>Aegi<span style={{ color: 'var(--brand-primary)' }}>Sync</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {showToggle && <LanguageToggle />}
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Link href="/claims" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Claims
          </Link>
          <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Admin
          </Link>
          <Link href="/onboarding" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
            Get Covered
          </Link>
        </div>

        {/* Mobile right: toggle + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {showToggle && <LanguageToggle />}
          <button
            className="p-2 rounded-lg"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-3"
          style={{ background: 'var(--surface-1)', borderTop: '1px solid var(--border)' }}
        >
          <Link href="/dashboard" onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
            Dashboard
          </Link>
          <Link href="/claims" onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
            Claims
          </Link>
          <Link href="/admin" onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', textDecoration: 'none', padding: '0.5rem 0', fontWeight: 500 }}>
            Admin
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setOpen(false)}
            className="btn-primary"
            style={{ textAlign: 'center', justifyContent: 'center' }}
          >
            Get Covered — ₹79/week
          </Link>
        </div>
      )}
    </nav>
  )
}
