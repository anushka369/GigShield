'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const TIERS = [
  {
    name: 'Basic',
    weekly: 79,
    dailyCap: 400,
    recommended: false,
    features: ['Up to ₹400/day coverage', '2 disruption days/week', '4 hours covered/day', 'Auto-claim processing', 'UPI instant payout'],
  },
  {
    name: 'Standard',
    weekly: 129,
    dailyCap: 650,
    recommended: true,
    features: ['Up to ₹650/day coverage', '3 disruption days/week', '6 hours covered/day', 'Auto-claim processing', 'UPI instant payout', 'Priority support'],
  },
  {
    name: 'Premium',
    weekly: 199,
    dailyCap: 900,
    recommended: false,
    features: ['Up to ₹900/day coverage', '5 disruption days/week', '8 hours covered/day', 'Auto-claim processing', 'UPI instant payout', 'Priority support', 'Retroactive payout safety net'],
  },
]

export default function PricingCards() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TIERS.map((tier) => {
        const isActive = hovered ? hovered === tier.name : tier.recommended
        return (
          <div
            key={tier.name}
            className="card p-6"
            style={{
              border: isActive ? '2px solid var(--brand-primary)' : '1px solid var(--border)',
              position: 'relative',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
              transition: 'border 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
              boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHovered(tier.name)}
            onMouseLeave={() => setHovered(null)}
          >
            {tier.recommended && (
              <div
                style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--brand-primary)', color: 'white',
                  padding: '0.2rem 0.9rem', borderRadius: 20,
                  fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                }}
              >
                Most Popular
              </div>
            )}
            <h3 className="font-display font-bold mb-1" style={{ fontSize: '1.1rem' }}>{tier.name}</h3>
            <div style={{ marginBottom: '0.25rem' }}>
              <span className="font-display font-bold" style={{ fontSize: '2.25rem', color: 'var(--brand-primary)' }}>
                ₹{tier.weekly}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>/week</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
              ≈ ₹{tier.weekly * 4}/month · ₹{tier.dailyCap}/day cap
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
              {tier.features.map((f) => (
                <li key={f} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                  <CheckCircle size={15} style={{ color: 'var(--brand-accent)', flexShrink: 0, marginTop: 2 }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="btn-primary"
              style={{
                width: '100%', justifyContent: 'center', textDecoration: 'none',
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--brand-primary)',
                border: isActive ? 'none' : '2px solid var(--brand-primary)',
                transition: 'background 0.18s ease, color 0.18s ease',
              }}
            >
              Get {tier.name} — ₹{tier.weekly}/week
            </Link>
          </div>
        )
      })}
    </div>
  )
}
