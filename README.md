# ColorTattoo

Инструмент для тату-мастеров: подбирает рецепт смешивания красок под целевой цвет и анализирует цвета на референс-фото.

**Живой сайт:** [color.tattookarpov.ru](https://color.tattookarpov.ru)

## Возможности

- **Рецепт смешивания** — три варианта сразу: из базовой палитры, с учётом сильверов, и подсказка какую краску добавить в палитру
- **Сильвер-серия** — градации 100% / 75% / 50% / 25% / 15% включены в палитру по умолчанию; отдельная колонка показывает, помогают ли они для конкретного оттенка
- **Калькулятор объёма** — вводишь мл или капли, получаешь точные пропорции для каждого ингредиента
- **Анализ фото** — загружаешь референс, кликаешь на любую точку, получаешь цвет и рецепт для него; можно накликать несколько точек и найти рецепты для всех сразу
- **Управление палитрой** — добавление красок через цветовой пикер с характеристиками (температура, насыщенность, предупреждение о дубликатах)
- **Сохранённые рецепты** — история найденных рецептов в localStorage

## Алгоритм

Смешивание — **субтрактивная модель через CMYK**: жёлтый + синий = зелёный, а не серый как в RGB. Именно так работают физические пигменты.

Метрика качества — **CIE DeltaE 2000**: сравнивает цвета так, как их видит человек.

Поиск рецепта — брутфорс комбинаций 1–4 красок с перебором пропорций (шаг 5% для 2–3 красок, 10% для 4). Чёрный фильтруется из подбора для хроматических цветов — он не затемняет, а грязнит.

## Стек

- React 18 + TypeScript, Vite, React Router v6
- react-colorful (пикер), react-color (SketchPicker в рецепте)
- Вся логика на клиенте, хранилище — localStorage
- Web Worker для K-means квантизации при анализе фото

## Разработка

```bash
npm install
npm run dev      # localhost:3000
npm run build    # tsc + vite build → dist/
npm run lint
```

## Деплой

Два окружения, разные base path:

| URL | base path | папка на сервере |
| --- | --------- | ---------------- |
| [color.tattookarpov.ru](https://color.tattookarpov.ru) | `/` | `/home/webapp/projects/color-tattoo/` |
| [155-212-165-45.nip.io/colortattoo/](https://155-212-165-45.nip.io/colortattoo/) | `/colortattoo/` | `/home/webapp/projects/colortattoo/dist/` |

`VITE_BASE_PATH` в `.env.production` (gitignored) управляет base path. Подробнее — [SERVER_INFO.md](./SERVER_INFO.md) (тоже gitignored).

## Структура

```
src/
  pages/          # RecipePage, PalettePage, ImageAnalysisPage, SavedRecipesPage
  components/     # UI-компоненты (RecipeDisplay, AddColorModal, ImageHighlighter …)
  services/       # recipeFinder.ts, paletteStorage.ts, recipeStorage.ts
  utils/          # colorPhysics.ts, colorConversions.ts, colorOperations.ts, colorMetric.ts …
  contexts/       # ColorContext, PaletteContext, ToastContext
  workers/        # colorAnalysis.worker.ts (K-means, off main thread)
  data/           # brand inks JSON (world-famous, limitless)
  types/          # index.ts — Color, Recipe, RecipeResult …
```
