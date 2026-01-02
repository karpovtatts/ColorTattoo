import Container from '@/components/Container/Container'
import './RecipePage.css'

function RecipePage() {
  return (
    <Container>
      <div className="recipe-page">
        <h1 className="recipe-page__title">Подбор рецепта</h1>
        <p className="recipe-page__description">
          Введите целевой цвет для получения рецепта смешивания
        </p>
        {/* TODO: Реализовать в Этапах 3, 5-8 */}
      </div>
    </Container>
  )
}

export default RecipePage

