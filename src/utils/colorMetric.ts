import type { RGB, Color, LAB } from '../types'
import { rgbToLab } from './colorConversions'

/**
 * Расчет перцептивного цветового различия DeltaE (CIE76)
 * 
 * DeltaE измеряет разницу между цветами так, как их воспринимает человеческий глаз.
 * В отличие от евклидова расстояния в RGB, DeltaE учитывает особенности восприятия:
 * - Глаз более чувствителен к оттенкам зеленого, чем синего
 * - Разные оттенки одного цвета воспринимаются по-разному
 * 
 * Шкала DeltaE:
 * - < 1: Неразличимо для человеческого глаза
 * - 1-2: Очень близкие цвета (только эксперты заметят разницу)
 * - 2-10: Похожие цвета (средний наблюдатель заметит разницу)
 * - 10-49: Разные цвета
 * - > 49: Очень разные цвета
 * 
 * @param lab1 - Первый цвет в LAB пространстве
 * @param lab2 - Второй цвет в LAB пространстве
 * @returns DeltaE значение (чем меньше, тем ближе цвета)
 */
export function calculateDeltaE76(lab1: LAB, lab2: LAB): number {
  const deltaL = lab1.l - lab2.l
  const deltaA = lab1.a - lab2.a
  const deltaB = lab1.b - lab2.b

  // Евклидово расстояние в LAB пространстве
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

/**
 * Расчет перцептивного цветового различия DeltaE 2000 (более точная версия)
 * 
 * CIEDE2000 учитывает дополнительные факторы:
 * - Компенсация неоднородности LAB пространства
 * - Учет хроматичности и яркости
 * - Более точная для малых различий
 * 
 * @param lab1 - Первый цвет в LAB пространстве
 * @param lab2 - Второй цвет в LAB пространстве
 * @returns DeltaE 2000 значение
 */
export function calculateDeltaE2000(lab1: LAB, lab2: LAB): number {
  // Константы для CIEDE2000
  const kL = 1.0 // Фактор яркости
  const kC = 1.0 // Фактор хроматичности
  const kH = 1.0 // Фактор оттенка

  // Вычисляем средние значения
  const LBar = (lab1.l + lab2.l) / 2

  // Вычисляем C (хроматичность) для обоих цветов
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
  const CBar = (C1 + C2) / 2

  // Вычисляем G (фактор для учета нелинейности)
  const G = 0.5 * (1 - Math.sqrt(Math.pow(CBar, 7) / (Math.pow(CBar, 7) + Math.pow(25, 7))))

  // Вычисляем a' (скорректированные значения)
  const a1Prime = (1 + G) * lab1.a
  const a2Prime = (1 + G) * lab2.a

  // Вычисляем C' (скорректированная хроматичность)
  const C1Prime = Math.sqrt(a1Prime * a1Prime + lab1.b * lab1.b)
  const C2Prime = Math.sqrt(a2Prime * a2Prime + lab2.b * lab2.b)
  const CBarPrime = (C1Prime + C2Prime) / 2

  // Вычисляем h' (оттенок)
  const h1Prime = Math.atan2(lab1.b, a1Prime) * (180 / Math.PI)
  const h2Prime = Math.atan2(lab2.b, a2Prime) * (180 / Math.PI)
  const h1PrimeDeg = h1Prime >= 0 ? h1Prime : h1Prime + 360
  const h2PrimeDeg = h2Prime >= 0 ? h2Prime : h2Prime + 360

  // Вычисляем deltaH'
  let deltaHPrime = 0
  if (Math.abs(h1PrimeDeg - h2PrimeDeg) <= 180) {
    deltaHPrime = h2PrimeDeg - h1PrimeDeg
  } else if (h2PrimeDeg - h1PrimeDeg > 180) {
    deltaHPrime = h2PrimeDeg - h1PrimeDeg - 360
  } else {
    deltaHPrime = h2PrimeDeg - h1PrimeDeg + 360
  }

  const deltaHPrimeRad = (2 * Math.sqrt(C1Prime * C2Prime) * Math.sin((deltaHPrime * Math.PI) / 360))

  // Вычисляем HBar'
  let HBarPrime = 0
  if (Math.abs(h1PrimeDeg - h2PrimeDeg) <= 180) {
    HBarPrime = (h1PrimeDeg + h2PrimeDeg) / 2
  } else if (h1PrimeDeg + h2PrimeDeg < 360) {
    HBarPrime = (h1PrimeDeg + h2PrimeDeg + 360) / 2
  } else {
    HBarPrime = (h1PrimeDeg + h2PrimeDeg - 360) / 2
  }

  // Вычисляем T
  const T =
    1 -
    0.17 * Math.cos((HBarPrime - 30) * (Math.PI / 180)) +
    0.24 * Math.cos(2 * HBarPrime * (Math.PI / 180)) +
    0.32 * Math.cos((3 * HBarPrime + 6) * (Math.PI / 180)) -
    0.2 * Math.cos((4 * HBarPrime - 63) * (Math.PI / 180))

  // Вычисляем deltaTheta
  const deltaTheta =
    30 * Math.exp(-Math.pow((HBarPrime - 275) / 25, 2))

  // Вычисляем RC
  const RC = 2 * Math.sqrt(Math.pow(CBarPrime, 7) / (Math.pow(CBarPrime, 7) + Math.pow(25, 7)))

  // Вычисляем RT
  const RT = -Math.sin(2 * deltaTheta * (Math.PI / 180)) * RC

  // Вычисляем SL, SC, SH
  const deltaL = lab2.l - lab1.l
  const SL = 1 + (0.015 * Math.pow(LBar - 50, 2)) / Math.sqrt(20 + Math.pow(LBar - 50, 2))
  const SC = 1 + 0.045 * CBarPrime
  const SH = 1 + 0.015 * CBarPrime * T

  // Финальный расчет DeltaE 2000
  const deltaE =
    Math.sqrt(
      Math.pow(deltaL / (kL * SL), 2) +
        Math.pow((C2Prime - C1Prime) / (kC * SC), 2) +
        Math.pow(deltaHPrimeRad / (kH * SH), 2) +
        RT * ((C2Prime - C1Prime) / (kC * SC)) * (deltaHPrimeRad / (kH * SH))
    )

  return deltaE
}

/**
 * Получение LAB значения цвета (с кэшированием)
 * @param color - Цвет
 * @returns LAB значения
 */
function getLab(color: Color): LAB {
  // Используем кэш, если доступен
  if (color.lab) {
    return color.lab
  }

  // Вычисляем и возвращаем (кэширование должно происходить на уровне выше)
  return rgbToLab(color.rgb)
}

/**
 * Расчет перцептивного расстояния между двумя RGB цветами
 * @param rgb1 - Первый цвет (RGB)
 * @param rgb2 - Второй цвет (RGB)
 * @param useDeltaE2000 - Использовать DeltaE 2000 вместо CIE76 (по умолчанию false для производительности)
 * @returns DeltaE значение
 */
export function calculateColorDistancePerceptual(
  rgb1: RGB,
  rgb2: RGB,
  useDeltaE2000: boolean = false
): number {
  const lab1 = rgbToLab(rgb1)
  const lab2 = rgbToLab(rgb2)

  if (useDeltaE2000) {
    return calculateDeltaE2000(lab1, lab2)
  }

  return calculateDeltaE76(lab1, lab2)
}

/**
 * Расчет перцептивного расстояния между двумя Color объектами
 * @param color1 - Первый цвет
 * @param color2 - Второй цвет
 * @param useDeltaE2000 - Использовать DeltaE 2000 (по умолчанию false)
 * @returns DeltaE значение
 */
export function calculateColorDistancePerceptualFull(
  color1: Color,
  color2: Color,
  useDeltaE2000: boolean = false
): number {
  const lab1 = getLab(color1)
  const lab2 = getLab(color2)

  if (useDeltaE2000) {
    return calculateDeltaE2000(lab1, lab2)
  }

  return calculateDeltaE76(lab1, lab2)
}

