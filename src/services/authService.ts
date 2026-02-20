import api from '../api/apiClient.js'

const meEndpoint = (import.meta as any).env?.VITE_ME_ENDPOINT || '/Auth/me'

export const authService = {
  me: () => api.get(meEndpoint),
  getCurrent: () => api.get('/Auth/getcurrentuser'),
  refreshToken: (token: string, refreshToken: string) =>
    api.post('/Auth/refreshtoken', { token, refreshToken }),
  changePassword: (data: any) => api.post('/Auth/change-password', data),
}
