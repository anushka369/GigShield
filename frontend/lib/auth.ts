const TOKEN_KEY = 'aegisync_token'
const ADMIN_TOKEN_KEY = 'aegisync_admin_token'

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null

export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)

export const clearAuth = () => localStorage.removeItem(TOKEN_KEY)

export const getAdminToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null

export const setAdminToken = (t: string) => localStorage.setItem(ADMIN_TOKEN_KEY, t)

export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY)

export const isAuthenticated = () => !!getToken()
