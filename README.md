# Анкета для пациентов (GitHub Pages)

Статические файлы для **отдельного** репозитория GitHub (не смешивать с репозиторием бэкапов/публикаций планов).

## Содержимое

- `index.html` — страница анкеты
- `config.json` — профили лечения, подписи к ключам, **`submitEndpoint`** и опционально **`submitClientKey`**
- `app.js` — шаги анкеты; по «Готово» отправка `rukya_questionnaire_v1` на Worker (**JSON пациенту не показывается**)
- `styles.css` — оформление

Текст `deepseek.userMessage` в сохраняемом JSON должен совпадать с `buildDiagnosisUserMessage` в [`../js/engine/deepseek.js`](../js/engine/deepseek.js). При изменении шаблона в приложении обновите пару строк в `app.js` (блок с жалобами и анкетой).

## Сервер отправки (обязательно для записи в GitHub)

Токен GitHub **нельзя** встраивать в эту статику. Разверните Cloudflare Worker из [`../questionnaire-submitter/`](../questionnaire-submitter/README.md), затем в `config.json` укажите:

```json
"submitEndpoint": "https://ваш-worker.workers.dev/",
"submitClientKey": ""
```

Если на Worker задан секрет `SUBMIT_SECRET`, укажите то же значение в `submitClientKey` (оно будет в открытом config — это слабый антиспам, не путать с GitHub-токеном).

Файлы появляются в репозитории в папке `submissions/`. Импорт в RUKYA: **Импорт JSON** (скачать raw-файл или через GitHub вручную) или эксперт-режим **GitHub Pages**.

## Публикация

1. Создайте репозиторий под Pages (часто **публичный** для бесплатного Pages; данные пациентов тогда лучше не класть в открытый raw — см. приватный репо + Worker в приватный репо).
2. Скопируйте `index.html`, `config.json`, `app.js`, `styles.css` в корень (или в `docs/` при такой настройке Pages).
3. **Settings → Pages**: ветка и папка.
4. В `config.json` пропишите рабочий `submitEndpoint` после деплоя Worker.

## RUKYA PRO

**Настройки → GitHub → Репозиторий анкет** — ссылка на этот репозиторий Pages.

**Импорт JSON** — кнопка **Анкета (Pages)** открывает страницу; готовые ответы лекарь берёт из `submissions/*.json` в том же репозитории (через GitHub), затем импортирует файл в приложение.

Формат `rukya_questionnaire_v1` описан в [`../js/ui/import.js`](../js/ui/import.js).
