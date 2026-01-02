import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import PalettePage from './pages/PalettePage'
import RecipePage from './pages/RecipePage'
import SavedRecipesPage from './pages/SavedRecipesPage'
import './App.css'

function App() {
  return (
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
  )
}

export default App

