'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Shield } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

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
          <span>Gig<span style={{ color: 'var(--brand-primary)' }}>Shield</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
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
