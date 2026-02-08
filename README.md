<p align="center">
  <img src="public/logosaas.png" alt="ZhanCare Logo" width="120" height="120" />
</p>

<h1 align="center">ZhanCare AI</h1>

<p align="center">
  <strong>Умная платформа телемедицины нового поколения</strong>
</p>

<p align="center">
  <a href="#features">Возможности</a> •
  <a href="#tech-stack">Технологии</a> •
  <a href="#installation">Установка</a> •
  <a href="#screenshots">Скриншоты</a> •
  <a href="#api">API</a> •
  <a href="#contact">Контакты</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Django-5-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI_Powered-Mistral-FF6B35?style=for-the-badge" alt="AI Powered" />
  <img src="https://img.shields.io/badge/Video_Calls-WebRTC-333333?style=for-the-badge" alt="WebRTC" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

---

## 🏥 О проекте

**ZhanCare AI** — это комплексная SaaS-платформа для телемедицины, объединяющая искусственный интеллект, видеоконсультации и управление медицинскими учреждениями в единую экосистему.

Платформа предназначена для:
- 🏨 **Клиник** — управление персоналом, пациентами и записями
- 👨‍⚕️ **Врачей** — проведение онлайн-консультаций и ведение пациентов
- 👩‍⚕️ **Медсестер** — управление записями на дом
- 👤 **Пациентов** — удобный доступ к медицинским услугам

---

<h2 id="features">✨ Возможности</h2>

### 🤖 AI-функции
| Функция | Описание |
|---------|----------|
| **AI Ассистент** | Умный чат-бот для первичной консультации |
| **Проверка симптомов** | AI-анализ симптомов с рекомендациями |
| **Протоколы лечения** | Поиск по медицинским протоколам с AI |

### 📹 Телемедицина
| Функция | Описание |
|---------|----------|
| **Видеоконсультации** | HD видеозвонки врач-пациент (WebRTC) |
| **Запись на прием** | Умное расписание с учетом занятости |
| **Чат с врачом** | Мгновенные сообщения и обмен файлами |

### 🏢 Для клиник
| Функция | Описание |
|---------|----------|
| **Управление персоналом** | Добавление врачей и медсестер |
| **Аналитика и отчеты** | Доходы, консультации, статистика |
| **Мультиклиника** | Поддержка сети клиник |
| **Записи на дом** | Выезд медсестер к пациентам |

### 🔐 Безопасность
| Функция | Описание |
|---------|----------|
| **JWT Аутентификация** | Безопасные токены с автообновлением |
| **Мультисессии** | Управление устройствами пользователя |
| **Шифрование** | Защита персональных данных |

---

<h2 id="tech-stack">🛠 Технологии</h2>

### Frontend
```
Next.js 15        — React-фреймворк с SSR
React 19          — UI библиотека
TypeScript 5      — Типизация
TailwindCSS 3     — Стилизация
Framer Motion     — Анимации
Recharts          — Графики и диаграммы
```

### Backend
```
Django 5          — Python веб-фреймворк
DRF               — REST API
SimpleJWT         — JWT аутентификация
PostgreSQL        — База данных
Redis             — Кэширование
```

### AI & Real-time
```
Mistral AI        — LLM для умных функций
WebRTC            — Видеозвонки
WebSockets        — Real-time уведомления
```

### Интеграции
```
Kaspi Pay         — Платежи
Telegram Bot      — Уведомления
SMS Gateway       — SMS-оповещения
```

---

<h2 id="installation">🚀 Установка</h2>

### Требования
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis

### Frontend

```bash
# Клонировать репозиторий
git clone https://github.com/zhancare/zhancareai.git
cd zhancareai

# Установить зависимости
yarn install

# Настроить переменные окружения
cp .env.example .env.local

# Запустить dev-сервер
yarn dev
```

### Backend

```bash
# Перейти в backend директорию
cd ../experimental_admin_back

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
.\venv\Scripts\activate   # Windows

# Установить зависимости
pip install -r requirements.txt

# Применить миграции
python manage.py migrate

# Запустить сервер
python manage.py runserver
```

### Переменные окружения

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Backend (.env)
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@localhost:5432/zhancare
MISTRAL_API_KEY=your-mistral-key
```

---

<h2 id="screenshots">📸 Скриншоты</h2>

<details>
<summary>🏠 Главная страница</summary>
<br>
<img src="docs/screenshots/home.png" alt="Home Page" width="100%" />
</details>

<details>
<summary>💬 AI Консультант</summary>
<br>
<img src="docs/screenshots/ai-chat.png" alt="AI Chat" width="100%" />
</details>

<details>
<summary>📹 Видеоконсультация</summary>
<br>
<img src="docs/screenshots/video-call.png" alt="Video Call" width="100%" />
</details>

<details>
<summary>📊 Админ-панель</summary>
<br>
<img src="docs/screenshots/admin.png" alt="Admin Dashboard" width="100%" />
</details>

---

<h2 id="api">📡 API Endpoints</h2>

### Аутентификация
```http
POST   /api/v1/auth/login/          # Вход
POST   /api/v1/auth/logout/         # Выход
POST   /api/v1/auth/token/refresh/  # Обновление токена
GET    /api/v1/sessions/            # Список сессий
```

### Персонал
```http
GET    /api/v1/staff/               # Список персонала
POST   /api/v1/staff/               # Добавить сотрудника
PATCH  /api/v1/staff/{id}/          # Обновить сотрудника
DELETE /api/v1/staff/{id}/          # Удалить сотрудника
```

### Консультации
```http
GET    /api/v1/consultations/       # Список консультаций
POST   /api/v1/consultations/       # Создать консультацию
GET    /api/v1/doctors/             # Список врачей
```

### Отчеты
```http
GET    /api/v1/reports/             # Аналитика и статистика
```

---

## 📁 Структура проекта

```
zhancareai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── video-call/        # Видеозвонки
│   │   └── page.tsx           # Главная страница
│   ├── components/
│   │   ├── services/          # Бизнес-компоненты
│   │   │   ├── admin/         # Админ-панель
│   │   │   ├── consultations/ # Консультации
│   │   │   └── profile/       # Профиль
│   │   ├── auth/              # Аутентификация
│   │   └── ui/                # UI компоненты
│   ├── sections/              # Секции лендинга
│   ├── context/               # React Context
│   └── utils/                 # Утилиты
├── public/                    # Статические файлы
└── docs/                      # Документация
```

---

## 🌍 Локализация

Платформа поддерживает три языка:

| Язык | Код | Статус |
|------|-----|--------|
| 🇷🇺 Русский | `ru` | ✅ Полная |
| 🇰🇿 Қазақша | `kz` | ✅ Полная |
| 🇬🇧 English | `en` | 🔄 В процессе |

---

## 🤝 Команда

<table>
  <tr>
    <td align="center">
      <strong>ZhanCare Team</strong><br>
      <sub>Разработка и поддержка</sub>
    </td>
  </tr>
</table>

---

<h2 id="contact">📬 Контакты</h2>

<p align="center">
  <a href="https://zhancare.kz">
    <img src="https://img.shields.io/badge/Website-zhancare.kz-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website" />
  </a>
  <a href="https://t.me/zhancareai">
    <img src="https://img.shields.io/badge/Telegram-@zhancareai-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  </a>
  <a href="mailto:support@zhancare.kz">
    <img src="https://img.shields.io/badge/Email-support@zhancare.kz-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
</p>

---

<p align="center">
  <sub>Built with ❤️ in Kazakhstan</sub>
</p>

<p align="center">
  <sub>© 2024-2025 ZhanCare. All rights reserved.</sub>
</p>
