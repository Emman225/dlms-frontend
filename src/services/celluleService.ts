import api from '../api/apiClient.js'

export const celluleService = {
    list: () => api.get('/Cellule'),
}
