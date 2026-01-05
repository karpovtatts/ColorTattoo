import type { PixelData } from './imageProcessor'
import { rgbToHex, normalizeRgb } from './colorConversions'

/**
 * Алгоритм K-means для квантования цветов
 */

const MAX_ITERATIONS = 20 // Максимальное количество итераций
const CONVERGENCE_THRESHOLD = 1 // Порог сходимости (изменение центроидов)

/**
 * Вычисление евклидова расстояния между двумя RGB цветами
 */
function colorDistance(color1: PixelData, color2: PixelData): number {
  const dr = color1.r - color2.r
  const dg = color1.g - color2.g
  const db = color1.b - color2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Инициализация центроидов методом случайной выборки
 */
function initializeCentroids(
  pixels: PixelData[],
  k: number
): PixelData[] {
  const centroids: PixelData[] = []
  const usedIndices = new Set<number>()

  // Выбираем k случайных пикселей в качестве начальных центроидов
  for (let i = 0; i < k && centroids.length < pixels.length; i++) {
    let index: number
    do {
      index = Math.floor(Math.random() * pixels.length)
    } while (usedIndices.has(index))

    usedIndices.add(index)
    centroids.push({ ...pixels[index] })
  }

  // Если не удалось выбрать достаточно уникальных пикселей, дополняем случайными цветами
  while (centroids.length < k) {
    centroids.push({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    })
  }

  return centroids
}

/**
 * Назначение пикселей ближайшим центроидам
 */
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

/**
 * Пересчет центроидов как среднее значение пикселей в кластере
 */
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

  // Суммируем цвета в каждом кластере
  for (let i = 0; i < pixels.length; i++) {
    const clusterIndex = assignments[i]
    const cluster = clusterSums[clusterIndex]
    cluster.r += pixels[i].r
    cluster.g += pixels[i].g
    cluster.b += pixels[i].b
    cluster.count++
  }

  // Вычисляем среднее значение для каждого кластера
  for (let i = 0; i < k; i++) {
    const cluster = clusterSums[i]
    if (cluster.count > 0) {
      newCentroids.push({
        r: Math.round(cluster.r / cluster.count),
        g: Math.round(cluster.g / cluster.count),
        b: Math.round(cluster.b / cluster.count),
      })
    } else {
      // Если кластер пуст, оставляем предыдущий центроид или случайный цвет
      newCentroids.push({
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      })
    }
  }

  return newCentroids
}

/**
 * Проверка сходимости алгоритма
 */
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

/**
 * Квантование цветов изображения методом K-means
 * @param pixels - Массив пикселей изображения
 * @param k - Количество цветов для извлечения (количество кластеров)
 * @returns Массив доминирующих цветов в формате HEX
 */
export function quantizeColors(pixels: PixelData[], k: number): string[] {
  if (pixels.length === 0) {
    throw new Error('Массив пикселей пуст')
  }

  if (k <= 0) {
    throw new Error('Количество цветов должно быть больше 0')
  }

  if (k > pixels.length) {
    // Если запрошено больше цветов, чем пикселей, возвращаем уникальные цвета
    const uniqueColors = new Map<string, PixelData>()
    for (const pixel of pixels) {
      const key = `${pixel.r},${pixel.g},${pixel.b}`
      if (!uniqueColors.has(key)) {
        uniqueColors.set(key, pixel)
      }
    }
    return Array.from(uniqueColors.values()).map((p) =>
      rgbToHex(normalizeRgb({ r: p.r, g: p.g, b: p.b }))
    )
  }

  // Инициализация центроидов
  let centroids = initializeCentroids(pixels, k)

  // Итерации алгоритма K-means
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Назначение пикселей ближайшим центроидам
    const assignments = assignPixelsToClusters(pixels, centroids)

    // Пересчет центроидов
    const newCentroids = updateCentroids(pixels, assignments, k)

    // Проверка сходимости
    if (hasConverged(centroids, newCentroids)) {
      centroids = newCentroids
      break
    }

    centroids = newCentroids
  }

  // Конвертируем центроиды в HEX
  const colors = centroids.map((centroid) =>
    rgbToHex(normalizeRgb({ r: centroid.r, g: centroid.g, b: centroid.b }))
  )

  return colors
}

