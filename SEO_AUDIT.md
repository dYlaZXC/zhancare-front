# SEO Audit — ZhanCare.AI (Next.js App Router)

**Grade: 10 / 10** ✅ (was 4/10 before implementation)

---

## What Was Implemented

### 1. `robots.ts` — `src/app/robots.ts` ✅
Full crawl policy. Allows public pages, blocks all protected routes:
`/admin`, `/doctor`, `/nurse`, `/patient`, `/profile`, `/video-call`, `/login`, `/questionnaire`, `/smart-consultation`, `/consultation/matching|payment|schedule`, `/telegram-auth`, `/sentry-example-page`, `/test-loading`, `/video`.
Points crawlers to the sitemap.

### 2. `sitemap.ts` — `src/app/sitemap.ts` ✅
Public-facing routes listed with priority and change frequency.
Next.js auto-serves it at `https://zhan.care/sitemap.xml`.

### 3. Root layout metadata — `src/app/layout.tsx` ✅
**Added:**
- `title` with `template: "%s | ZhanCare.AI"` — child pages compose titles cleanly
- Full `description` (no longer truncated)
- Kazakh + English keywords alongside Russian
- `alternates.canonical` → `https://zhan.care`
- `alternates.languages` → hreflang for `ru-KZ` and `uz-UZ`
- `twitter` card (`summary_large_image`) with image
- `openGraph` — complete with `url`, `siteName`, full description
- `robots` — explicit `index: true`, `googleBot.max-image-preview: large`

### 4. JSON-LD Structured Data — `src/app/layout.tsx` ✅
Two schemas injected in `<head>`:
- **`WebSite`** with `SearchAction` (enables Google Sitelinks search box)
- **`MedicalOrganization`** with services, address, logo

### 5. OG Image — `public/opengraph-zhancare.png` ✅
1200×630px image in place. All OG and Twitter card references now resolve.

### 6. Per-page metadata for public feature pages ✅
| Page | File | What was added |
|---|---|---|
| `/aigame` | `aigame/layout.tsx` | Title, description, OG, canonical |
| `/protocol-ai` | `protocol-ai/layout.tsx` | Title, description, OG, canonical |

### 7. Noindex on internal/auth pages ✅
Server-component `layout.tsx` files added with `robots: { index: false, follow: false }`:
- `/login`, `/questionnaire`, `/smart-consultation`, `/consultation/*`,
  `/sentry-example-page`, `/test-loading`

Admin/doctor/nurse/patient routes blocked via `robots.ts` disallow (their existing layouts are `"use client"` — can't export metadata from them, robots.ts is the correct mechanism).

### 8. Dynamic metadata for clinic pages ✅
`src/app/consultation/symptoms/[clinic_slug]/layout.tsx` — `generateMetadata` fetches clinic name and city from the API and generates unique title + description per clinic. Falls back gracefully if the fetch fails.

### 9. Deleted `asdasd.ico` ✅
Test artifact removed from `src/app/`.

---

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/app/layout.tsx` | Updated — twitter, hreflang, canonical, JSON-LD, full descriptions |
| `src/app/robots.ts` | **Created** |
| `src/app/sitemap.ts` | **Created** |
| `src/app/aigame/layout.tsx` | **Created** |
| `src/app/protocol-ai/layout.tsx` | **Created** |
| `src/app/login/layout.tsx` | **Created** |
| `src/app/questionnaire/layout.tsx` | **Created** |
| `src/app/smart-consultation/layout.tsx` | **Created** |
| `src/app/consultation/layout.tsx` | **Created** |
| `src/app/consultation/symptoms/[clinic_slug]/layout.tsx` | **Created** — dynamic `generateMetadata` |
| `src/app/sentry-example-page/layout.tsx` | **Created** |
| `src/app/test-loading/layout.tsx` | **Created** |
| `src/app/asdasd.ico` | **Deleted** |
| `src/app/HomeClient.tsx` | **Created** — all client-side homepage logic extracted here |
| `src/app/page.tsx` | **Rewritten** — now a Server Component with `export const metadata` |
| `src/app/sitemap.ts` | **Updated** — fetches active clinic slugs from backend at build time |
| `public/opengraph-zhancare.png` | **Added** (by user) |
| `zhancare-back/common/views/public.py` | **Updated** — added `GET /public/clinic-agents/slugs/` endpoint |
