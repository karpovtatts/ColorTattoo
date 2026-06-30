import type { Color } from '@/types'
import { analyzeColorTemperature } from '@/services/colorAnalysis'

export function getTemperatureLabel(color: Color): { label: string; key: 'warm' | 'cool' | 'neutral' } {
  const temp = analyzeColorTemperature(color)
  if (temp.isWarm) return { label: 'Тёплый', key: 'warm' }
  if (temp.isCool) return { label: 'Холодный', key: 'cool' }
  return { label: 'Нейтральный', key: 'neutral' }
}

export function getSaturationLabel(color: Color): { label: string; key: 'rich' | 'muted' | 'achromatic' } {
  const s = color.hsl.s
  if (s > 50) return { label: 'Насыщенный', key: 'rich' }
  if (s >= 15) return { label: 'Приглушённый', key: 'muted' }
  return { label: 'Нейтральный', key: 'achromatic' }
}

export function getLightnessLabel(color: Color): { label: string; key: 'light' | 'mid' | 'dark' } {
  const l = color.hsl.l
  if (l > 65) return { label: 'Светлый', key: 'light' }
  if (l >= 35) return { label: 'Средний', key: 'mid' }
  return { label: 'Тёмный', key: 'dark' }
}
