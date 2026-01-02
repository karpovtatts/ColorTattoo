import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/Toast/ToastContainer'
import { ColorProvider } from './contexts/ColorContext'
import { PaletteProvider } from './contexts/PaletteContext'
import { ToastProvider, useToastContext } from './contexts/ToastContext'
import HomePage from './pages/HomePage'
import PalettePage from './pages/PalettePage'
import RecipePage from './pages/RecipePage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import './App.css'

function AppContent() {
  const { toasts, removeToast } = useToastContext()

  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/palette" element={<PalettePage />} />
            <Route path="/recipe" element={<RecipePage />} />
            <Route path="/saved" element={<SavedRecipesPage />} />
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

