# sargis.space

Статический сайт Demokira. Хостится на GitHub Pages из ветки `master`, корень репозитория. Домен: `sargis.space`.

## Структура

- `index.html` — разметка и тексты
- `styles.css` — оформление, CRT-эффекты, адаптив
- `script.js` — процедурный осциллограф в hero и копирование кошелька
- `assets/covers/` — обложки релизов и игр
- `icons/` — иконки соцсетей в футере
- `CNAME` — домен для GitHub Pages. Не удалять.
- `.nojekyll` — отключает Jekyll. Не удалять.
- `robots.txt`, `sitemap.xml` — служебные файлы для поисковиков

## Правки

- Тексты и ссылки: `index.html`
- Обложки: заменить файл с тем же именем в `assets/covers/`
- Осциллограф в hero: canvas, рисуется в `script.js`. Видео не используется.
- Кошелёк: блок `foot__wallet` в конце `index.html`

## Локальная проверка

```bash
python3 -m http.server 8080
```

Открыть `http://localhost:8080`.

## Публикация

Закоммитить и запушить в `master`. GitHub Pages пересоберёт сайт автоматически.
Настройки Pages: ветка `master`, папка `/ (root)`, домен `sargis.space`, HTTPS включён.
