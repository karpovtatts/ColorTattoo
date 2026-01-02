// Базовый API сервис
// В MVP может использоваться localStorage, но структура для будущего backend API

const API_BASE_URL = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL || ''

export class ApiService {
  constructor(private baseUrl: string = API_BASE_URL) {
    // В будущем здесь будут методы для работы с API
    // Пока используется localStorage напрямую в сервисах
    // baseUrl будет использоваться в будущих методах API
  }

  // Метод для получения baseUrl (для будущего использования)
  getBaseUrl(): string {
    return this.baseUrl
  }
}

export const apiService = new ApiService()

