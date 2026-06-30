import { ReactNode } from 'react'
import Navigation from '../Navigation/Navigation'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const SOCIAL_LINKS = [
  { label: 'VK', href: 'https://vk.com/karpovtatts' },
  { label: 'Telegram', href: 'https://t.me/karpovtatts' },
  { label: 'Поблагодарить', href: 'https://tbank.ru/cf/1JlX8nxbQnf' },
]

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Navigation />
      <main className="layout__main">
        {children}
      </main>
      <footer className="layout__footer">
        <a
          href="https://lazyline.tattookarpov.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="layout__footer-brand"
        >
          LazyLine
        </a>
        <span className="layout__footer-sep">·</span>
        <span className="layout__footer-year">{new Date().getFullYear()}</span>
        <div className="layout__footer-links">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="layout__footer-link"
            >
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default Layout

