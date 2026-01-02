import Container from '@/components/Container/Container'
import './SavedRecipesPage.css'

function SavedRecipesPage() {
  return (
    <Container>
      <div className="saved-recipes-page">
        <h1 className="saved-recipes-page__title">Сохранённые рецепты</h1>
        <p className="saved-recipes-page__description">
          Ваши сохранённые рецепты и заметки
        </p>
        {/* TODO: Реализовать в Этапе 9 */}
      </div>
    </Container>
  )
}

export default SavedRecipesPage

