# План устранения находок ИБ-аудита

Рабочий чек-лист по находкам из `docs/audit.html` (ИБ-аудит, июнь 2026).
Лежит отдельно от HTML-сайта документации как обычный markdown, чтобы было
удобно отмечать прогресс прямо в IDE/git. Полные описания каждой находки —
в `docs/audit.html`, здесь — только план действий и статус.

Не публичный документ — не копировать в `zhancare-back/docs/` (та папка
содержит `CNAME` → `zhan.care`, потенциально публикуется как статический сайт).

---

## Статус на 2026-06-24

| Severity | zhancare-back | zhancareai | academy-refined |
|---|---|---|---|
| CRITICAL | ~~4~~ → **0 открыто** ✅ | 1 открыто | 0 |
| HIGH | ~~5~~ → **3 открыто** (2 закрыто) | 2 открыто | 1 открыто |
| MEDIUM | 6 открыто (часть подтверждена не-проблемой, см. ниже) | 3 открыто | 3 открыто |
| LOW | 1 открыто | 3 открыто | 2 открыто |

**Все 4 CRITICAL в zhancare-back закрыты:**
- [x] **Захардкоженные секреты в `settings.py`.** Все значения
  (`SECRET_KEY`, `MISTRAL_API_KEY`, `TELEGRAM_BOT_TOKEN`,
  `LIVEKIT_URL`/`LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`, `EMAIL_HOST_USER`/
  `EMAIL_HOST_PASSWORD`, `TIPTOP_PUBLIC_ID`/`TIPTOP_API_SECRET`, `DB_PASSWORD`)
  перенесены в `.env` (не в git), в коде теперь `os.environ[...]`.
  При повторном поиске по репозиторию нашлись и зачищены **ещё ~15 копий**
  тех же секретов в других файлах, не пойманных первым проходом аудита:
  `telegram_bot/bot_instance.py` (активный хардкод-fallback в коде, не только
  в settings.py), `telegram_bot/bot_old.py` (мёртвый файл с третьим токеном —
  **удалён целиком**), `docker-compose.yml`, `.env.prod.example`,
  `docs/PRODUCTION_SETUP.md` (плюс отдельный е-мейл/пароль, не встречавшийся
  раньше), `docs/TELEGRAM_BOT_FIX.md`, `docs/DEPLOYMENT_INSTRUCTIONS.md`,
  `docs/DEPLOYMENT_GUIDE.md`, `docs/one_time_scripts/{setup_local_db.sh,
  clinical_protocolssss.py,ml_pipeline.py}`. Также почищен и
  **`.sourcecraft/ci.yaml`** (Telegram-токен в деплой-уведомлениях →
  `${{ secrets.CI_TELEGRAM_BOT_TOKEN }}` — **нужно добавить этот секрет в
  настройках SourceCraft CI до следующего push в main**, иначе уведомления
  о деплое замолчат, сам деплой не сломается).
- [x] **TipTopPay webhook fail-open.** `_verify_tiptop_hmac` больше не
  возвращает `True` при отсутствии секрета/заголовка — оба случая теперь
  отказ. Заодно добавлена идемпотентность (повторный webhook на уже
  оплаченный `invoice_id` — no-op) и сверка `Amount` перед `status='paid'`
  (раньше это делал только Check-webhook, не Pay-webhook).
- [x] **Брутфорс `verify_access_code`.** `secrets.choice` вместо
  `random.choices` в генераторе кода; добавлен `ScopedRateThrottle` (5/мин
  по IP) + отдельный глобальный throttle (30/мин по всей платформе,
  независимо от IP) — закрывает и одиночного атакующего, и распределённый
  перебор с разных IP. Тест добавлен в `consultations/tests.py`
  (не прогонялся — БД недоступна из этого sandbox).
- [x] **IDOR в профиле.** Оказалось на 1 эндпоинт больше, чем нашёл аудит —
  `partial_update_profile_by_id` (PATCH) имел тот же баг, что
  `profile_by_id`/`update_profile_by_id`. У `UserProfileViewSet` не было
  вообще никакого `permission_classes` на уровне класса (DRF-дефолт —
  `AllowAny`), так что баг был хуже описанного: не просто IDOR между
  пользователями, а потенциально доступно неавторизованным вовсе. Добавлен
  `IsAuthenticated` + проверка `self-or-admin` на все 3 эндпоинта. Заодно
  проверил `UserProfileSerializer` — поля типа `role`/`is_staff` там
  отсутствуют, `roles` — read-only `SerializerMethodField`, так что
  MEDIUM-пункт «аудит writable-полей» закрыт как **не баг**. Тест добавлен
  в `common/tests.py`.

**Дополнительно (не из исходного аудита, найдено в процессе):**
- [x] **Прод-инцидент 2026-06-24: логин лежал с 500.** `django_core_prod` не
  мог зарезолвить хост `redis` — в `docker-compose.prod.yml` сервиса `redis`
  никогда не было, хотя `REDIS_URL` в живом `.env.prod` на него указывал.
  Добавлен реальный сервис `redis` в `docker-compose.prod.yml` (без
  публичного порта). `common/authentication.py` — все обращения к кэшу
  сессии обёрнуты в try/except: падение Redis больше не валит сайт 500-кой
  на каждый авторизованный запрос, деградирует до прямого похода в БД.
  Также `DEBUG=True` был прописан прямо в `docker-compose.prod.yml` для
  прода — поменян на `False`.
- [x] Третий найденный Telegram-токен и SSH-пароль от прод-сервера
  (`94.131.81.77` / `adilan10`, был в комментарии в коде, уже удалён) — все
  требуют ротации, см. пункт ниже.

**Ещё не сделано — ротация самих секретов:**
- [ ] Перенос в `.env`/исправление кода останавливает *новую* утечку через
  репозиторий, но все значения уже были в git-истории — считать
  скомпрометированными. Нужно сгенерировать новые: Django `SECRET_KEY`,
  Mistral API key (текущий уже мёртв, 401), **3 разных Telegram bot token**
  (через @BotFather `/revoke` на каждый), LiveKit key pair, email
  app-пароль(и — нашлось 2 разных email-аккаунта), TipTopPay ключи (через
  merchant-кабинет), пароль БД, **SSH-пароль сервера `94.131.81.77`**.
  После ротации SECRET_KEY — инвалидировать все текущие JWT/сессии.
- [ ] Добавить секрет `CI_TELEGRAM_BOT_TOKEN` в настройках SourceCraft CI
  (см. выше) — иначе уведомления о деплое не отправятся.

**Независимый review сегодняшнего диффа (security-reviewer) — найдено и закрыто:**
- [x] `int(float(amount))` усекал, а не округлял сумму платежа в обоих
  webhook'ах TipTopPay — `round(float(amount))` вместо truncating cast
  (`payments/views.py`, 2 места).
- [x] `content-length-range` в S3 presigned-policy был захардкожен на 10MB,
  а новый `validate_uploaded_file()` разрешал до 15MB — несовпадение могло
  давать неожиданный `EntityTooLarge` от S3 на легитимной загрузке
  11-15MB. Теперь оба читают `MEDICAL_DOCUMENT_MAX_SIZE`
  (`common/utils/storage_utils.py`).
- [x] **`AccessCodeGlobalThrottle` сам был DoS-вектором** — общий лимит
  30/мин на весь `AllowAny`-эндпоинт означал, что один клиент с простым
  циклом из 30 запросов кладёт `verify-access-code` для *всех* пациентов
  платформы сразу. Поднял лимит до 300/мин — срабатывает только на
  реально аномальный распределённый объём, а не от одного curl-цикла
  (`consultations/throttles.py`).
- [x] Добавлена проверка magic bytes (`%PDF-`, JPEG/PNG/WEBP-сигнатуры) в
  `validate_uploaded_file()` — но только когда реальные байты файла
  доступны на сервере (`doctor_upload`/`admin_upload`). Для
  `get_upload_url` (presigned URL) байтов в момент запроса ещё нет —
  архитектурно не закрывается без проксирования загрузки через backend,
  отмечено как принятое ограничение.
- [ ] **Не закрыто, низкий приоритет:** если `REDIS_URL` когда-нибудь
  окажется не задан в окружении с несколькими worker'ами, `LocMemCache`
  тихо ломает гарантию «глобального» throttle (каждый worker считает
  отдельно). Рекомендован Django system check, предупреждающий, если
  `CACHES` — `LocMemCache` при `DEBUG=False`. Не реализовано.

---

## Приоритет 1 — Critical, до следующего деплоя (zhancare-back)

✅ Все 4 пункта закрыты — см. «Статус» выше.

## Приоритет 2 — High (zhancare-back)

- [x] ~~Пароль БД в `docs/DEPLOYMENT_GUIDE.md:161`~~ — закрыто (и ещё ~10 копий того же/других секретов по репозиторию, см. «Статус»).
- [x] ~~Идемпотентность Pay-webhook по `transaction_id`~~ — закрыто вместе с fail-open фиксом.
- [ ] Kaspi: проверка подписи входящих вызовов, реальный QR/service ID вместо
      заглушки, сверка суммы на сервере (`payments/views.py:37-116`).
      **Не закрыто** — нет источника «ожидаемой» цены вызова на дом для
      сверки (ни на `HomeAppointment`, ни где-либо ещё); нужен product-инпут,
      сколько должен стоить вызов и где это хранить, прежде чем писать код.
- [x] ~~Presigned upload медиадокументов: allow-list MIME/расширений~~ —
      закрыто. Добавлен общий `validate_uploaded_file()`/`sanitize_upload_filename()`
      в `common/utils/storage_utils.py`, применён в `get_upload_url`,
      `doctor_upload` и `admin_upload` одним проходом — попутно закрывает и
      MEDIUM-пункт «несогласованная валидация между эндпоинтами» из раздела
      Medium ниже.

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

- [x] ~~zhancare-back: Pay-webhook не сверяет `Amount`~~ — закрыто вместе с
      идемпотентностью (см. Приоритет 1/Статус).
- [ ] zhancare-back: `.env`/`.env.prod` с реальными ключами на диске —
      убедиться, что не попадают в Docker-образ/бэкап; рассмотреть secrets
      manager (Vault/Yandex Lockbox) для продакшена.
- [x] ~~zhancare-back: единый валидатор загрузки файлов~~ — закрыто
      (`validate_uploaded_file()` в `storage_utils.py`).
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
