-- ============================================================
-- Migration: 001_initial_schema.sql
-- Açıklama: Kullanıcılar, yiyecekler, öğün logları
-- Çalıştır: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Uzantılar ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy text search için

-- ── Tablolar ─────────────────────────────────────────────────

-- Kullanıcı profilleri (auth.users ile 1:1)
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  age             smallint check (age > 0 and age < 130),
  gender          text check (gender in ('male', 'female', 'other')),
  height_cm       numeric(5,1) check (height_cm > 0),
  weight_kg       numeric(5,1) check (weight_kg > 0),
  activity_level  text check (activity_level in ('sedentary','light','moderate','active','very_active'))
                  default 'moderate',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Günlük kalori/makro hedefleri
create table public.user_goals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  daily_calories  integer not null check (daily_calories > 0),
  protein_g       numeric(6,1) not null default 0,
  carbs_g         numeric(6,1) not null default 0,
  fat_g           numeric(6,1) not null default 0,
  valid_from      date not null default current_date,
  created_at      timestamptz default now()
);

-- Yiyecek veritabanı (API cache + kullanıcı ekleri)
create table public.foods (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  name_normalized     text generated always as (lower(trim(name))) stored,
  brand               text,
  meal_types          text[] default '{}',   -- ['breakfast','lunch','dinner','snack']
  category            text,                  -- 'chicken','meat','fish','vegan','pastry','dairy','legume'
  calories_per_100g   numeric(7,2) not null check (calories_per_100g >= 0),
  protein_per_100g    numeric(7,2) not null default 0,
  carbs_per_100g      numeric(7,2) not null default 0,
  fat_per_100g        numeric(7,2) not null default 0,
  fiber_per_100g      numeric(7,2) default 0,
  image_url           text,
  api_source          text check (api_source in ('open_food_facts','edamam','manual')),
  external_id         text,
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz default now(),
  -- Duplicate önleme: aynı kaynak + dış ID tekrar girilemesin
  unique (api_source, external_id)
);

-- Öğün logları (gün + öğün tipi başlığı)
create table public.meal_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  log_date    date not null default current_date,
  meal_type   text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  created_at  timestamptz default now(),
  -- Aynı gün+kullanıcı+öğün için tek kayıt
  unique (user_id, log_date, meal_type)
);

-- Öğün log kalemleri (snapshot: o andaki makro değerlerini sakla)
create table public.meal_log_items (
  id            uuid primary key default uuid_generate_v4(),
  meal_log_id   uuid not null references public.meal_logs(id) on delete cascade,
  food_id       uuid not null references public.foods(id) on delete restrict,
  quantity_g    numeric(7,1) not null check (quantity_g > 0),
  portion_size  numeric(4,2) not null default 1.0, -- 0.5, 1, 2
  -- Snapshot: food değişse bile log doğru kalır
  calories      numeric(7,1) not null,
  protein_g     numeric(7,2) not null default 0,
  carbs_g       numeric(7,2) not null default 0,
  fat_g         numeric(7,2) not null default 0,
  fiber_g       numeric(7,2) default 0,
  logged_at     timestamptz default now()
);
