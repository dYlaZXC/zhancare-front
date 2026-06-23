# План устранения находок ИБ-аудита

Рабочий чек-лист по находкам из `docs/audit.html` (ИБ-аудит, июнь 2026).
Лежит отдельно от HTML-сайта документации как обычный markdown, чтобы было
удобно отмечать прогресс прямо в IDE/git. Полные описания каждой находки —
в `docs/audit.html`, здесь — только план действий и статус.

Не публичный документ — не копировать в `zhancare-back/docs/` (та папка
содержит `CNAME` → `zhan.care`, потенциально публикуется как статический сайт).

---

## Статус на 2026-06-23

| Severity | zhancare-back | zhancareai | academy-refined |
|---|---|---|---|
| CRITICAL | ~~4~~ → **3 открыто** (1 закрыт) | 1 открыто | 0 |
| HIGH | 5 открыто | 2 открыто | 1 открыто |
| MEDIUM | 6 открыто | 3 открыто | 3 открыто |
| LOW | 1 открыто | 3 открыто | 2 открыто |

**Закрыто:**
- [x] **zhancare-back CRITICAL — захардкоженные секреты в `settings.py`.**
  Все значения (`SECRET_KEY`, `MISTRAL_API_KEY`, `TELEGRAM_BOT_TOKEN`,
  `LIVEKIT_URL`/`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`, `EMAIL_HOST_USER`/
  `EMAIL_HOST_PASSWORD`, `TIPTOP_PUBLIC_ID`/`TIPTOP_API_SECRET`, `DB_PASSWORD`)
  перенесены в `.env` (не в git), в коде теперь `os.environ[...]` —
  падает с понятной ошибкой при старте, если переменная не задана.
  Также удалён мёртвый закомментированный блок с тем же паролем БД.
  Побочная находка: SSH-пароль от прод-сервера (`94.131.81.77`) был в
  комментарии в том же блоке — удалён из кода, **но сам пароль ещё не сменён
  на сервере, см. задачу ниже**.

**Ещё не сделано, но статус изменился:**
- [ ] **Ротация самих секретов.** Перенос в `.env` останавливает *новую*
  утечку через репозиторий, но все значения уже были в git-истории — считать
  скомпрометированными. Нужно сгенерировать новые: Django `SECRET_KEY`,
  Mistral API key (текущий уже мёртв, 401), Telegram bot token (через
  @BotFather `/revoke`), LiveKit key pair, email app-пароль, TipTopPay
  ключи (через merchant-кабинет), пароль БД, **SSH-пароль сервера
  `94.131.81.77` (был `adilan10` в комментарии в коде — однозначно сменить)**.
  После ротации SECRET_KEY — инвалидировать все текущие JWT/сессии.

---

## Приоритет 1 — Critical, до следующего деплоя (zhancare-back)

- [ ] **TipTopPay webhook fail-open.** `payments/views.py:121-133`
  (`_verify_tiptop_hmac`) возвращает `True`, если секрет не задан ИЛИ
  заголовок HMAC отсутствует. Фикс: отклонять запрос в обоих случаях.
  Тест: POST на webhook без заголовка HMAC должен возвращать ошибку, а не
  обрабатываться как валидный.

- [ ] **Брутфорсимый гостевой вход `verify_access_code`.**
  `consultations/views.py:1420-1488`, `consultations/models.py:10-15`.
  Фикс: `ScopedRateThrottle` (5/мин по IP + общий лимит по коду),
  `secrets.choice` вместо `random.choices`, lockout после N неудачных
  попыток на код. Тест: 6-я попытка подряд → 429; код, сгенерированный до
  фикса, не должен внезапно перестать работать (обратная совместимость по
  формату не нужна, только по генератору).

- [ ] **IDOR в профиле пользователя.** `common/views/profile.py:96-108,163-178`
  (`profile_by_id`, `update_profile_by_id`) — нет проверки владения/роли.
  Фикс: явная проверка `request.user.id == user_id or request.user.is_admin()`
  перед обработкой. Параллельно — аудит `UserProfileSerializer.fields`/
  `read_only_fields` на предмет полей типа роли, доступных на запись.
  Тест: пользователь A не может GET/PUT профиль пользователя B без admin-роли.

## Приоритет 2 — High (zhancare-back)

- [ ] Пароль БД в `docs/DEPLOYMENT_GUIDE.md:161` → заменить на плейсхолдер.
- [ ] Идемпотентность Pay-webhook по `transaction_id` (`payments/views.py:197-241`)
      — уникальный constraint/проверка перед обработкой.
- [ ] Kaspi: проверка подписи входящих вызовов, реальный QR/service ID вместо
      заглушки, сверка суммы на сервере (`payments/views.py:37-116`).
- [ ] Presigned upload медиадокументов: allow-list MIME/расширений для
      `file_type`, `os.path.basename()` на `filename`
      (`common/views/medical_documents.py:205-273`,
      `common/serializers/medical_document.py:95-101`).
- [ ] `doctor_upload`/`admin_upload` без валидации типа/размера файла —
      применить тот же валидатор, что в `profile.py:147-152`/`clinics/views.py:768-773`
      (`common/views/medical_documents.py:306-322,338-371`).

## Приоритет 3 — High (zhancareai, academy-refined)

- [ ] **zhancareai — живые секреты в закоммиченном `.env`** (Mistral key,
      Sentry auth token, `zhancareai/.env:1-3`). Добавить `.env` в
      `.gitignore`, ротировать оба, почистить git-историю
      (`git filter-repo`/BFG).
- [ ] **zhancareai — XSS в Leaflet-попапе** admin-карты клиник
      (`src/app/admin/pipeline/page.tsx:995-1018`) — собирать попап через
      DOM/`textContent` или DOMPurify вместо строковой HTML-конкатенации.
      Заодно добавить `rel="noopener noreferrer"` на `instagram`-ссылку
      в том же попапе (MEDIUM, тот же файл, строка 1018).
- [ ] **zhancareai — нет CSRF-токена в `src/utils/api.ts`.** Читать
      `csrftoken` cookie, подвешивать `X-CSRFToken` на non-GET запросы в
      request-интерсепторе.
- [ ] **academy-refined — `apiLogin`/`apiRefreshToken` без
      `credentials: "include"`** (`lib/api/auth.ts:64,180`) — из-за этого
      httpOnly cookie-аутентификация, скорее всего, никогда не срабатывает
      для пользователей academy. Добавить `credentials: "include"` в оба
      вызова (и для единообразия — в остальные auth-вызовы того же файла).

## Приоритет 4 — Medium (все репозитории)

- [ ] zhancare-back: Pay-webhook не сверяет `Amount` перед статусом «paid»
      (только Check-webhook это делает) — `payments/views.py`.
- [ ] zhancare-back: `.env`/`.env.prod` с реальными ключами на диске —
      убедиться, что не попадают в Docker-образ/бэкап; рассмотреть secrets
      manager (Vault/Yandex Lockbox) для продакшена.
- [ ] zhancare-back: единый валидатор загрузки файлов вместо разрозненной
      проверки в разных view.
- [ ] zhancare-back: `ALLOWED_HOSTS` — сузить wildcard `.vercel.app`
      (`settings.py`) до конкретного хоста, если используется.
- [ ] zhancare-back: закрепить версии в `requirements.txt`
      (`pip freeze` / `pip-tools`/`poetry`), прогнать `pip-audit`.
- [ ] zhancareai: согласовать версии `next`/`react`/`eslint-config-next` в
      `package.json`, прогнать `npm audit --audit-level=high`.
- [ ] academy-refined: гейтить `loadCourses`/`loadCategories` ролью на
      admin-странице так же, как уже сделано для `loadTeachers`
      (`app/[lang]/(dashboard)/admin/page.tsx:1960-1986`).
- [ ] academy-refined: подтвердить с backend-командой семантику
      cookie-vs-header auth; при необходимости — double-submit CSRF.
- [ ] academy-refined: проверить, что `next 16.0.10`/`react 19.2.0` — GA,
      не canary/pre-release по ошибке.

## Приоритет 5 — Low (все репозитории, по мере свободного времени)

- [ ] zhancare-back: убрать debug `print()` с User/ролью в
      `consultations/views.py:47-53` (PII в логах).
- [ ] zhancareai: заменить `dangerouslySetInnerHTML` (`\n`→`<br/>`) на
      `whitespace-pre-wrap` в `ChatBox.tsx`/`PatientChatBox.tsx`/`DoctorChatBox.tsx`.
- [ ] zhancareai: если `?next=` в `middleware.ts:59` когда-нибудь подключат
      на странице логина — валидировать как относительный same-origin путь.
- [ ] academy-refined: `<Link target="_blank">` без `rel`
      (`admin/page.tsx:2308`) — добавить `rel="noopener noreferrer"`.
- [ ] academy-refined: рассмотреть замену `i18n@^0.15.3` на `next-intl`.

---

## После закрытия всех пунктов

1. Обновить счётчики и оценку 0–100 в `docs/audit.html` (формула там же).
2. Прогнать `security-reviewer` ещё раз на затронутые файлы — не на весь
   репозиторий заново, только diff.
3. Закрыть задачу по ротации секретов отдельным пунктом — она не зависит от
   остального кода и может идти параллельно.
