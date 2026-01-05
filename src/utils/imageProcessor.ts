/**
 * Утилиты для обработки изображений
 */

export interface PixelData {
  r: number
  g: number
  b: number
}

const MAX_PROCESSING_SIZE = 150 // Максимальный размер изображения для обработки (пикселей)

/**
 * Загрузка изображения из файла
 * @param file - Файл изображения
 * @returns Promise с HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Не удалось загрузить изображение'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

/**
 * Масштабирование изображения для оптимизации производительности
 * @param img - Изображение
 * @param maxSize - Максимальный размер (по умолчанию 150px)
 * @returns HTMLCanvasElement с уменьшенным изображением
 */
export function scaleImage(
  img: HTMLImageElement,
  maxSize: number = MAX_PROCESSING_SIZE
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Не удалось получить контекст canvas')
  }

  // Вычисляем новый размер, сохраняя пропорции
  let width = img.width
  let height = img.height

  if (width > height) {
    if (width > maxSize) {
      height = (height * maxSize) / width
      width = maxSize
    }
  } else {
    if (height > maxSize) {
      width = (width * maxSize) / height
      height = maxSize
    }
  }

  canvas.width = width
  canvas.height = height

  // Рисуем изображение на canvas
  ctx.drawImage(img, 0, 0, width, height)

  return canvas
}

/**
 * Получение массива пикселей из canvas
 * @param canvas - Canvas элемент
 * @returns Массив пикселей в формате RGB
 */
export function getPixelsFromCanvas(canvas: HTMLCanvasElement): PixelData[] {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Не удалось получить контекст canvas')
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels: PixelData[] = []

  // Извлекаем RGB значения (пропускаем альфа-канал)
  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push({
      r: imageData.data[i],
      g: imageData.data[i + 1],
      b: imageData.data[i + 2],
      // Альфа-канал игнорируем для простоты
    })
  }

  return pixels
}

/**
 * Получение данных изображения из файла
 * Выполняет загрузку, масштабирование и извлечение пикселей
 * @param file - Файл изображения
 * @returns Promise с массивом пикселей и canvas элементом
 */
export async function processImageFile(file: File): Promise<{
  pixels: PixelData[]
  canvas: HTMLCanvasElement
  originalWidth: number
  originalHeight: number
}> {
  // Проверяем тип файла
  if (!file.type.startsWith('image/')) {
    throw new Error('Файл не является изображением')
  }

  // Загружаем изображение
  const img = await loadImageFromFile(file)
  const originalWidth = img.width
  const originalHeight = img.height

  // Масштабируем для оптимизации
  const canvas = scaleImage(img, MAX_PROCESSING_SIZE)

  // Извлекаем пиксели
  const pixels = getPixelsFromCanvas(canvas)

  return {
    pixels,
    canvas,
    originalWidth,
    originalHeight,
  }
}

/**
 * Создание URL для предпросмотра изображения
 * @param file - Файл изображения
 * @returns Promise с data URL
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Не удалось создать превью'))
    reader.readAsDataURL(file)
  })
}

