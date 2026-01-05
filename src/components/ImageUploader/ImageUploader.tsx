import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import './ImageUploader.css'

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
  acceptedTypes?: string
  maxSizeMB?: number
}

function ImageUploader({
  onImageSelect,
  acceptedTypes = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 10,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return 'Файл должен быть изображением'
    }

    // Проверка размера
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `Размер файла не должен превышать ${maxSizeMB} МБ`
    }

    return null
  }

  const handleFile = (file: File) => {
    setError(null)
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    onImageSelect(file)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="image-uploader">
      <div
        className={`image-uploader__dropzone ${isDragging ? 'image-uploader__dropzone--dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          className="image-uploader__input"
          aria-label="Выбрать изображение"
        />
        <div className="image-uploader__content">
          <div className="image-uploader__icon">📸</div>
          <p className="image-uploader__text">
            Перетащите изображение сюда или{' '}
            <button
              type="button"
              className="image-uploader__link"
              onClick={handleButtonClick}
            >
              выберите файл
            </button>
          </p>
          <p className="image-uploader__hint">
            Поддерживаются форматы: JPG, PNG, WebP (макс. {maxSizeMB} МБ)
          </p>
        </div>
      </div>
      {error && (
        <div className="image-uploader__error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageUploader

