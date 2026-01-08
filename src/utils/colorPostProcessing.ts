import type { Color } from '../types'
import {
  createColorFromHex,
  isWhiteColor,
  isBlackColor,
  calculateLightness,
  deltaE,
} from './colorOperations'

/**
 * Группирует визуально похожие цвета вместе, используя метрику Delta E.
 * Улучшенный алгоритм: сравнивает каждый цвет с ближайшим цветом в каждом кластере,
 * а не только с первым, что дает более точную группировку.
 * 
 * @param colors - Массив объектов Color для кластеризации
 * @param threshold - Порог Delta E. Цвета с разницей меньше этого значения считаются похожими
 * @returns Массив кластеров, где каждый кластер - это массив объектов Color
 */
function clusterSimilarColors(colors: Color[], threshold: number): Color[][] {
  if (colors.length === 0) return []
  if (colors.length === 1) return [[colors[0]]]

  const clusters: Color[][] = []

  colors.forEach((color) => {
    // Убеждаемся, что LAB вычислен
    if (!color.lab) {
      console.warn('Color missing LAB values, skipping:', color.hex)
      return
    }

    let bestCluster: Color[] | null = null
    let minDistance = Infinity

    // Ищем кластер с минимальным расстоянием до любого цвета в нем
    for (const cluster of clusters) {
      for (const clusterColor of cluster) {
        if (!clusterColor.lab) continue
        const distance = deltaE(color.lab, clusterColor.lab)
        if (distance < minDistance && distance < threshold) {
          minDistance = distance
          bestCluster = cluster
        }
      }
    }

    // Если нашли подходящий кластер, добавляем цвет туда
    if (bestCluster) {
      bestCluster.push(color)
    } else {
      // Иначе создаем новый кластер
      clusters.push([color])
    }
  })

  return clusters
}

/**
 * Из каждого кластера цветов выбирает репрезентативные цвета.
 * 
 * Стратегия выбора (с учетом требований пользователя):
 * - Если в кластере 1 цвет: возвращаем его
 * - Если в кластере 2-3 цвета: выбираем самый темный и самый светлый
 * - Если в кластере 4+ цвета: выбираем:
 *   1. Самый темный (для затемнения)
 *   2. Самый светлый (для осветления)
 *   3. Самый насыщенный/чистый (базовый цвет)
 *   4. Самый ненасыщенный/грязный (если есть)
 * 
 * @param clusters - Массив кластеров цветов
 * @returns Массив репрезентативных цветов (может быть больше, чем кластеров)
 */
function getRepresentativeColors(clusters: Color[][]): Color[] {
  const representatives: Color[] = []

  clusters.forEach((cluster) => {
    if (cluster.length === 0) return

    if (cluster.length === 1) {
      // Один цвет - просто возвращаем его
      representatives.push(cluster[0])
      return
    }

    // Для нескольких цветов выбираем репрезентативные
    const sortedByLightness = [...cluster].sort(
      (a, b) => calculateLightness(a) - calculateLightness(b)
    )
    const sortedBySaturation = [...cluster].sort(
      (a, b) => b.hsl.s - a.hsl.s
    )

    const selected = new Set<Color>()

    // Всегда берем самый темный
    selected.add(sortedByLightness[0])

    // Всегда берем самый светлый (если он отличается)
    if (sortedByLightness.length > 1) {
      selected.add(sortedByLightness[sortedByLightness.length - 1])
    }

    // Если в кластере 4+ цвета, берем также самый насыщенный (чистый/базовый)
    if (cluster.length >= 4) {
      selected.add(sortedBySaturation[0]) // Самый насыщенный

      // И самый ненасыщенный (грязный), если он отличается
      if (sortedBySaturation.length > 1) {
        const leastSaturated = sortedBySaturation[sortedBySaturation.length - 1]
        // Добавляем только если он действительно менее насыщенный
        if (leastSaturated.hsl.s < sortedBySaturation[0].hsl.s - 10) {
          selected.add(leastSaturated)
        }
      }
    } else if (cluster.length === 3) {
      // Для 3 цветов: темный, светлый, и средний по насыщенности
      const middleSaturation = sortedBySaturation[Math.floor(sortedBySaturation.length / 2)]
      selected.add(middleSaturation)
    }

    // Добавляем все выбранные цвета
    selected.forEach((color) => representatives.push(color))
  })

  return representatives
}

/**
 * Пост-обработка массива HEX цветов после квантования:
 * 1. Фильтрует пустые строки и приводит HEX к верхнему регистру.
 * 2. Конвертирует HEX в объекты Color (с автоматическим вычислением LAB).
 * 3. Фильтрует белые и черные цвета по перцептивным критериям.
 * 4. Группирует (кластеризует) визуально похожие цвета по Delta E.
 * 5. Выбирает репрезентативные цвета из каждой группы (темный, светлый, чистый, грязный).
 * 6. Сортирует финальный набор по светлоте (от светлого к темному).
 *
 * @param hexColors - входной массив HEX-строк
 * @param similarityThreshold - Порог Delta E для группировки похожих цветов (по умолчанию 12)
 * @returns массив HEX-строк, представляющий собой компактную и осмысленную палитру
 */
export function postProcessQuantizedHexColors(
  hexColors: string[],
  similarityThreshold: number = 12
): string[] {
  if (!Array.isArray(hexColors)) return []

  // 1-3. Начальная подготовка и фильтрация
  const initialColors: Color[] = []
  for (const h of hexColors) {
    if (typeof h !== 'string' || h.trim().length === 0) continue

    try {
      const normalizedHex = h.startsWith('#') ? h : `#${h}`
      const color = createColorFromHex(normalizedHex.toUpperCase())

      // Убеждаемся, что LAB вычислен
      if (!color.lab) {
        console.warn('Failed to compute LAB for color:', color.hex)
        continue
      }

      // Фильтруем белые и черные
      if (!isWhiteColor(color) && !isBlackColor(color)) {
        initialColors.push(color)
      }
    } catch (error) {
      console.warn('Failed to process color:', h, error)
    }
  }

  if (initialColors.length === 0) return []

  // 4. Кластеризация
  const colorClusters = clusterSimilarColors(initialColors, similarityThreshold)

  // 5. Выбор репрезентативных цветов
  const representativeColors = getRepresentativeColors(colorClusters)

  // 6. Финальная сортировка и форматирование
  return representativeColors
    .sort((a, b) => calculateLightness(b) - calculateLightness(a))
    .map((c) => c.hex.toUpperCase())
}
