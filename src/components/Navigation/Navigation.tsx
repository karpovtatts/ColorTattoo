import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

const NAV_ITEMS = [
  { path: '/', label: 'Главная', icon: '🏠' },
  { path: '/palette', label: 'Палитра', icon: '📋' },
  { path: '/recipe', label: 'Рецепт', icon: '🧪' },
  { path: '/saved', label: 'Сохранённые', icon: '💾' },
  { path: '/image-analysis', label: 'Анализ фото', icon: '📷' },
] as const

function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      <nav className="navigation">
        <div className="navigation__container">
          <Link to="/" className="navigation__logo">
            ColorTattoo
          </Link>
          <ul className="navigation__menu">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`navigation__link ${isActive(item.path) ? 'navigation__link--active' : ''}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Нижняя панель табов — основная навигация на телефоне, в зоне досягаемости большого пальца */}
      <nav className="bottom-nav" aria-label="Основная навигация">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav__item ${isActive(item.path) ? 'bottom-nav__item--active' : ''}`}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}

export default Navigation
