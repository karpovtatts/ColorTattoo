// Базовый API сервис
// В MVP может использоваться localStorage, но структура для будущего backend API

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // В будущем здесь будут методы для работы с API
  // Пока используется localStorage напрямую в сервисах
}

export const apiService = new ApiService()

