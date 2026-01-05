import type { BrandInk, AnalysisResult, RGB } from '@/types'
import { brandInks } from '@/data/brands'
import { createColorFromHex, calculateColorDistance } from '@/utils/colorOperations'

/**
 * Сервис для работы с каталогом брендовых красок
 */
export class BrandInkService {
  private static inks: BrandInk[] = brandInks

  /**
   * Получить все краски из каталога
   */
  static getAllInks(): BrandInk[] {
    return [...this.inks]
  }

  /**
   * Получить краски по бренду
   */
  static getInksByBrand(brand: BrandInk['brand']): BrandInk[] {
    return this.inks.filter((ink) => ink.brand === brand)
  }

  /**
   * Найти ближайшую краску к целевому цвету
   * @param targetColor - Целевой цвет в формате HEX или RGB
   * @returns Найденная краска и расстояние до неё
   */
  static findNearestInk(
    targetColor: string | RGB
  ): { ink: BrandInk; distance: number } {
    if (this.inks.length === 0) {
      throw new Error('Каталог красок пуст')
    }

    // Конвертируем целевой цвет в RGB
    let targetRgb: RGB
    if (typeof targetColor === 'string') {
      const targetColorObj = createColorFromHex(targetColor)
      targetRgb = targetColorObj.rgb
    } else {
      targetRgb = targetColor
    }

    let nearestInk = this.inks[0]
    let minDistance = Infinity

    // Находим ближайшую краску по евклидову расстоянию в RGB
    for (const ink of this.inks) {
      const inkColor = createColorFromHex(ink.hex)
      const distance = calculateColorDistance(targetRgb, inkColor.rgb)

      if (distance < minDistance) {
        minDistance = distance
        nearestInk = ink
      }
    }

    return { ink: nearestInk, distance: minDistance }
  }

  /**
   * Найти все краски, отсортированные по близости к целевому цвету
   * @param targetColor - Целевой цвет в формате HEX или RGB
   * @param limit - Максимальное количество результатов (опционально)
   * @returns Массив красок, отсортированный по близости
   */
  static findNearestInks(
    targetColor: string | RGB,
    limit?: number
  ): Array<{ ink: BrandInk; distance: number }> {
    if (typeof targetColor === 'string') {
      const targetColorObj = createColorFromHex(targetColor)
      targetColor = targetColorObj.rgb
    }

    const results = this.inks.map((ink) => {
      const inkColor = createColorFromHex(ink.hex)
      const distance = calculateColorDistance(targetColor as RGB, inkColor.rgb)
      return { ink, distance }
    })

    // Сортируем по расстоянию
    results.sort((a, b) => a.distance - b.distance)

    // Ограничиваем количество результатов, если указано
    if (limit && limit > 0) {
      return results.slice(0, limit)
    }

    return results
  }

  /**
   * Сопоставить цвет с краской из каталога
   * @param originalColorHex - HEX код цвета, найденного на изображении
   * @returns Результат анализа с подобранной краской
   */
  static matchColorToInk(originalColorHex: string): AnalysisResult {
    const { ink, distance } = this.findNearestInk(originalColorHex)

    return {
      originalColor: originalColorHex,
      matchedInk: ink,
      distance,
    }
  }

  /**
   * Получить краску по ID
   */
  static getInkById(id: string): BrandInk | undefined {
    return this.inks.find((ink) => ink.id === id)
  }
}

