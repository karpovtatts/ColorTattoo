import Container from '@/components/Container/Container'
import './HomePage.css'

function HomePage() {
  return (
    <Container>
      <div className="home-page">
        <h1 className="home-page__title">ColorTattoo</h1>
        <p className="home-page__subtitle">
          Помощник по смешиванию цветов для тату-мастеров
        </p>
        <div className="home-page__content">
          <p>Добро пожаловать в ColorTattoo!</p>
          <p>Начните с настройки вашей палитры или введите целевой цвет для получения рецепта.</p>
        </div>
      </div>
    </Container>
  )
}

export default HomePage

