import api from './apiClient'

export type CodeObis = {
    id: number
    category: string
    code1: string
    value: string
    code2: string
    unit: string | null
}

export type ApiResult<T> = {
    isSuccess: boolean
    message: string
    data: T
}

export const codeObisApi = {
    async list() {
        const { data } = await api.get<ApiResult<CodeObis[]>>('/CodeObis')
        return data
    },
}
