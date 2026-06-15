# 🚌 Подорожник — Telegram Mini App

Удобное приложение для пользователей транспортной карты «Подорожник» (Санкт-Петербург).

## Структура проекта

```
podorozhnik/
├── mini-app/          # Telegram Mini App (фронтенд)
│   ├── index.html     # Главный файл — точка входа
│   ├── css/style.css  # Все стили
│   └── js/
│       ├── app.js        # Логика приложения
│       ├── telegram.js   # Интеграция с Telegram WebApp API
│       └── storage.js    # Локальное хранилище (localStorage)
├── bot/               # Telegram Bot (Python + aiogram 3) — Этап 1
└── docs/              # Документация
```

## Быстрый старт

1. Открой `mini-app/index.html` в браузере — работает для разработки
2. Задеплой на GitHub Pages для работы внутри Telegram
3. Настрой бота через @BotFather и укажи URL Mini App

## Хостинг

- **Mini App:** GitHub Pages (бесплатно)
- **Bot:** Railway / Render (бесплатный тир)

## Документация

Подробнее — см. `docs/PLAN.md`
