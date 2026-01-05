import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <Link to="/" className="navigation__logo">
          ColorTattoo
        </Link>
        <ul className="navigation__menu">
          <li>
            <Link
              to="/"
              className={`navigation__link ${isActive('/') ? 'navigation__link--active' : ''}`}
            >
              Главная
            </Link>
          </li>
          <li>
            <Link
              to="/palette"
              className={`navigation__link ${isActive('/palette') ? 'navigation__link--active' : ''}`}
            >
              Палитра
            </Link>
          </li>
          <li>
            <Link
              to="/recipe"
              className={`navigation__link ${isActive('/recipe') ? 'navigation__link--active' : ''}`}
            >
              Рецепт
            </Link>
          </li>
          <li>
            <Link
              to="/saved"
              className={`navigation__link ${isActive('/saved') ? 'navigation__link--active' : ''}`}
            >
              Сохранённые
            </Link>
          </li>
          <li>
            <Link
              to="/image-analysis"
              className={`navigation__link ${isActive('/image-analysis') ? 'navigation__link--active' : ''}`}
            >
              Анализ изображения
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navigation

