import type { Color } from '../types'
import {
  createColorFromHex,
  calculateLightness,
  deltaE,
} from './colorOperations'
import { analyzeColorTemperature } from '../services/colorAnalysis'

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
    // Важно: проверяем ВСЕ цвета во ВСЕХ кластерах, чтобы гарантированно найти похожие
    for (const cluster of clusters) {
      for (const clusterColor of cluster) {
        if (!clusterColor.lab) continue
        const distance = deltaE(color.lab, clusterColor.lab)
        // Находим кластер с минимальным расстоянием, которое меньше порога
        if (distance < threshold && distance < minDistance) {
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
 * Универсальная стратегия выбора для ЛЮБЫХ цветов:
 * - Если в кластере 1 цвет: возвращаем его
 * - Если в кластере 2-3 цвета: выбираем самый темный и самый светлый
 * - Если в кластере 4+ цвета: выбираем:
 *   1. Самый темный (для затемнения)
 *   2. Самый светлый (для осветления)
 *   3. Самый насыщенный/чистый (базовый цвет) - "ближний к базовому"
 *   4. Самый холодный и самый теплый (если есть температурные вариации)
 *   5. Самый ненасыщенный/грязный (если сильно отличается)
 * 
 * Логика колористики (универсальная для всех цветов):
 * - Для ЛЮБОЙ группы похожих цветов: самый темный + базовый (самый насыщенный)
 * - Для ЛЮБОЙ группы: если есть температурные вариации - самый холодный и самый теплый
 * - Цель: чтобы можно было смешиванием собрать любую палитру из выбранных цветов
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

    // Анализируем температуру цветов в кластере
    const temperatures = cluster.map((c) => analyzeColorTemperature(c))
    const hasWarm = temperatures.some((t) => t.isWarm)
    const hasCool = temperatures.some((t) => t.isCool)
    const hasBothTemperatures = hasWarm && hasCool

    // Сортируем по температуре для выбора холодного/теплого
    const sortedByTemperature = [...cluster].sort((a, b) => {
      const tempA = analyzeColorTemperature(a)
      const tempB = analyzeColorTemperature(b)
      return tempA.temperature - tempB.temperature // От холодного к теплому
    })

    const selected = new Set<Color>()

    // Всегда берем самый темный (для затемнения)
    selected.add(sortedByLightness[0])

    // Всегда берем самый светлый (если он отличается)
    if (sortedByLightness.length > 1) {
      selected.add(sortedByLightness[sortedByLightness.length - 1])
    }

    // Всегда берем самый насыщенный (базовый/чистый цвет) - "ближний к базовому"
    const mostSaturated = sortedBySaturation[0]
    selected.add(mostSaturated)

    // Если в кластере 4+ цвета, добавляем температурные варианты (для ЛЮБЫХ цветов)
    if (cluster.length >= 4) {
      // Если есть температурные вариации - берем крайние варианты
      if (hasBothTemperatures) {
        // Смешанная группа: берем самый холодный и самый теплый
        selected.add(sortedByTemperature[0]) // Самый холодный
        selected.add(sortedByTemperature[sortedByTemperature.length - 1]) // Самый теплый
      } else {
        // Однородная группа (только теплые или только холодные) - берем крайние по температуре
        if (sortedByTemperature.length > 1) {
          const coolest = sortedByTemperature[0]
          const warmest = sortedByTemperature[sortedByTemperature.length - 1]
          
          // Добавляем только если они отличаются от базового
          if (coolest !== mostSaturated) {
            selected.add(coolest)
          }
          if (warmest !== mostSaturated && warmest !== coolest) {
            selected.add(warmest)
          }
        }
      }

      // Самый ненасыщенный/грязный (если сильно отличается от базового)
      if (sortedBySaturation.length > 1) {
        const leastSaturated = sortedBySaturation[sortedBySaturation.length - 1]
        // Добавляем только если разница в насыщенности значительная
        if (leastSaturated.hsl.s < mostSaturated.hsl.s - 15) {
          selected.add(leastSaturated)
        }
      }
    } else if (cluster.length === 3) {
      // Для 3 цветов: темный, светлый, и базовый (самый насыщенный)
      // Базовый уже добавлен выше
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
 * 3. ПОЛНОСТЬЮ исключает белые и черные цвета (базовые цвета, которые пользователь знает когда использовать).
 * 4. Группирует (кластеризует) визуально похожие цвета по Delta E (для ЛЮБЫХ оттенков).
 * 5. Выбирает репрезентативные цвета из каждой группы (универсальная логика для всех цветов):
 *    - Самый темный + базовый (самый насыщенный) + самый светлый
 *    - Самый холодный и самый теплый (если есть температурные вариации)
 * 6. Сортирует финальный набор по светлоте (от светлого к темному).
 *
 * @param hexColors - входной массив HEX-строк
 * @param similarityThreshold - Порог Delta E для группировки похожих цветов (по умолчанию 20)
 * @returns массив HEX-строк, представляющий собой компактную и осмысленную палитру (без белых и черных)
 */
export function postProcessQuantizedHexColors(
  hexColors: string[],
  similarityThreshold: number = 20
): string[] {
  if (!Array.isArray(hexColors)) return []

  // Явный список белых цветов для исключения (регистр-независимо)
  const EXCLUDED_WHITES = new Set(['#FFFFFF', '#FEFEFD', '#FEFEFE', '#FDFDFD', '#FCFCFC', '#FBFBFB', '#FAFAFA'])
  
  // Явный список черных цветов для исключения (регистр-независимо)
  const EXCLUDED_BLACKS = new Set(['#000000', '#000001', '#010101', '#020202', '#030303', '#040404', '#050505'])

  // 1-3. Начальная подготовка и фильтрация
  const initialColors: Color[] = []
  for (const h of hexColors) {
    if (typeof h !== 'string' || h.trim().length === 0) continue

    try {
      const normalizedHex = h.startsWith('#') ? h : `#${h}`
      const upperHex = normalizedHex.toUpperCase()

      // Явное исключение белых и черных цветов
      if (EXCLUDED_WHITES.has(upperHex) || EXCLUDED_BLACKS.has(upperHex)) {
        continue
      }

      const color = createColorFromHex(upperHex)

      // Убеждаемся, что LAB вычислен
      if (!color.lab) {
        console.warn('Failed to compute LAB for color:', color.hex)
        continue
      }

      // Фильтруем белые и черные (используем строгие пороги для полного исключения)
      // Для белого: L >= 94 или (L > 80 && S < 15) - очень строгий фильтр
      const isWhite = color.hsl.l >= 94 || (color.hsl.l > 80 && color.hsl.s < 15)
      // Для черного: L < 6 или (L < 18 && S < 12) - очень строгий фильтр
      const isBlack = color.hsl.l < 6 || (color.hsl.l < 18 && color.hsl.s < 12)
      
      // Полностью исключаем белые и черные - это базовые цвета, которые пользователь знает когда использовать
      if (!isWhite && !isBlack) {
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
