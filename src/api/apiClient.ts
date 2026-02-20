import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: false,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  const isLoginRequest = config.url?.includes('Auth/login')

  if (token && !isLoginRequest) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config

    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const token = localStorage.getItem('auth_token')
      const refreshToken = localStorage.getItem('auth_refresh_token')

      if (!token || !refreshToken) {
        isRefreshing = false
        // window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          (import.meta.env.VITE_API_BASE_URL || '/api') + '/Auth/refreshtoken',
          { token, refreshToken }
        )

        const { isSuccess, data } = response.data
        if (isSuccess && data?.token) {
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('auth_refresh_token', data.refreshToken)

          api.defaults.headers.common['Authorization'] = 'Bearer ' + data.token
          originalRequest.headers['Authorization'] = 'Bearer ' + data.token

          processQueue(null, data.token)
          return api(originalRequest)
        } else {
          processQueue(new Error('Refresh failed'), null)
          // logout user
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_refresh_token')
          window.location.href = '/'
          return Promise.reject(error)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        window.location.href = '/'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
