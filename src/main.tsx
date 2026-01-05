import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Подавляем не критичные warnings от библиотек
// Это не ошибки, а предупреждения о будущих изменениях
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || ''
  
  // Подавляем warnings о defaultProps от react-color
  if (
    message.includes('defaultProps') &&
    (message.includes('Sketch2') ||
      message.includes('Checkboard2') ||
      message.includes('ColorPicker2') ||
      message.includes('Alpha2'))
  ) {
    return // Не показываем эти warnings
  }
  
  // Подавляем warnings от React Router о будущих флагах
  if (message.includes('React Router Future Flag')) {
    return // Не показываем эти warnings
  }
  
  // Показываем все остальные warnings
  originalWarn.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

