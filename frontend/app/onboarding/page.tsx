'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Check, ChevronDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TIER_CONFIG, ZONE_RISK_MAP, SEASONAL_FACTORS } from '@/lib/mockData'
import { formatINR } from '@/lib/utils'
import api from '@/lib/api'
import { setToken } from '@/lib/auth'

type Step = 1 | 2 | 3 | 4

interface FormData {
  name: string
  phone: string
  otp: string
  platform: 'zomato' | 'swiggy' | ''
  platform_id: string
  years_active: number
  avg_daily_earning: number
  city: string
  zone: string
  upi_id: string
  tier: 'basic' | 'standard' | 'premium' | ''
}

const CITIES = Object.keys(ZONE_RISK_MAP)

function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
      {([1, 2, 3, 4] as Step[]).map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0,
              background: step > s ? 'var(--brand-primary)' : step === s ? 'var(--brand-primary)' : 'var(--surface-3)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {step > s ? <Check size={16} /> : s}
          </div>
          {i < 3 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: step > s ? 'var(--brand-primary)' : 'var(--surface-3)',
                margin: '0 0.25rem',
                transition: 'background 0.3s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function StepLabel({ step }: { step: Step }) {
  const t = useTranslations('onboarding')
  const labels: Record<Step, string> = {
    1: t('step1.title'),
    2: t('step2.title'),
    3: t('step3.title'),
    4: t('step4.title'),
  }
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
        {t('stepOf', { step })}
      </div>
      <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
        {labels[step]}
      </h2>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    otp: '',
    platform: '',
    platform_id: '',
    years_active: 2,
    avg_daily_earning: 750,
    city: '',
    zone: '',
    upi_id: '',
    tier: '',
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [activating, setActivating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [quotes, setQuotes] = useState<Record<string, { weekly_premium: number; daily_coverage_cap: number; max_days_per_week: number; max_hours_per_day: number }> | null>(null)

  const set = (key: keyof FormData, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }))

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.phone)) {
      setOtpError(t('step1.phoneError'))
      return
    }
    setOtpError('')
    setOtpLoading(true)
    try {
      const res = await api.post('/auth/send-otp', { phone: form.phone })
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp)
      setOtpSent(true)
    } catch (e) {
      console.error('[Onboarding] send-otp failed, using mock', e)
      setDevOtp('123456')
      setOtpSent(true)
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    setOtpError('')
    try {
      const res = await api.post('/auth/verify-otp', { phone: form.phone, otp: form.otp })
      if (res.data.token) {
        setToken(res.data.token)
        router.push('/dashboard')
        return
      }
      setStep(2)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setOtpError(msg ?? 'Incorrect OTP. Please try again.')
    }
  }

  const getZones = () => (form.city ? Object.keys(ZONE_RISK_MAP[form.city] ?? {}) : [])

  const getZoneRisk = () =>
    form.city && form.zone ? ZONE_RISK_MAP[form.city]?.[form.zone]?.overall_risk ?? 1.0 : null

  const getRiskBadge = (risk: number | null) => {
    if (!risk) return null
    if (risk >= 1.3) return { labelKey: 'step3.riskVeryHigh' as const, color: '#DC2626', icon: '🌧️' }
    if (risk >= 1.2) return { labelKey: 'step3.riskHigh' as const, color: '#EA580C', icon: '⚠️' }
    if (risk >= 1.1) return { labelKey: 'step3.riskModerate' as const, color: '#D97706', icon: '🔶' }
    return { labelKey: 'step3.riskLower' as const, color: '#16A34A', icon: '✅' }
  }

  const getMonthlyFactor = () => SEASONAL_FACTORS[new Date().getMonth() + 1] ?? 1.0

  const getQuote = (tier: 'basic' | 'standard' | 'premium') => {
    const config = TIER_CONFIG[tier]
    const risk = getZoneRisk() ?? 1.0
    const seasonal = getMonthlyFactor()
    return Math.round(config.base * risk * seasonal)
  }

  const fetchQuotes = async () => {
    if (!form.city || !form.zone) return
    try {
      const res = await api.post('/policies/quote', { city: form.city, zone: form.zone })
      setQuotes(res.data)
    } catch (e) {
      console.error('[Onboarding] quote fetch failed, using local calc', e)
    }
  }

  const activate = async () => {
    if (!form.tier) return
    setActivating(true)
    try {
      const pincode = ZONE_RISK_MAP[form.city]?.[form.zone]?.pincode ?? '000000'
      await api.post('/workers/register', {
        name: form.name,
        phone: form.phone,
        email: null,
        city: form.city,
        zone: form.zone,
        pincode,
        platform: form.platform,
        platform_id: form.platform_id || null,
        upi_id: form.upi_id,
        avg_daily_earning: form.avg_daily_earning,
        years_active: form.years_active,
        tier: form.tier,
      })
      const otpRes = await api.post('/auth/send-otp', { phone: form.phone })
      const verifyRes = await api.post('/auth/verify-otp', {
        phone: form.phone,
        otp: otpRes.data.dev_otp,
      })
      setToken(verifyRes.data.token)
      setSuccess(true)
      await new Promise((r) => setTimeout(r, 800))
      router.push('/dashboard')
    } catch (e) {
      console.error('[Onboarding] register failed, falling back to mock', e)
      localStorage.setItem('aegisync_policy', JSON.stringify({
        worker_name: form.name, platform: form.platform, city: form.city,
        zone: form.zone, tier: form.tier,
        weekly_premium: getQuote(form.tier as 'basic' | 'standard' | 'premium'),
        coverage_per_day: TIER_CONFIG[form.tier as 'basic' | 'standard' | 'premium'].dailyCap,
        status: 'active',
      }))
      setSuccess(true)
      await new Promise((r) => setTimeout(r, 800))
      router.push('/dashboard')
    } finally {
      setActivating(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: 'var(--surface-1)',
    color: 'var(--text-primary)',
  }

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--surface-1)',
            borderRadius: 'var(--radius-lg)',
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <Shield size={22} style={{ color: 'var(--brand-primary)' }} />
            <span className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Aegi<span style={{ color: 'var(--brand-primary)' }}>Sync</span>
            </span>
          </div>

          <ProgressBar step={step} />
          <StepLabel step={step} />

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  {t('step1.fullName')}
                </label>
                <input type="text" placeholder="Rajesh Kumar" value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  {t('step1.phone')}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ padding: '0.75rem 1rem', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>+91</span>
                  <input type="tel" placeholder="9876543210" value={form.phone} maxLength={10} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, flex: 1, width: 'auto' }} />
                </div>
              </div>

              {!otpSent ? (
                <button className="btn-primary" onClick={sendOtp} disabled={otpLoading || !form.name || form.phone.length !== 10}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', opacity: (!form.name || form.phone.length !== 10) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {otpLoading ? <><Loader2 size={18} className="spin" /> {t('step1.sendingOtp')}</> : t('step1.sendOtp')}
                </button>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>{t('step1.enterOtp')}</label>
                    <input type="text" placeholder="123456" value={form.otp} maxLength={6} autoFocus
                      onChange={(e) => set('otp', e.target.value.replace(/\D/g, ''))}
                      style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', border: '1.5px solid var(--brand-primary)' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      {t('step1.demoCode')} <strong style={{ color: 'var(--brand-primary)' }}>{devOtp || '123456'}</strong>
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => { void verifyOtp() }} disabled={form.otp.length !== 6}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', opacity: form.otp.length !== 6 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('step1.verifyContinue')}
                  </button>
                </>
              )}

              {otpError && <p style={{ fontSize: '0.85rem', color: 'var(--brand-danger)', textAlign: 'center' }}>{otpError}</p>}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>{t('step2.yourPlatform')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {(['zomato', 'swiggy'] as const).map((p) => (
                    <button key={p} onClick={() => set('platform', p)}
                      style={{
                        padding: '1rem', borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${form.platform === p ? 'var(--brand-primary)' : 'var(--border)'}`,
                        background: form.platform === p ? 'rgba(255,107,0,0.06)' : 'var(--surface-1)',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                        color: form.platform === p ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}>
                      {p === 'zomato' ? '🔴 Zomato' : '🟠 Swiggy'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>
                  {t('step2.partnerId')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{t('step2.optional')}</span>
                </label>
                <input type="text" placeholder="SWG847291" value={form.platform_id} onChange={(e) => set('platform_id', e.target.value)} style={inputStyle} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t('step2.yearsOnPlatform')}</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{form.years_active} {form.years_active !== 1 ? t('step2.yrs') : t('step2.yr')}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={form.years_active} onChange={(e) => set('years_active', Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>0</span><span>10+</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t('step2.avgDailyEarnings')}</label>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{formatINR(form.avg_daily_earning)}{t('step2.perDay')}</span>
                </div>
                <input type="range" min={300} max={1500} step={50} value={form.avg_daily_earning} onChange={(e) => set('avg_daily_earning', Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>₹300</span><span>₹1,500</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {t('step2.weeklyEstimate')} <strong style={{ color: 'var(--text-primary)' }}>~{formatINR(form.avg_daily_earning * 6)}</strong>
                </p>
              </div>

              <button className="btn-primary" onClick={() => setStep(3)} disabled={!form.platform}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', opacity: !form.platform ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('step2.continue')}
              </button>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>{t('step3.city')}</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.city} onChange={(e) => { set('city', e.target.value); set('zone', '') }}
                    style={{ ...inputStyle, paddingRight: '2.5rem', appearance: 'none', cursor: 'pointer', color: form.city ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <option value="">{t('step3.selectCity')}</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>{t('step3.zoneLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.zone} onChange={(e) => set('zone', e.target.value)} disabled={!form.city}
                    style={{ ...inputStyle, paddingRight: '2.5rem', appearance: 'none', cursor: form.city ? 'pointer' : 'not-allowed', color: form.zone ? 'var(--text-primary)' : 'var(--text-muted)', opacity: form.city ? 1 : 0.6, background: form.city ? 'var(--surface-1)' : 'var(--surface-2)' }}>
                    <option value="">{t('step3.selectZone')}</option>
                    {getZones().map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>
              </div>

              {form.zone && (() => {
                const risk = getZoneRisk()
                const badge = getRiskBadge(risk)
                return badge ? (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: `${badge.color}15`, border: `1px solid ${badge.color}40`, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: badge.color }}>
                    <span>{badge.icon}</span>
                    {t(badge.labelKey)} · {t('step3.riskScore')} {risk?.toFixed(2)}
                  </div>
                ) : null
              })()}

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>{t('step3.upiId')}</label>
                <input type="text" placeholder={t('step3.upiPlaceholder')} value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)}
                  style={{ ...inputStyle, border: `1.5px solid ${form.upi_id && !form.upi_id.includes('@') ? 'var(--brand-danger)' : 'var(--border)'}` }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{t('step3.upiHint')}</p>
              </div>

              <button className="btn-primary" onClick={() => { fetchQuotes(); setStep(4) }} disabled={!form.city || !form.zone || !form.upi_id.includes('@')}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', opacity: (!form.city || !form.zone || !form.upi_id.includes('@')) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('step3.viewPlans')}
              </button>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>{t('step3.back')}</button>
            </div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(['basic', 'standard', 'premium'] as const).map((tier) => {
                const config = TIER_CONFIG[tier]
                const price = quotes?.[tier]?.weekly_premium ?? getQuote(tier)
                const dailyCap = quotes?.[tier]?.daily_coverage_cap ?? config.dailyCap
                const maxDays = quotes?.[tier]?.max_days_per_week ?? config.maxDays
                const maxHours = quotes?.[tier]?.max_hours_per_day ?? config.maxHours
                const isSelected = form.tier === tier
                const isRecommended = tier === 'standard'
                const tierFeatures = [
                  `≈₹${Math.round(price * 4)}/mo`,
                  tier === 'basic' ? t('step4.rainfallOnly') : t('step4.allEvents'),
                  tier === 'premium' ? t('step4.priorityPayouts') : tier === 'standard' ? t('step4.autoApprove') : t('step4.basicCoverage'),
                ]
                return (
                  <div key={tier} onClick={() => set('tier', tier)}
                    style={{
                      border: `2px solid ${isSelected ? 'var(--brand-primary)' : isRecommended && !form.tier ? 'var(--brand-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '1.25rem', cursor: 'pointer',
                      background: isSelected ? 'rgba(255,107,0,0.05)' : 'var(--surface-1)',
                      position: 'relative', transition: 'all 0.15s',
                    }}>
                    {isRecommended && (
                      <div style={{ position: 'absolute', top: '-12px', left: '1rem', background: 'var(--brand-primary)', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 100, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {t('step4.recommended')}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '1rem', color: 'var(--text-primary)' }}>{tier}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {t('step4.upTo')} {formatINR(dailyCap)}/day · {maxDays} {t('step4.daysPerWk')} · {maxHours} {t('step4.hrsPerDay')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{Math.round(price)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('step4.perWeek')}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {tierFeatures.map((f) => (
                        <span key={f} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 100, background: 'var(--surface-2)', color: 'var(--text-secondary)', fontWeight: 500 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )
              })}

              {success ? (
                <div style={{ padding: '1.25rem', borderRadius: 'var(--radius)', background: '#DCFCE7', border: '1px solid #16A34A40', textAlign: 'center', color: '#16A34A', fontWeight: 700 }}>
                  {t('step4.success')}
                </div>
              ) : (
                <button className="btn-primary" onClick={activate} disabled={!form.tier || activating}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem', opacity: !form.tier ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {activating
                    ? <><Loader2 size={18} className="spin" /> {t('step4.activating')}</>
                    : form.tier
                      ? t('step4.activateFor', { price: Math.round(quotes?.[form.tier]?.weekly_premium ?? getQuote(form.tier as 'basic' | 'standard' | 'premium')) })
                      : t('step4.selectPlan')}
                </button>
              )}

              <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' }}>{t('step4.back')}</button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
