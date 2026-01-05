import type { RGB, HSL, CMYK, LAB } from '../types'

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

/**
 * Конвертация RGB в CMYK (субтрактивная модель для печати/красок)
 * @param rgb - RGB значения (0-255)
 * @returns CMYK значения (0-100)
 */
export function rgbToCmyk(rgb: RGB): CMYK {
  // Нормализуем RGB к 0-1
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  // Вычисляем K (черный)
  const k = 1 - Math.max(r, g, b)

  // Если K = 1, цвет полностью черный
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  // Вычисляем C, M, Y
  const c = ((1 - r - k) / (1 - k)) * 100
  const m = ((1 - g - k) / (1 - k)) * 100
  const y = ((1 - b - k) / (1 - k)) * 100

  return {
    c: Math.max(0, Math.min(100, Math.round(c))),
    m: Math.max(0, Math.min(100, Math.round(m))),
    y: Math.max(0, Math.min(100, Math.round(y))),
    k: Math.max(0, Math.min(100, Math.round(k * 100))),
  }
}

/**
 * Конвертация CMYK в RGB
 * @param cmyk - CMYK значения (0-100)
 * @returns RGB значения (0-255)
 */
export function cmykToRgb(cmyk: CMYK): RGB {
  // Нормализуем CMYK к 0-1
  const c = cmyk.c / 100
  const m = cmyk.m / 100
  const y = cmyk.y / 100
  const k = cmyk.k / 100

  // Конвертируем в RGB
  const r = (1 - Math.min(1, c * (1 - k) + k)) * 255
  const g = (1 - Math.min(1, m * (1 - k) + k)) * 255
  const b = (1 - Math.min(1, y * (1 - k) + k)) * 255

  return normalizeRgb({
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  })
}

/**
 * Конвертация RGB в XYZ (промежуточное пространство для LAB)
 * @param rgb - RGB значения (0-255)
 * @returns XYZ значения
 */
function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  // Нормализуем RGB к 0-1 и применяем гамма-коррекцию
  const normalize = (value: number) => {
    const v = value / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const r = normalize(rgb.r)
  const g = normalize(rgb.g)
  const b = normalize(rgb.b)

  // Используем стандартную матрицу sRGB -> XYZ (D65 white point)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041

  return { x, y, z }
}

/**
 * Конвертация XYZ в LAB
 * @param xyz - XYZ значения
 * @returns LAB значения
 */
function xyzToLab(xyz: { x: number; y: number; z: number }): LAB {
  // D65 white point (стандартный источник света)
  const xn = 0.95047
  const yn = 1.0
  const zn = 1.08883

  // Нормализуем относительно белой точки
  const fx = xyz.x / xn
  const fy = xyz.y / yn
  const fz = xyz.z / zn

  // Функция f для LAB
  const f = (t: number) => {
    const delta = 6 / 29
    if (t > delta * delta * delta) {
      return Math.pow(t, 1 / 3)
    }
    return t / (3 * delta * delta) + 4 / 29
  }

  const l = 116 * f(fy) - 16
  const a = 500 * (f(fx) - f(fy))
  const b = 200 * (f(fy) - f(fz))

  return {
    l: Math.max(0, Math.min(100, l)),
    a: Math.max(-128, Math.min(127, a)),
    b: Math.max(-128, Math.min(127, b)),
  }
}

/**
 * Конвертация LAB в XYZ
 * @param lab - LAB значения
 * @returns XYZ значения
 */
function labToXyz(lab: LAB): { x: number; y: number; z: number } {
  // D65 white point
  const xn = 0.95047
  const yn = 1.0
  const zn = 1.08883

  // Обратная функция f для LAB
  const fInv = (t: number) => {
    const delta = 6 / 29
    if (t > delta) {
      return t * t * t
    }
    return 3 * delta * delta * (t - 4 / 29)
  }

  const fy = (lab.l + 16) / 116
  const fx = lab.a / 500 + fy
  const fz = fy - lab.b / 200

  const x = fInv(fx) * xn
  const y = fInv(fy) * yn
  const z = fInv(fz) * zn

  return { x, y, z }
}

/**
 * Конвертация XYZ в RGB
 * @param xyz - XYZ значения
 * @returns RGB значения (0-255)
 */
function xyzToRgb(xyz: { x: number; y: number; z: number }): RGB {
  // Матрица XYZ -> sRGB (D65)
  let r = xyz.x * 3.2404542 + xyz.y * -1.5371385 + xyz.z * -0.4985314
  let g = xyz.x * -0.969266 + xyz.y * 1.8760108 + xyz.z * 0.041556
  let b = xyz.x * 0.0556434 + xyz.y * -0.2040259 + xyz.z * 1.0572252

  // Обратная гамма-коррекция
  const gammaCorrection = (value: number) => {
    if (value <= 0.0031308) {
      return 12.92 * value
    }
    return 1.055 * Math.pow(value, 1 / 2.4) - 0.055
  }

  r = gammaCorrection(r) * 255
  g = gammaCorrection(g) * 255
  b = gammaCorrection(b) * 255

  return normalizeRgb({
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  })
}

/**
 * Конвертация RGB в LAB (через XYZ)
 * @param rgb - RGB значения (0-255)
 * @returns LAB значения
 */
export function rgbToLab(rgb: RGB): LAB {
  const xyz = rgbToXyz(rgb)
  return xyzToLab(xyz)
}

/**
 * Конвертация LAB в RGB (через XYZ)
 * @param lab - LAB значения
 * @returns RGB значения (0-255)
 */
export function labToRgb(lab: LAB): RGB {
  const xyz = labToXyz(lab)
  return xyzToRgb(xyz)
}

