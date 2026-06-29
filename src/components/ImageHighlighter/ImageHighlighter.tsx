import { useEffect, useRef, useState } from 'react'
import './ImageHighlighter.css'

interface ImageHighlighterProps {
  imageSrc: string
  highlightedPixels?: Array<{ x: number; y: number }>
  highlightColor?: string
  opacity?: number
  // Размеры пиксельного пространства, в котором заданы highlightedPixels
  // (это размер уменьшенного canvas, использованного для анализа цвета,
  // а не натуральное/отрендеренное разрешение imageSrc). Без них координаты
  // подсветки масштабируются относительно полноразмерного изображения и
  // оказываются смещены.
  sourceWidth?: number
  sourceHeight?: number
}

function ImageHighlighter({
  imageSrc,
  highlightedPixels = [],
  highlightColor = 'rgba(255, 255, 0, 0.5)',
  opacity = 0.6,
  sourceWidth,
  sourceHeight,
}: ImageHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      setImageLoaded(true)
    }
    img.src = imageSrc
  }, [imageSrc])

  useEffect(() => {
    if (!imageLoaded || !overlayRef.current || !imageSize || highlightedPixels.length === 0) {
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
        }
      }
      return
    }

    const container = containerRef.current
    if (!container) return

    const canvas = overlayRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Получаем размеры контейнера
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    // highlightedPixels заданы в пространстве уменьшенного canvas анализа,
    // а не в натуральном разрешении imageSrc — масштабируем относительно него
    const pixelSpaceWidth = sourceWidth ?? imageSize.width
    const pixelSpaceHeight = sourceHeight ?? imageSize.height

    // Вычисляем масштаб
    const scaleX = containerWidth / pixelSpaceWidth
    const scaleY = containerHeight / pixelSpaceHeight
    const scale = Math.min(scaleX, scaleY)

    // Вычисляем реальные размеры изображения на экране
    const displayWidth = pixelSpaceWidth * scale
    const displayHeight = pixelSpaceHeight * scale

    // Устанавливаем размеры canvas
    canvas.width = containerWidth
    canvas.height = containerHeight

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем подсветку
    ctx.fillStyle = highlightColor.replace('0.5', opacity.toString())
    ctx.strokeStyle = highlightColor.replace('0.5', '1')
    ctx.lineWidth = 1

    const offsetX = (containerWidth - displayWidth) / 2
    const offsetY = (containerHeight - displayHeight) / 2

    highlightedPixels.forEach(({ x, y }) => {
      const screenX = x * scale + offsetX
      const screenY = y * scale + offsetY
      const pixelSize = Math.max(1, scale)

      ctx.fillRect(screenX, screenY, pixelSize, pixelSize)
      ctx.strokeRect(screenX, screenY, pixelSize, pixelSize)
    })
  }, [imageLoaded, imageSize, highlightedPixels, highlightColor, opacity, sourceWidth, sourceHeight])

  return (
    <div ref={containerRef} className="image-highlighter">
      <img
        src={imageSrc}
        alt="Изображение"
        className="image-highlighter__image"
        onLoad={(e) => {
          const img = e.currentTarget
          setImageSize({ width: img.width, height: img.height })
          setImageLoaded(true)
        }}
      />
      <canvas
        ref={overlayRef}
        className="image-highlighter__overlay"
      />
    </div>
  )
}

export default ImageHighlighter

