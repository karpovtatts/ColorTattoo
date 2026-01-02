import { ReactNode } from 'react'
import Navigation from '../Navigation/Navigation'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Navigation />
      <main className="layout__main">
        {children}
      </main>
    </div>
  )
}

export default Layout

