# NutriTrack — Kurulum ve Deployment Kılavuzu

## Proje Yapısı

```
nutritrack/
├── app/
│   ├── layout.tsx              # Root layout, AppNav, metadata
│   ├── loading.tsx             # Global skeleton loading
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 sayfası
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── callback/route.ts   # E-posta doğrulama geri dönüşü
│   ├── search/page.tsx         # Ana arama sayfası
│   ├── log/page.tsx            # Günlük takip sayfası
│   ├── profile/page.tsx        # Kullanıcı profili
│   └── api/
│       └── foods/
│           ├── search/route.ts        # GET /api/foods/search
│           └── barcode/[code]/route.ts
├── components/
│   ├── AppNav.tsx
│   ├── FilterPanel.tsx
│   └── FoodCard.tsx
├── hooks/
│   ├── useCalorieCalculator.ts
│   ├── useFoodSearch.ts
│   └── useAuth.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── database.types.ts
│   ├── services/
│   │   ├── foodsService.ts
│   │   ├── mealLogService.ts
│   │   └── profileService.ts
│   └── api/
│       ├── openFoodFacts.ts
│       └── foodAggregator.ts
├── styles/
│   ├── auth.css
│   ├── search.css
│   └── profile-log.css
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_indexes_rls_triggers.sql
├── public/
│   └── manifest.json
├── middleware.ts
├── next.config.ts
├── vercel.json
└── .env.local.example
```

---

## 1. Yerel Kurulum

### Gereksinimler
- Node.js 18+
- npm veya pnpm

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env.local dosyasını oluştur
cp .env.local.example .env.local

# 3. .env.local'i düzenle (Supabase bilgilerini gir — aşağıya bak)

# 4. Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:3000
```

---

## 2. Supabase Kurulumu

### 2a. Proje oluştur
1. [supabase.com](https://supabase.com) → New project
2. İsim: `nutritrack`, Region: `eu-central-1` (Frankfurt)
3. Güçlü bir DB şifresi seç ve kaydet

### 2b. Migration'ları çalıştır
Supabase Dashboard → SQL Editor:

```sql
-- Önce bu dosyayı yapıştır ve çalıştır:
-- supabase/migrations/001_initial_schema.sql

-- Ardından bu dosyayı:
-- supabase/migrations/002_indexes_rls_triggers.sql
```

### 2c. Auth ayarları
Dashboard → Authentication → URL Configuration:
```
Site URL:          https://nutritrack.vercel.app
Redirect URLs:     https://nutritrack.vercel.app/auth/callback
                   http://localhost:3000/auth/callback
```

### 2d. API bilgilerini al
Dashboard → Project Settings → API:
- `Project URL`    → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public`    → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3. Vercel Deployment

### 3a. Vercel CLI ile

```bash
# Vercel CLI yükle
npm i -g vercel

# Deploy
vercel

# Environment variable'ları ekle
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Production deploy
vercel --prod
```

### 3b. GitHub entegrasyonu ile (önerilen)
1. Kodu GitHub'a push et
2. [vercel.com](https://vercel.com) → Import Repository
3. Environment Variables kısmına Supabase bilgilerini gir
4. Deploy → otomatik CI/CD kurulur

---

## 4. Supabase TypeScript tiplerini güncelle

Migration ekledikten sonra tipleri yenile:

```bash
# Supabase CLI gerekli: npm i -g supabase
supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  > lib/supabase/database.types.ts
```

---

## 5. Ortam Değişkenleri Referansı

| Değişken | Açıklama | Zorunlu |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✓ |
| `NEXT_PUBLIC_OFF_API_BASE` | Open Food Facts base URL | — |
| `NEXT_PUBLIC_APP_URL` | Uygulamanın public URL'i | — |

---

## 6. Sık Karşılaşılan Sorunlar

**`supabase client` hatası:**
`.env.local` dosyasında `NEXT_PUBLIC_` prefix'inin tam olduğuna emin ol.

**RLS politikası hatası (`row-level security policy`):**
Kullanıcı giriş yapmamış olabilir. `useAuth` ile oturumu kontrol et.

**Open Food Facts sonuç gelmiyor:**
CORS engeli değil, rate limit olabilir. `cacheThreshold`'u artır veya Supabase'deki seed veriyle çalış.

**`handle_new_user` trigger çalışmıyor:**
`002_indexes_rls_triggers.sql` migration'ının çalıştırıldığını doğrula.

---

## 7. Geliştirme Yol Haritası (opsiyonel iyileştirmeler)

- [ ] Edamam API entegrasyonu (daha zengin makro verisi)
- [ ] Barkod tarama (mobil kamera)
- [ ] Haftalık/aylık istatistik grafikleri
- [ ] Öğün planı oluşturma
- [ ] Push notification (günlük hatırlatıcı)
- [ ] Google/Apple ile sosyal giriş
- [ ] Offline mod (Service Worker)
