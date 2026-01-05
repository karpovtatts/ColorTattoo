import type { BrandInk } from '@/types'
import worldFamousData from './world-famous.json'
import limitlessData from './limitless.json'

// Объединение всех каталогов
export const brandInks: BrandInk[] = [
  ...(worldFamousData as BrandInk[]),
  ...(limitlessData as BrandInk[]),
]

// Экспорт по брендам
export const worldFamousInks = worldFamousData as BrandInk[]
export const limitlessInks = limitlessData as BrandInk[]

