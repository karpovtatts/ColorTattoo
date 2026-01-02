import { useNavigate } from 'react-router-dom'
import Container from '@/components/Container/Container'
import { Button, ColorPreview } from '@/components'
import { useColorContext } from '@/contexts/ColorContext'
import './RecipePage.css'

function RecipePage() {
  const navigate = useNavigate()
  const { targetColor } = useColorContext()

  if (!targetColor) {
    return (
      <Container>
        <div className="recipe-page">
          <h1 className="recipe-page__title">Подбор рецепта</h1>
          <p className="recipe-page__description">
            Выберите целевой цвет для получения рецепта смешивания
          </p>
          <div className="recipe-page__empty">
            <p className="recipe-page__empty-text">
              Целевой цвет не выбран. Вернитесь на главную страницу и введите цвет.
            </p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Выбрать цвет
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="recipe-page">
        <h1 className="recipe-page__title">Подбор рецепта</h1>
        <div className="recipe-page__target-color">
          <h2 className="recipe-page__section-title">Целевой цвет</h2>
          <ColorPreview
            color={targetColor}
            size="large"
            showHex
            showRgb
            label="Выбранный цвет"
          />
        </div>
        <div className="recipe-page__content">
          <p className="recipe-page__description">
            Реализация алгоритма подбора рецепта будет выполнена в следующих этапах.
          </p>
          {/* TODO: Реализовать в Этапах 5-8 */}
        </div>
      </div>
    </Container>
  )
}

export default RecipePage

