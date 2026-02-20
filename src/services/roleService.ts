import api from '../api/apiClient.js'

export const roleService = {
  list: () => api.get('/Roles'),
  create: (data: unknown) => api.post('/Roles/add', data),
  getById: (id: string) => api.get('/Roles/getRoleById', { params: { id } }),
  edit: (data: unknown) => api.post('/Roles/edit', data),
  remove: (id: string) => api.post('/Roles/delete', { id }),
}
