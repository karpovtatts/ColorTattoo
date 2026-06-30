import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/Toast/ToastContainer'
import { ColorProvider } from './contexts/ColorContext'
import { PaletteProvider } from './contexts/PaletteContext'
import { ToastProvider, useToastContext } from './contexts/ToastContext'
import RecipePage from './pages/RecipePage'
import PalettePage from './pages/PalettePage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import ImageAnalysisPage from './pages/ImageAnalysisPage'
import './App.css'

function AppContent() {
  const { toasts, removeToast } = useToastContext()

  const basename = import.meta.env.BASE_URL

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Router basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<RecipePage />} />
            <Route path="/recipe" element={<Navigate to="/" replace />} />
            <Route path="/palette" element={<PalettePage />} />
            <Route path="/saved" element={<SavedRecipesPage />} />
            <Route path="/image-analysis" element={<ImageAnalysisPage />} />
          </Routes>
        </Layout>
      </Router>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}

function App() {
  return (
    <ColorProvider>
      <PaletteProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </PaletteProvider>
    </ColorProvider>
  )
}

export default App

