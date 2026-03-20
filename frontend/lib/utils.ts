import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export function getDisruptionIcon(type: string): string {
  const icons: Record<string, string> = {
    rainfall: '🌧️',
    aqi: '😷',
    flood: '🌊',
    bandh: '🚫',
    outage: '📱',
  }
  return icons[type] ?? '⚠️'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    approved: '#16A34A',
    pending: '#EA580C',
    rejected: '#DC2626',
    manual_review: '#9333EA',
    active: '#16A34A',
    paused: '#EA580C',
  }
  return colors[status] ?? '#6B7280'
}

export function getStatusBg(status: string): string {
  const bg: Record<string, string> = {
    approved: '#DCFCE7',
    pending: '#FFF7ED',
    rejected: '#FEF2F2',
    manual_review: '#F3E8FF',
  }
  return bg[status] ?? '#F3F4F6'
}
