import api from '../api/apiClient.js'

export const userService = {
  list: () => api.get('/Users'),
  create: (data: unknown) => api.post('/Users/add', data),
  getById: (id: string) => api.get('/Users/getuserbyId', { params: { id } }),
  edit: (data: unknown) => api.post('/Users/edit', data),
  remove: (id: string) => api.post('/Users/delete', { id }),
}
