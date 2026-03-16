-- ============================================================
-- Migration: 002_indexes_rls_triggers.sql
-- Açıklama: İndeksler, Row Level Security, trigger'lar, seed
-- ============================================================

-- ── İndeksler ────────────────────────────────────────────────

-- Yiyecek arama: trigram index (fuzzy search)
create index idx_foods_name_trgm
  on public.foods using gin (name_normalized gin_trgm_ops);

-- Yiyecek arama: tam eşleşme hızlandırma
create index idx_foods_category
  on public.foods (category) where category is not null;

create index idx_foods_meal_types
  on public.foods using gin (meal_types);

-- Log sorguları: kullanıcı + tarih bazlı
create index idx_meal_logs_user_date
  on public.meal_logs (user_id, log_date desc);

-- Log kalemleri: log bazlı
create index idx_meal_log_items_log
  on public.meal_log_items (meal_log_id);

-- Hedefler: kullanıcı + tarih bazlı
create index idx_user_goals_user_date
  on public.user_goals (user_id, valid_from desc);

-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.user_goals     enable row level security;
alter table public.foods          enable row level security;
alter table public.meal_logs      enable row level security;
alter table public.meal_log_items enable row level security;

-- profiles: sadece kendi profiline eriş
create policy "Kullanıcı kendi profilini okur"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Kullanıcı kendi profilini günceller"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Kullanıcı kendi profilini oluşturur"
  on public.profiles for insert
  with check (auth.uid() = id);

-- user_goals: kendi hedefleri
create policy "Kullanıcı kendi hedeflerini yönetir"
  on public.user_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- foods: herkes okur, giriş yapan ekler, kendi eklediğini düzenler
create policy "Herkes yiyecekleri okur"
  on public.foods for select
  using (true);

create policy "Giriş yapan yiyecek ekler"
  on public.foods for insert
  with check (auth.uid() is not null);

create policy "Kullanıcı kendi eklediğini günceller"
  on public.foods for update
  using (auth.uid() = created_by);

-- meal_logs: kendi logları
create policy "Kullanıcı kendi loglarını yönetir"
  on public.meal_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- meal_log_items: meal_log sahibi üzerinden erişim
create policy "Kullanıcı kendi log kalemlerini yönetir"
  on public.meal_log_items for all
  using (
    exists (
      select 1 from public.meal_logs ml
      where ml.id = meal_log_id
        and ml.user_id = auth.uid()
    )
  );

-- ── Trigger: profiles.updated_at otomatik güncelleme ─────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── Trigger: Yeni auth user → otomatik profil oluştur ────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed: Örnek yiyecekler ────────────────────────────────────

insert into public.foods
  (name, brand, meal_types, category, calories_per_100g,
   protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, api_source)
values
  ('Tavuk Göğsü', 'Taze', array['lunch','dinner'], 'chicken',
   165, 31, 0, 3.6, 0, 'manual'),
  ('Pirinç (Pişmiş)', null, array['lunch','dinner'], 'vegan',
   130, 2.7, 28, 0.3, 0.4, 'manual'),
  ('Yulaf Ezmesi', 'Doğal', array['breakfast','snack'], 'vegan',
   389, 17, 66, 7, 10.6, 'manual'),
  ('Yumurta (Haşlanmış)', null, array['breakfast','snack'], 'dairy',
   155, 13, 1.1, 11, 0, 'manual'),
  ('Somon Fileto', null, array['lunch','dinner'], 'fish',
   208, 20, 0, 13, 0, 'manual'),
  ('Tam Buğday Ekmeği', null, array['breakfast','snack'], 'pastry',
   247, 13, 41, 4.2, 6.8, 'manual'),
  ('Mercimek (Pişmiş)', null, array['lunch','dinner'], 'legume',
   116, 9, 20, 0.4, 7.9, 'manual'),
  ('Kıyma (Yağsız)', null, array['lunch','dinner'], 'meat',
   215, 26, 0, 12, 0, 'manual'),
  ('Yunan Yoğurdu', '%0 Yağlı', array['breakfast','snack'], 'dairy',
   59, 10, 3.6, 0.4, 0, 'manual'),
  ('Avokado', null, array['breakfast','snack','lunch'], 'vegan',
   160, 2, 9, 15, 7, 'manual'),
  ('Muz', null, array['breakfast','snack'], 'vegan',
   89, 1.1, 23, 0.3, 2.6, 'manual'),
  ('Konserve Ton Balığı', 'Suda', array['lunch','snack'], 'fish',
   116, 26, 0, 1, 0, 'manual')
on conflict (api_source, external_id) do nothing;
