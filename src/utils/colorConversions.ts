import type { RGB, HSL } from '../types'

/**
 * Конвертация RGB в HSL
 * @param rgb - RGB значения (0-255)
 * @returns HSL значения (H: 0-360, S: 0-100, L: 0-100)
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Конвертация HSL в RGB
 * @param hsl - HSL значения (H: 0-360, S: 0-100, L: 0-100)
 * @returns RGB значения (0-255)
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r = 0
  let g = 0
  let b = 0

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Конвертация HEX в RGB
 * @param hex - HEX строка (#RRGGBB или RRGGBB)
 * @returns RGB значения (0-255)
 * @throws Error если HEX невалидный
 */
export function hexToRgb(hex: string): RGB {
  // Удаляем # если есть
  const cleanHex = hex.replace('#', '').toUpperCase()

  // Валидация
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid HEX color: ${hex}`)
  }

  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)

  return { r, g, b }
}

/**
 * Конвертация RGB в HEX
 * @param rgb - RGB значения (0-255)
 * @returns HEX строка (#RRGGBB)
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (value: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

/**
 * Конвертация HEX в HSL
 * @param hex - HEX строка (#RRGGBB или RRGGBB)
 * @returns HSL значения
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex)
  return rgbToHsl(rgb)
}

/**
 * Конвертация HSL в HEX
 * @param hsl - HSL значения
 * @returns HEX строка (#RRGGBB)
 */
export function hslToHex(hsl: HSL): string {
  const rgb = hslToRgb(hsl)
  return rgbToHex(rgb)
}

/**
 * Валидация RGB значений
 * @param rgb - RGB значения
 * @returns true если валидные
 */
export function validateRgb(rgb: RGB): boolean {
  return (
    typeof rgb.r === 'number' &&
    typeof rgb.g === 'number' &&
    typeof rgb.b === 'number' &&
    !isNaN(rgb.r) &&
    !isNaN(rgb.g) &&
    !isNaN(rgb.b) &&
    rgb.r >= 0 &&
    rgb.r <= 255 &&
    rgb.g >= 0 &&
    rgb.g <= 255 &&
    rgb.b >= 0 &&
    rgb.b <= 255
  )
}

/**
 * Валидация HSL значений
 * @param hsl - HSL значения
 * @returns true если валидные
 */
export function validateHsl(hsl: HSL): boolean {
  return (
    typeof hsl.h === 'number' &&
    typeof hsl.s === 'number' &&
    typeof hsl.l === 'number' &&
    !isNaN(hsl.h) &&
    !isNaN(hsl.s) &&
    !isNaN(hsl.l) &&
    hsl.h >= 0 &&
    hsl.h <= 360 &&
    hsl.s >= 0 &&
    hsl.s <= 100 &&
    hsl.l >= 0 &&
    hsl.l <= 100
  )
}

/**
 * Валидация HEX строки
 * @param hex - HEX строка
 * @returns true если валидная
 */
export function validateHex(hex: string): boolean {
  const cleanHex = hex.replace('#', '').toUpperCase()
  return /^[0-9A-F]{6}$/.test(cleanHex)
}

/**
 * Нормализация RGB значений (приведение к диапазону 0-255)
 * @param rgb - RGB значения
 * @returns Нормализованные RGB значения
 */
export function normalizeRgb(rgb: RGB): RGB {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b))),
  }
}

/**
 * Нормализация HSL значений (приведение к диапазонам)
 * @param hsl - HSL значения
 * @returns Нормализованные HSL значения
 */
export function normalizeHsl(hsl: HSL): HSL {
  return {
    h: Math.max(0, Math.min(360, Math.round(hsl.h))),
    s: Math.max(0, Math.min(100, Math.round(hsl.s))),
    l: Math.max(0, Math.min(100, Math.round(hsl.l))),
  }
}

/**
 * Нормализация HEX строки (приведение к формату #RRGGBB)
 * @param hex - HEX строка
 * @returns Нормализованная HEX строка
 * @throws Error если HEX невалидный
 */
export function normalizeHex(hex: string): string {
  const cleanHex = hex.replace('#', '').toUpperCase()
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid HEX color: ${hex}`)
  }
  return `#${cleanHex}`
}

/**
 * Парсинг RGB из строки формата "rgb(r, g, b)" или "r, g, b"
 * @param rgbString - RGB строка
 * @returns RGB значения
 * @throws Error если строка невалидная
 */
export function parseRgbString(rgbString: string): RGB {
  // Удаляем "rgb(" и ")" если есть
  const clean = rgbString.replace(/^rgb\(|\)$/gi, '').trim()
  const parts = clean.split(',').map((p) => parseInt(p.trim(), 10))

  if (parts.length !== 3 || parts.some((p) => isNaN(p))) {
    throw new Error(`Invalid RGB string: ${rgbString}`)
  }

  return normalizeRgb({ r: parts[0], g: parts[1], b: parts[2] })
}

