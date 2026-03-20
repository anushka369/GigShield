'use client'

import { useState } from 'react'
import { Filter, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { DEMO_CLAIMS, type ClaimStatus, type DisruptionType } from '@/lib/mockData'
import { formatINR, formatDate, getDisruptionIcon, getStatusColor, getStatusBg } from '@/lib/utils'

const STATUS_OPTIONS: { value: 'all' | ClaimStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'manual_review', label: 'Manual Review' },
]

const TYPE_OPTIONS: { value: 'all' | DisruptionType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'rainfall', label: '🌧️ Rainfall' },
  { value: 'aqi', label: '😷 AQI' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'bandh', label: '🚫 Bandh' },
  { value: 'outage', label: '📱 Platform Outage' },
]

export default function ClaimsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | ClaimStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | DisruptionType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = DEMO_CLAIMS.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter !== 'all' && c.disruption_type !== typeFilter) return false
    return true
  })

  const totalAmount = filtered.filter((c) => c.status === 'approved').reduce((s, c) => s + c.amount, 0)

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Claims History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {DEMO_CLAIMS.length} total claims · {formatINR(totalAmount)} received
          </p>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: 'var(--surface-1)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
          padding: '1rem 1.25rem', marginBottom: '1rem',
          display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <Filter size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

          <div style={{ position: 'relative' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ClaimStatus)}
              style={{ padding: '0.5rem 1.75rem 0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: '0.875rem', fontFamily: 'inherit', appearance: 'none', background: 'var(--surface-1)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | DisruptionType)}
              style={{ padding: '0.5rem 1.75rem 0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', fontSize: '0.875rem', fontFamily: 'inherit', appearance: 'none', background: 'var(--surface-1)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>

          {(statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => { setStatusFilter('all'); setTypeFilter('all') }}
              style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
            >
              Clear filters
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Claims List */}
        {filtered.length === 0 ? (
          <div style={{
            background: 'var(--surface-1)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
            padding: '3rem 2rem', textAlign: 'center',
          }}>
            <AlertCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No claims match your filters</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try changing the status or type filter above</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((claim) => {
              const isExpanded = expandedId === claim.id
              const hasFlags = claim.fraud_flags && claim.fraud_flags.length > 0

              return (
                <div
                  key={claim.id}
                  style={{
                    background: 'var(--surface-1)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    border: `1px solid ${claim.status === 'manual_review' ? '#9333EA30' : 'transparent'}`,
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: hasFlags ? 'pointer' : 'default',
                    }}
                    onClick={() => hasFlags && setExpandedId(isExpanded ? null : claim.id)}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-2)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
                    }}>
                      {getDisruptionIcon(claim.disruption_type)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: '0.2rem' }}>
                        {claim.disruption_type.replace('_', ' ')} · {claim.city}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{formatDate(claim.created_at)}</span>
                        <span>{claim.hours_lost}h lost</span>
                        {claim.auto_approved && <span style={{ color: 'var(--brand-accent)', fontWeight: 600 }}>Auto-approved</span>}
                        {claim.status === 'manual_review' && <span style={{ color: '#9333EA', fontWeight: 600 }}>Manual review</span>}
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {formatINR(claim.amount)}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                        borderRadius: 100, whiteSpace: 'nowrap',
                        background: getStatusBg(claim.status), color: getStatusColor(claim.status),
                        textTransform: 'capitalize',
                      }}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Processing time */}
                    {claim.processing_time !== '—' && (
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        {claim.processing_time}
                      </div>
                    )}

                    {/* Expand toggle */}
                    {hasFlags && (
                      <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}
                  </div>

                  {/* Expanded: fraud flags */}
                  {isExpanded && hasFlags && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Review Signals
                      </div>
                      {claim.review_reason && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                          {claim.review_reason}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {claim.fraud_flags.map((flag, i) => (
                          <div key={i} style={{
                            fontSize: '0.8rem', padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)', background: '#FFF7ED',
                            color: '#9A3412', border: '1px solid #FED7AA',
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                          }}>
                            <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                            {flag}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>Fraud score: <strong style={{ color: '#DC2626' }}>{claim.fraud_score}</strong></span>
                        <span>·</span>
                        <span>BAS: <strong style={{ color: claim.bas_score >= 65 ? '#16A34A' : '#EA580C' }}>{claim.bas_score}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
