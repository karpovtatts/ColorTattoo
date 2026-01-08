import { createColorFromHex, isWhiteColor, isBlackColor, calculateLightness } from './colorOperations'

/**
 * Пост-обработка массива HEX цветов после квантования:
 * - исключение явных белых значений (#FFFFFF, #FEFEFD) без учета регистра,
 * - фильтрация любых белых/черных оттенков по перцептивным критериям,
 * - сортировка по светлоте (HSL L) по убыванию: от наиболее светлых к более темным,
 * - приведение HEX к верхнему регистру.
 *
 * @param hexColors - входной массив HEX-строк
 * @returns массив HEX-строк без белых/черных оттенков, отсортированный от светлого к темному
 */
export function postProcessQuantizedHexColors(hexColors: string[]): string[] {
  if (!Array.isArray(hexColors)) return []
  const EXCLUDE = new Set(['#FFFFFF', '#FEFEFD'])
  return hexColors
    .filter((h) => typeof h === 'string' && h.trim().length > 0)
    .map((h) => (h.startsWith('#') ? h : `#${h}`))
    .map((h) => h.toUpperCase())
    .filter((h) => !EXCLUDE.has(h))
    .map((hex) => createColorFromHex(hex))
    .filter((color) => !isWhiteColor(color) && !isBlackColor(color))
    .sort((a, b) => calculateLightness(b) - calculateLightness(a))
    .map((c) => c.hex.toUpperCase())
}