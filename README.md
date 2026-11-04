# Demokira — сайт

Автономная статическая версия сайта. Без сборки и без зависимостей: HTML, CSS, JS и ассеты.

## Как опубликовать

1. Залей всё содержимое этой папки в корень сайта на любом статическом хостинге
   (Cloudflare Pages, Netlify, Vercel, обычный nginx, GitHub Pages).
2. В настройках хостинга привяжи свой домен и включи HTTPS.
3. Точка входа — `index.html`. Всё остальное должно лежать рядом с ним.

Локальная проверка:

```bash
python3 -m http.server 8080
```

и открой `http://localhost:8080`.

## Что где

- `index.html` — вся разметка и тексты.
- `styles.css` — оформление, CRT-эффекты, адаптив.
- `script.js` — прокрутка фильма в hero и кнопка copy для кошелька.
- `assets/world/scene-01.mp4` — фильм для десктопа (15 секунд).
- `assets/world/scene-01-mobile.mp4` — вертикальная версия для телефонов.
- `assets/covers/` — обложки релизов и игр.
- `assets/icon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — иконки сайта.
- `icons/` — иконки соцсетей для футера.

## Как править

Тексты и ссылки — прямо в `index.html`. Обложку релиза можно заменить файлом
с тем же именем в `assets/covers/`. Фильм — заменить `scene-01.mp4` (desktop)
и `scene-01-mobile.mp4` (mobile), постеры `scene-01-poster.png` и
`scene-01-mobile-poster.png` должны быть первым кадром соответствующего клипа.

Шрифты подключены с Google Fonts. Если нужен полный офлайн, скачай woff2
и замени `@import` в начале `styles.css` на локальные `@font-face`.

Кошелёк и кнопка copy — в блоке `foot__wallet` в конце `index.html`.
