import axios from 'axios'
import type {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueueItem {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

interface RefreshTokenResponse {
  accessToken: string
}

// ─── Instance ─────────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL as string,
  withCredentials: true, // gửi httpOnly cookie tự động
})

// ─── Refresh state ────────────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((item) => {
    error ? item.reject(error) : item.resolve(token as string)
  })
  failedQueue = []
}

// ─── Request interceptor — gắn access token ──────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// ─── Response interceptor — tự refresh khi 401 ───────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const accessToken = localStorage.getItem('access_token')

    // Chỉ refresh nếu: status 401, chưa retry, và đang có access token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      accessToken
    ) {
      originalRequest._retry = true

      // Nếu đang refresh rồi → xếp hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            },
            reject: (err: unknown) => reject(err),
          })
        })
      }

      isRefreshing = true

      try {
        const res = await apiClient.post<RefreshTokenResponse>('/auth/refresh-token')
        const newAccessToken = res.data.accessToken
        localStorage.setItem('access_token', newAccessToken)
        processQueue(null, newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    // Không đủ điều kiện refresh → trả lỗi gốc
    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
