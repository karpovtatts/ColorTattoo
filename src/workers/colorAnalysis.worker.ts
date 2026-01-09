/**
 * Web Worker для анализа цветов
 * Выполняет тяжелые операции квантования и пост-обработки в отдельном потоке
 */

// Импортируем типы
import type { PixelData } from '../utils/imageProcessor'
import type { Color, SelectionMethod } from '../types'

// ============================================================================
// ЦВЕТОВЫЕ КОНВЕРСИИ (из colorConversions.ts)
// ============================================================================

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

interface LAB {
  l: number
  a: number
  b: number
}

function normalizeRgb(rgb: RGB): RGB {
  return {
    r: Math.max(0, Math.min(255, Math.round(rgb.r))),
    g: Math.max(0, Math.min(255, Math.round(rgb.g))),
    b: Math.max(0, Math.min(255, Math.round(rgb.b))),
  }
}

function rgbToHex(rgb: RGB): string {
  const toHex = (value: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, value))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '').toUpperCase()
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) {
    throw new Error(`Invalid HEX color: ${hex}`)
  }
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return { r, g, b }
}

function rgbToHsl(rgb: RGB): HSL {
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

function rgbToXyz(rgb: RGB): { x: number; y: number; z: number } {
  const normalize = (value: number) => {
    const v = value / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }

  const r = normalize(rgb.r)
  const g = normalize(rgb.g)
  const b = normalize(rgb.b)

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041

  return { x, y, z }
}

function xyzToLab(xyz: { x: number; y: number; z: number }): LAB {
  const xn = 0.95047
  const yn = 1.0
  const zn = 1.08883

  const fx = xyz.x / xn
  const fy = xyz.y / yn
  const fz = xyz.z / zn

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

function rgbToLab(rgb: RGB): LAB {
  const xyz = rgbToXyz(rgb)
  return xyzToLab(xyz)
}

// ============================================================================
// КВАНТИЗАЦИЯ (из quantizer.ts)
// ============================================================================

const MAX_ITERATIONS = 20
const CONVERGENCE_THRESHOLD = 1

function colorDistance(color1: PixelData, color2: PixelData): number {
  const dr = color1.r - color2.r
  const dg = color1.g - color2.g
  const db = color1.b - color2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function initializeCentroids(pixels: PixelData[], k: number): PixelData[] {
  const centroids: PixelData[] = []
  const usedIndices = new Set<number>()

  for (let i = 0; i < k && centroids.length < pixels.length; i++) {
    let index: number
    do {
      index = Math.floor(Math.random() * pixels.length)
    } while (usedIndices.has(index))

    usedIndices.add(index)
    centroids.push({ ...pixels[index] })
  }

  while (centroids.length < k) {
    centroids.push({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    })
  }

  return centroids
}

function assignPixelsToClusters(
  pixels: PixelData[],
  centroids: PixelData[]
): number[] {
  const assignments: number[] = []

  for (const pixel of pixels) {
    let nearestIndex = 0
    let minDistance = colorDistance(pixel, centroids[0])

    for (let i = 1; i < centroids.length; i++) {
      const distance = colorDistance(pixel, centroids[i])
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    assignments.push(nearestIndex)
  }

  return assignments
}

function updateCentroids(
  pixels: PixelData[],
  assignments: number[],
  k: number
): PixelData[] {
  const newCentroids: PixelData[] = []
  const clusterSums: Array<{ r: number; g: number; b: number; count: number }> =
    Array(k)
      .fill(null)
      .map(() => ({ r: 0, g: 0, b: 0, count: 0 }))

  for (let i = 0; i < pixels.length; i++) {
    const clusterIndex = assignments[i]
    const cluster = clusterSums[clusterIndex]
    cluster.r += pixels[i].r
    cluster.g += pixels[i].g
    cluster.b += pixels[i].b
    cluster.count++
  }

  for (let i = 0; i < k; i++) {
    const cluster = clusterSums[i]
    if (cluster.count > 0) {
      newCentroids.push({
        r: Math.round(cluster.r / cluster.count),
        g: Math.round(cluster.g / cluster.count),
        b: Math.round(cluster.b / cluster.count),
      })
    } else {
      newCentroids.push({
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      })
    }
  }

  return newCentroids
}

function hasConverged(
  oldCentroids: PixelData[],
  newCentroids: PixelData[],
  threshold: number = CONVERGENCE_THRESHOLD
): boolean {
  for (let i = 0; i < oldCentroids.length; i++) {
    const distance = colorDistance(oldCentroids[i], newCentroids[i])
    if (distance > threshold) {
      return false
    }
  }
  return true
}

function quantizeColors(
  pixels: PixelData[],
  k: number
): Array<{ hex: string; population: number }> {
  if (pixels.length === 0) {
    throw new Error('Массив пикселей пуст')
  }

  if (k <= 0) {
    throw new Error('Количество цветов должно быть больше 0')
  }

  if (k > pixels.length) {
    const uniqueColors = new Map<string, { pixel: PixelData; count: number }>()
    for (const pixel of pixels) {
      const key = `${pixel.r},${pixel.g},${pixel.b}`
      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, { pixel, count: 1 })
      } else {
        uniqueColors.get(key)!.count++
      }
    }
    return Array.from(uniqueColors.values()).map(({ pixel, count }) => ({
      hex: rgbToHex(normalizeRgb({ r: pixel.r, g: pixel.g, b: pixel.b })),
      population: count,
    }))
  }

  let centroids = initializeCentroids(pixels, k)
  let lastAssignments: number[] = []

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const assignments = assignPixelsToClusters(pixels, centroids)
    const newCentroids = updateCentroids(pixels, assignments, k)

    if (hasConverged(centroids, newCentroids)) {
      centroids = newCentroids
      lastAssignments = assignments
      break
    }

    centroids = newCentroids
    lastAssignments = assignments
  }

  const clusterPopulations = new Array<number>(k).fill(0)
  for (const assignment of lastAssignments) {
    clusterPopulations[assignment]++
  }

  const colors = centroids.map((centroid, index) => ({
    hex: rgbToHex(normalizeRgb({ r: centroid.r, g: centroid.g, b: centroid.b })),
    population: clusterPopulations[index],
  }))

  return colors
}

// ============================================================================
// ПОСТ-ОБРАБОТКА (из colorPostProcessing.ts)
// ============================================================================

function calculateLightness(color: Color): number {
  return color.hsl.l
}

function deltaE(lab1: LAB, lab2: LAB): number {
  const K_L = 1
  const K_C = 1
  const K_H = 1

  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)

  const delta_L_prime = lab2.l - lab1.l
  const C_bar = (C1 + C2) / 2

  const G =
    0.5 *
    (1 -
      Math.sqrt(
        Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))
      ))

  const a1_prime = (1 + G) * lab1.a
  const a2_prime = (1 + G) * lab2.a

  const C1_prime = Math.sqrt(a1_prime * a1_prime + lab1.b * lab1.b)
  const C2_prime = Math.sqrt(a2_prime * a2_prime + lab2.b * lab2.b)

  const delta_C_prime = C2_prime - C1_prime

  let h1_prime = Math.atan2(lab1.b, a1_prime) * (180 / Math.PI)
  if (h1_prime < 0) h1_prime += 360

  let h2_prime = Math.atan2(lab2.b, a2_prime) * (180 / Math.PI)
  if (h2_prime < 0) h2_prime += 360

  let delta_h_prime = 0
  if (C1_prime * C2_prime !== 0) {
    const diff = Math.abs(h1_prime - h2_prime)
    if (diff <= 180) {
      delta_h_prime = h2_prime - h1_prime
    } else if (h2_prime <= h1_prime) {
      delta_h_prime = h2_prime - h1_prime + 360
    } else {
      delta_h_prime = h2_prime - h1_prime - 360
    }
  }

  const delta_H_prime =
    2 *
    Math.sqrt(C1_prime * C2_prime) *
    Math.sin((delta_h_prime * Math.PI) / 180 / 2)

  const H_bar_prime =
    Math.abs(h1_prime - h2_prime) > 180
      ? (h1_prime + h2_prime + 360) / 2
      : (h1_prime + h2_prime) / 2

  const T =
    1 -
    0.17 * Math.cos(((H_bar_prime - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * H_bar_prime * Math.PI) / 180) +
    0.32 * Math.cos(((3 * H_bar_prime + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * H_bar_prime - 63) * Math.PI) / 180)

  const S_L =
    1 +
    (0.015 * Math.pow(lab1.l - 50, 2)) /
      Math.sqrt(20 + Math.pow(lab1.l - 50, 2))
  const S_C = 1 + 0.045 * C_bar
  const S_H = 1 + 0.015 * C_bar * T

  const R_T =
    -2 *
    Math.sqrt(Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))) *
    Math.sin(
      ((60 * Math.exp(-Math.pow((H_bar_prime - 275) / 25, 2))) * Math.PI) /
        180
    )

  const L_term = delta_L_prime / (K_L * S_L)
  const C_term = delta_C_prime / (K_C * S_C)
  const H_term = delta_H_prime / (K_H * S_H)

  return Math.sqrt(
    L_term * L_term +
      C_term * C_term +
      H_term * H_term +
      R_T * C_term * H_term
  )
}

function createColorFromHex(
  hex: string,
  id?: string,
  name?: string,
  population?: number
): Color {
  const rgb = hexToRgb(hex)
  const normalizedRgb = normalizeRgb(rgb)
  const hsl = rgbToHsl(normalizedRgb)
  const lab = rgbToLab(normalizedRgb)

  return {
    id: id || `color-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    rgb: normalizedRgb,
    hsl,
    hex: hex.toUpperCase(),
    lab,
    population,
  }
}

function analyzeColorTemperature(color: Color): {
  isWarm: boolean
  isCool: boolean
  isNeutral: boolean
  temperature: number
  explanation: string
} {
  const hue = color.hsl.h
  const saturation = color.hsl.s

  const NEUTRAL_SATURATION_THRESHOLD = 20

  if (saturation < NEUTRAL_SATURATION_THRESHOLD) {
    return {
      isWarm: false,
      isCool: false,
      isNeutral: true,
      temperature: 0,
      explanation: 'Цвет нейтральный, близок к серому. Низкая насыщенность делает цвет бесцветным.',
    }
  }

  let isWarm = false
  let isCool = false
  let temperature = 0

  const WARM_HUE_END = 90
  if (hue >= 270 || hue <= WARM_HUE_END) {
    isWarm = true
    if (hue >= 270) {
      temperature = 0.5 + ((hue - 270) / 90) * 0.5
    } else {
      temperature = 1.0 - (hue / WARM_HUE_END) * 0.7
    }
    temperature = Math.max(0.3, Math.min(1.0, temperature))
  } else {
    isCool = true
    const distanceFromCenter = Math.abs(hue - 180)
    temperature = -(1.0 - (distanceFromCenter / 90) * 0.5)
    temperature = Math.max(-1.0, Math.min(-0.5, temperature))
  }

  let explanation = ''
  if (isWarm) {
    if (hue >= 330 || hue <= 30) {
      explanation = 'Цвет теплый, с преобладанием красных оттенков.'
    } else if (hue > 30 && hue <= 60) {
      explanation = 'Цвет теплый, с преобладанием оранжевых оттенков.'
    } else if (hue > 60 && hue <= 90) {
      explanation = 'Цвет теплый, с преобладанием желтых оттенков.'
    } else {
      explanation = 'Цвет теплый, с преобладанием красно-фиолетовых оттенков.'
    }
  } else if (isCool) {
    if (hue >= 90 && hue < 150) {
      explanation = 'Цвет холодный, с преобладанием зеленых оттенков.'
    } else if (hue >= 150 && hue < 210) {
      explanation = 'Цвет холодный, с преобладанием синих оттенков.'
    } else {
      explanation = 'Цвет холодный, с преобладанием фиолетовых оттенков.'
    }
  }

  return {
    isWarm,
    isCool,
    isNeutral: !isWarm && !isCool,
    temperature,
    explanation,
  }
}

function clusterSimilarColors(colors: Color[], threshold: number): Color[][] {
  if (colors.length === 0) return []
  if (colors.length === 1) return [[colors[0]]]

  const clusters: Color[][] = []

  colors.forEach((color) => {
    if (!color.lab) {
      return
    }

    let bestCluster: Color[] | null = null
    let minDistance = Infinity

    for (const cluster of clusters) {
      for (const clusterColor of cluster) {
        if (!clusterColor.lab) continue
        const distance = deltaE(color.lab, clusterColor.lab)
        if (distance < threshold && distance < minDistance) {
          minDistance = distance
          bestCluster = cluster
        }
      }
    }

    if (bestCluster) {
      bestCluster.push(color)
    } else {
      clusters.push([color])
    }
  })

  return clusters
}

function getRepresentativeColors(clusters: Color[][]): Color[] {
  const representatives: Color[] = []

  clusters.forEach((cluster) => {
    if (cluster.length === 0) return

    if (cluster.length === 1) {
      representatives.push(cluster[0])
      return
    }

    const sortedByLightness = [...cluster].sort(
      (a, b) => calculateLightness(a) - calculateLightness(b)
    )
    const sortedBySaturation = [...cluster].sort(
      (a, b) => b.hsl.s - a.hsl.s
    )

    const temperatures = cluster.map((c) => analyzeColorTemperature(c))
    const hasWarm = temperatures.some((t) => t.isWarm)
    const hasCool = temperatures.some((t) => t.isCool)
    const hasBothTemperatures = hasWarm && hasCool

    const sortedByTemperature = [...cluster].sort((a, b) => {
      const tempA = analyzeColorTemperature(a)
      const tempB = analyzeColorTemperature(b)
      return tempA.temperature - tempB.temperature
    })

    const selected = new Set<Color>()

    selected.add(sortedByLightness[0])

    if (sortedByLightness.length > 1) {
      selected.add(sortedByLightness[sortedByLightness.length - 1])
    }

    const mostSaturated = sortedBySaturation[0]
    selected.add(mostSaturated)

    if (cluster.length >= 4) {
      if (hasBothTemperatures) {
        selected.add(sortedByTemperature[0])
        selected.add(sortedByTemperature[sortedByTemperature.length - 1])
      } else {
        if (sortedByTemperature.length > 1) {
          const coolest = sortedByTemperature[0]
          const warmest = sortedByTemperature[sortedByTemperature.length - 1]

          if (coolest !== mostSaturated) {
            selected.add(coolest)
          }
          if (warmest !== mostSaturated && warmest !== coolest) {
            selected.add(warmest)
          }
        }
      }

      if (sortedBySaturation.length > 1) {
        const leastSaturated = sortedBySaturation[sortedBySaturation.length - 1]
        if (leastSaturated.hsl.s < mostSaturated.hsl.s - 15) {
          selected.add(leastSaturated)
        }
      }
    }

    selected.forEach((color) => representatives.push(color))
  })

  return representatives
}

function getDominantRepresentativeFromClusters(clusters: Color[][]): Color[] {
  return clusters
    .filter((cluster) => cluster.length > 0)
    .map((cluster) => {
      if (cluster.length === 1) {
        return cluster[0]
      }
      return [...cluster].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0]
    })
}

function sortColorsForPresentation(
  colors: Color[],
  achromaticThreshold: number
): Color[] {
  const chromaticColors: Color[] = []
  const achromaticColors: Color[] = []

  for (const color of colors) {
    if (color.hsl.s < achromaticThreshold) {
      achromaticColors.push(color)
    } else {
      chromaticColors.push(color)
    }
  }

  chromaticColors.sort((a, b) => {
    if (Math.abs(a.hsl.h - b.hsl.h) > 10) {
      return a.hsl.h - b.hsl.h
    }
    return b.hsl.l - a.hsl.l
  })

  achromaticColors.sort((a, b) => b.hsl.l - a.hsl.l)

  return [...chromaticColors, ...achromaticColors]
}

function postProcessQuantizedHexColors(
  colorData: Array<{ hex: string; population: number }> | string[],
  method: SelectionMethod = 'representative',
  similarityThreshold: number = 20,
  achromaticThreshold: number = 10
): string[] {
  if (!Array.isArray(colorData)) return []

  const EXCLUDED_WHITES = new Set([
    '#FFFFFF',
    '#FEFEFD',
    '#FEFEFE',
    '#FDFDFD',
    '#FCFCFC',
    '#FBFBFB',
    '#FAFAFA',
  ])

  const EXCLUDED_BLACKS = new Set([
    '#000000',
    '#000001',
    '#010101',
    '#020202',
    '#030303',
    '#040404',
    '#050505',
  ])

  const normalizedData: Array<{ hex: string; population?: number }> =
    colorData.map((item) => {
      if (typeof item === 'string') {
        return { hex: item }
      }
      return item
    })

  const initialColors: Color[] = []
  for (const item of normalizedData) {
    const h = item.hex
    if (typeof h !== 'string' || h.trim().length === 0) continue

    try {
      const normalizedHex = h.startsWith('#') ? h : `#${h}`
      const upperHex = normalizedHex.toUpperCase()

      if (EXCLUDED_WHITES.has(upperHex) || EXCLUDED_BLACKS.has(upperHex)) {
        continue
      }

      const color = createColorFromHex(upperHex, undefined, undefined, item.population)

      if (!color.lab) {
        continue
      }

      const isWhite = color.hsl.l >= 94 || (color.hsl.l > 80 && color.hsl.s < 15)
      const isBlack = color.hsl.l < 6 || (color.hsl.l < 18 && color.hsl.s < 12)

      if (!isWhite && !isBlack) {
        initialColors.push(color)
      }
    } catch (error) {
      // Пропускаем невалидные цвета
    }
  }

  if (initialColors.length === 0) return []

  const colorClusters = clusterSimilarColors(initialColors, similarityThreshold)

  let representativeColors: Color[]
  if (method === 'dominant') {
    representativeColors = getDominantRepresentativeFromClusters(colorClusters)
  } else {
    representativeColors = getRepresentativeColors(colorClusters)
  }

  const sortedColors = sortColorsForPresentation(representativeColors, achromaticThreshold)

  return sortedColors.map((c) => c.hex.toUpperCase())
}

// ============================================================================
// ОБРАБОТКА СООБЩЕНИЙ ОТ ГЛАВНОГО ПОТОКА
// ============================================================================

interface AnalyzeMessage {
  type: 'analyze'
  pixels: PixelData[]
  colorCount: number
  selectionMethod: SelectionMethod
  similarityThreshold: number
  achromaticThreshold: number
}

interface AnalyzeResponse {
  type: 'analyze-result'
  colors: string[]
  error?: string
}

self.onmessage = function (e: MessageEvent<AnalyzeMessage>) {
  const { type, pixels, colorCount, selectionMethod, similarityThreshold, achromaticThreshold } = e.data

  if (type === 'analyze') {
    try {
      // Квантование
      const quantizedColors = quantizeColors(pixels, colorCount)

      // Пост-обработка
      const cleanedColors = postProcessQuantizedHexColors(
        quantizedColors,
        selectionMethod,
        similarityThreshold,
        achromaticThreshold
      )

      const response: AnalyzeResponse = {
        type: 'analyze-result',
        colors: cleanedColors,
      }

      self.postMessage(response)
    } catch (error) {
      const response: AnalyzeResponse = {
        type: 'analyze-result',
        colors: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      self.postMessage(response)
    }
  }
}

