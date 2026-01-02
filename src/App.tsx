import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import { ColorProvider } from './contexts/ColorContext'
import HomePage from './pages/HomePage'
import PalettePage from './pages/PalettePage'
import RecipePage from './pages/RecipePage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import './App.css'

function App() {
  return (
    <ColorProvider>
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
    </ColorProvider>
  )
}

export default App

