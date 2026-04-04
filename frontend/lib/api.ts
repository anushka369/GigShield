import axios from 'axios'
import { getToken, clearAuth, getAdminToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const token = url.includes('/admin/')
    ? (getAdminToken() ?? getToken())
    : (getToken() ?? getAdminToken())
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearAuth()
      window.location.href = '/onboarding'
    }
    return Promise.reject(err)
  }
)

export default api
