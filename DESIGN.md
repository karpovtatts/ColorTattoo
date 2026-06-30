---
name: ColorTattoo
description: Ink-mixing recipe instrument for tattoo artists — precision tool aesthetic, warm copper accent on cold stone ground.
palette: lazyline
colors:
  bg: "#eef0f3"
  bg-secondary: "#f7f8fa"
  surface: "#ffffff"
  text: "#262b35"
  mute: "#5b6170"
  text-tertiary: "#8b92a0"
  accent: "#cf8a4c"
  accent-hover: "#a8682f"
  accent-active: "#8a5526"
  accent-tint: "rgba(207,138,76,0.13)"
  accent-tint-hover: "rgba(207,138,76,0.06)"
  border: "rgba(38,43,53,0.12)"
  border-hover: "rgba(38,43,53,0.22)"
  border-soft: "rgba(38,43,53,0.05)"
  success: "#4f8f6f"
  warning: "#d97706"
  error: "#dc2626"
typography:
  body:
    fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontWeight: 500
    fontSize: "0.875rem"
  readout:
    fontFamily: "'JetBrains Mono', 'Courier New', monospace"
    fontSize: "0.875rem"
    fontWeight: 400
  display:
    fontFamily: "'Anton', sans-serif"
    usage: "крупные заголовки секций, если нужны"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
shadows:
  sm: "0 1px 3px rgba(38,43,53,0.06)"
  md: "0 4px 12px -2px rgba(38,43,53,0.1), 0 1px 4px rgba(38,43,53,0.06)"
  lg: "0 28px 64px -20px rgba(38,43,53,0.16), 0 4px 14px -4px rgba(38,43,53,0.08)"
components:
  button-primary:
    backgroundColor: "#cf8a4c"
    textColor: "#ffffff"
    rounded: "8px"
    padding: "10px 20px"
    minHeight: "44px"
    fontWeight: 600
  button-primary-hover:
    backgroundColor: "#a8682f"
    transform: "none"
  button-primary-active:
    transform: "scale(0.96)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "#cf8a4c"
    border: "1.5px solid rgba(207,138,76,0.4)"
    rounded: "8px"
  input-text:
    backgroundColor: "#ffffff"
    textColor: "#262b35"
    border: "1.5px solid rgba(38,43,53,0.12)"
    rounded: "12px"
    padding: "10px 14px"
  input-focus:
    border: "1.5px solid #cf8a4c"
    boxShadow: "0 0 0 3px rgba(207,138,76,0.12)"
  color-swatch:
    rounded: "12px"
    shadow: "0 4px 12px -2px rgba(38,43,53,0.1)"
    shadowHover: "0 8px 24px -6px rgba(38,43,53,0.18)"
---

# Design System: ColorTattoo

## 1. Обзор

**Идея: «Медный инструмент на каменном столе»**

Тёплая медь (`#cf8a4c`) на холодном туманном фоне (`#eef0f3`) — это визуальный контраст, который делает интерфейс запоминающимся и нешаблонным. Медь отсылает к прецизионным инструментам (калиперы, чернильные пипетки), камень — к рабочей поверхности мастера. Ничего декоративного, всё функциональное.

**Унаследовано из:** дизайн-системы [LazyLine](../lazyline).

**Что система отвергает:**
- Синие SaaS-акценты (#2563eb — был, теперь нет).
- Чистый белый фон — слишком больничный; заменён на холодно-туманный #eef0f3.
- Глобальные тени на карточках в покое; тени только на модалках и ховере.
- Candy-цвета, градиенты, glassmorphism.

**Что наследует из ColorTattoo:**
- Monospace строго для числовых значений (hex, RGB, CMYK, проценты).
- Плоские поверхности в покое; тени — только для временного/floating контента.
- Предупреждения (muddy, чёрная краска) — не тосты, а постоянные элементы с весом.

---

## 2. Цвета

### Фоны
| Токен | Значение | Применение |
|---|---|---|
| `--color-bg-primary` | `#eef0f3` | Страница, основной фон |
| `--color-bg-secondary` | `#f7f8fa` | Вторичные секции, sidebar |
| `--color-bg-tertiary` | `rgba(38,43,53,0.05)` | Теги, badges, hover-fill |

### Текст
| Токен | Значение | Применение |
|---|---|---|
| `--color-text-primary` | `#262b35` | Всё основное — заголовки, значения |
| `--color-text-secondary` | `#5b6170` | Подписи, лейблы, каптчи |
| `--color-text-tertiary` | `#8b92a0` | Плейсхолдеры, disabled |

### Акцент: тёплая медь
| Токен | Значение | Применение |
|---|---|---|
| `--color-primary` | `#cf8a4c` | Кнопки, активный таб, focus ring |
| `--color-primary-hover` | `#a8682f` | Ховер на акцентных элементах |
| `--color-primary-active` | `#8a5526` | Нажатое состояние |
| `--color-accent-tint` | `rgba(207,138,76,0.13)` | Выбранные опции, active chip background |
| `--color-accent-tint-hover` | `rgba(207,138,76,0.06)` | Ховер на интерактивных картах |

### Бордеры
| Токен | Значение | Применение |
|---|---|---|
| `--color-border` | `rgba(38,43,53,0.12)` | Все границы в покое |
| `--color-border-hover` | `rgba(38,43,53,0.22)` | Границы при ховере |

### Статусные
| Токен | Значение | Применение |
|---|---|---|
| `--color-success` | `#4f8f6f` | Точное совпадение, сохранено |
| `--color-warning` | `#d97706` | Предупреждения (грязный цвет, чёрная краска) |
| `--color-error` | `#dc2626` | Деструктивные действия, ошибки |

**Правило «Один акцент».** Медь появляется ровно на одном элементе на экране — том, на который нужно нажать следующим (primary-кнопка, активный таб, focus ring). Никаких медных фонов секций и карточек.

---

## 3. Типографика

| Роль | Шрифт | Размер | Вес | Применение |
|---|---|---|---|---|
| Display | Anton | 1.5–2rem | 400 | Крупные заголовки страниц |
| Body | Hanken Grotesk | 1rem | 400 | Весь прозаический текст, кнопки |
| Label | Hanken Grotesk | 0.875rem | 500 | Лейблы полей, каптчи |
| Readout | JetBrains Mono | 0.875rem | 400 | **Только числа**: hex, RGB, CMYK, % |

**Правило «Monospace = точное значение».** JetBrains Mono появляется исключительно там, где мастер будет физически отмерять или смешивать по этому числу. Всё остальное — Hanken Grotesk. Нарушение этого правила размывает сигнал точности.

Шрифты самохостятся из `public/fonts/` (скопированы из lazyline). Все варианты включают кириллицу.

---

## 4. Тени

Поверхности в покое — плоские. Тени только для:
- ховер-состояния интерактивных карточек (`--shadow-md`)
- модалок, тултипов, dropdown (`--shadow-lg`)

| Токен | Значение | Применение |
|---|---|---|
| `--shadow-sm` | `0 1px 3px rgba(38,43,53,0.06)` | Sticky-хедеры, минимальное разделение |
| `--shadow-md` | `0 4px 12px -2px rgba(38,43,53,0.1), 0 1px 4px rgba(38,43,53,0.06)` | Ховер на свотчах и карточках |
| `--shadow-lg` | `0 28px 64px -20px rgba(38,43,53,0.16), 0 4px 14px -4px rgba(38,43,53,0.08)` | Модалки, поповеры |

---

## 5. Радиусы

| Токен | Значение | Применение |
|---|---|---|
| `--radius-sm` | `8px` | Теги, badges, маленькие чипы |
| `--radius-md` | `12px` | Кнопки, инпуты, карточки среднего размера |
| `--radius-lg` | `16px` | Большие карточки, модалки |
| `--radius-pill` | `999px` | Таб-пилюли, круглые иконки-кнопки |

---

## 6. Компоненты

### Кнопка Primary
- Фон: `#cf8a4c` → ховер `#a8682f`
- Текст: белый, font-weight 600
- Радиус: `--radius-sm` (8px)
- Padding: `10px 20px`, min-height 44px
- Active: `transform: scale(0.96)` — тактильный отклик

### Кнопка Outline / Secondary
- Фон: прозрачный; бордер `1.5px solid rgba(207,138,76,0.4)`
- Текст: `--color-primary` (#cf8a4c)
- Ховер: фон `rgba(207,138,76,0.06)`

### Инпут
- Фон: `#ffffff`; бордер `1.5px solid rgba(38,43,53,0.12)`
- Радиус: `--radius-md` (12px)
- Focus: бордер → `#cf8a4c` + glow `0 0 0 3px rgba(207,138,76,0.12)`
- Error: бордер и glow → `--color-error`

### Цветовой свотч (ключевой компонент)
- Радиус: `--radius-md` (12px)
- Тень в покое: нет; на ховере: `--shadow-md`
- Действия раскрываются по тапу/клику, не только по ховеру (touch-first)

### Навигация
- Активный пункт: фон `rgba(207,138,76,0.13)`, текст `#cf8a4c`
- Все ссылки: min-height 44px (touch target)

---

## 7. Интерактивные паттерны

- **button:active** → `transform: scale(0.96)` — физический отклик нажатия
- **:focus-visible** → `outline: 2px solid #cf8a4c; outline-offset: 2px` — видимый, брендовый
- **Зерновая текстура** (`.grain`) — 4% opacity поверх фона, убирает «ИИ-плоскостность»
- **Переходы** — 0.16s ease на цвет/фон, 0.12s ease на transform

---

## 8. Запрещено

- Синий акцент `#2563eb` — удалён, не возвращать.
- Градиенты на поверхностях и кнопках.
- Glassmorphism и backdrop-blur на основном контенте.
- `:hover` как единственный способ показать действия — свотчи должны работать на тач.
- Тени на карточках в состоянии покоя.
- JetBrains Mono для чего-либо кроме числовых значений.
