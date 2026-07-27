-- ============================================================================
-- Memecoin Plaza — esquema inicial
--
-- Tablas: profiles, coins, comments, comment_likes
-- Incluye RLS, triggers de mantenimiento y seed de las 4 monedas del MVP.
--
-- Ejecutar en Supabase: SQL Editor -> pegar -> Run
-- o con la CLI: supabase db push
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Helper: mantener updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles — datos públicos del usuario
--
-- auth.users es propiedad de Supabase y no se puede exponer al cliente. El
-- patrón estándar es una tabla espejo en public con solo lo publicable.
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null,
  avatar_url  text,
  bio         text check (char_length(bio) <= 280),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint username_length check (char_length(username) between 3 and 24),
  -- Letras, números y guion bajo. Sin espacios ni caracteres que permitan
  -- suplantar a otro usuario visualmente.
  constraint username_format check (username ~ '^[A-Za-z0-9_]+$')
);

-- Unicidad insensible a mayúsculas: "Degen" y "degen" son el mismo nombre.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- coins — monedas trackeadas
--
-- `id` es el identificador de CoinGecko, así que sirve de clave común entre la
-- base de datos y la API de precios sin tabla de mapeo. Los precios NO se
-- guardan aquí: son datos volátiles que se piden a CoinGecko con cache ISR.
-- ============================================================================
create table if not exists public.coins (
  id          text primary key,
  slug        text not null unique,
  symbol      text not null,
  name        text not null,
  accent      text not null,          -- color de marca (hex), ver DESIGN.md
  tagline     text,
  blurb       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- comments — hilo de foro por moneda
--
-- Respuestas de un solo nivel: parent_id apunta siempre a un comentario raíz.
-- El trigger comments_enforce_single_level lo garantiza.
-- ============================================================================
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  coin_id     text not null references public.coins (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  body        text not null,
  -- Contador desnormalizado: evita un count() por comentario al pintar el hilo.
  -- Lo mantiene el trigger comment_likes_sync_count.
  like_count  integer not null default 0,
  -- Borrado suave: si el comentario tiene respuestas se marca en vez de
  -- borrarse, para no dejar el hilo huérfano.
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint body_length check (char_length(body) between 1 and 2000)
);

create index if not exists comments_coin_created_idx
  on public.comments (coin_id, created_at desc);
create index if not exists comments_parent_idx
  on public.comments (parent_id) where parent_id is not null;
create index if not exists comments_user_idx
  on public.comments (user_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

-- Una respuesta no puede responder a otra respuesta.
create or replace function public.enforce_single_level_thread()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
  parent_coin   text;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id, coin_id into parent_parent, parent_coin
  from public.comments where id = new.parent_id;

  if parent_parent is not null then
    raise exception 'Solo se admite un nivel de respuestas';
  end if;

  -- Una respuesta siempre vive en el hilo de la misma moneda que su padre.
  if parent_coin is distinct from new.coin_id then
    raise exception 'La respuesta debe pertenecer a la misma moneda que el comentario padre';
  end if;

  return new;
end;
$$;

create trigger comments_enforce_single_level
  before insert or update of parent_id on public.comments
  for each row execute function public.enforce_single_level_thread();

-- ============================================================================
-- comment_likes — un like por usuario y comentario
--
-- La PK compuesta es la que impide el doble like; no hace falta lógica en la app.
-- ============================================================================
create table if not exists public.comment_likes (
  comment_id  uuid not null references public.comments (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_idx
  on public.comment_likes (user_id);

-- Mantiene comments.like_count sincronizado.
create or replace function public.sync_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments
       set like_count = like_count + 1
     where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments
       set like_count = greatest(like_count - 1, 0)
     where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger comment_likes_sync_count
  after insert or delete on public.comment_likes
  for each row execute function public.sync_comment_like_count();

-- ============================================================================
-- Alta de usuario: crear el perfil automáticamente
--
-- Se dispara con cualquier método de registro (email/password y Google OAuth).
-- El username sale de los metadatos del registro, del nombre de Google o del
-- email, en ese orden; si ya está cogido se le añade un sufijo numérico.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix integer := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'degen'
  );

  -- Normalizar al formato permitido por la constraint
  base_username := regexp_replace(base_username, '[^A-Za-z0-9_]', '', 'g');
  if char_length(base_username) < 3 then
    base_username := 'degen' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  base_username := substr(base_username, 1, 20);

  final_username := base_username;
  while exists (select 1 from public.profiles where lower(username) = lower(final_username)) loop
    suffix := suffix + 1;
    final_username := substr(base_username, 1, 20) || suffix::text;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
--
-- Todo se lee en público (la web es consultable sin cuenta); escribir requiere
-- sesión y solo sobre lo propio.
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.coins         enable row level security;
alter table public.comments      enable row level security;
alter table public.comment_likes enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "Perfiles visibles para todos" on public.profiles;
create policy "Perfiles visibles para todos"
  on public.profiles for select
  using (true);

drop policy if exists "Cada uno crea su propio perfil" on public.profiles;
create policy "Cada uno crea su propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Cada uno edita su propio perfil" on public.profiles;
create policy "Cada uno edita su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- coins ---------------------------------------------------------------------
-- Solo lectura: el catálogo se gestiona con migraciones / service role.
drop policy if exists "Monedas visibles para todos" on public.coins;
create policy "Monedas visibles para todos"
  on public.coins for select
  using (true);

-- comments ------------------------------------------------------------------
drop policy if exists "Comentarios visibles para todos" on public.comments;
create policy "Comentarios visibles para todos"
  on public.comments for select
  using (true);

drop policy if exists "Comentar requiere sesion" on public.comments;
create policy "Comentar requiere sesion"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id and is_deleted = false);

-- Cubre editar y el borrado suave. El WITH CHECK impide reasignar el
-- comentario a otro usuario o moverlo de moneda.
drop policy if exists "Editar solo lo propio" on public.comments;
create policy "Editar solo lo propio"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Borrar solo lo propio" on public.comments;
create policy "Borrar solo lo propio"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- comment_likes -------------------------------------------------------------
drop policy if exists "Likes visibles para todos" on public.comment_likes;
create policy "Likes visibles para todos"
  on public.comment_likes for select
  using (true);

drop policy if exists "Dar like requiere sesion" on public.comment_likes;
create policy "Dar like requiere sesion"
  on public.comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Quitar solo el like propio" on public.comment_likes;
create policy "Quitar solo el like propio"
  on public.comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Seed: las 4 monedas del MVP
-- Debe coincidir con src/lib/coins.ts
-- ============================================================================
insert into public.coins (id, slug, symbol, name, accent, tagline, blurb, sort_order)
values
  ('dogecoin', 'dogecoin', 'DOGE', 'Dogecoin', '#F5C542',
   'El abuelo del meme',
   'Nacida en 2013 como una parodia de Bitcoin, Dogecoin acabó siendo la meme coin más longeva y reconocible del mercado.',
   1),
  ('shiba-inu', 'shiba-inu', 'SHIB', 'Shiba Inu', '#FF7A18',
   'El asesino de Doge',
   'Token ERC-20 lanzado en 2020 con un ecosistema propio (ShibaSwap, Shibarium) construido por una comunidad enorme.',
   2),
  ('pepe', 'pepe', 'PEPE', 'Pepe', '#4ADE80',
   'Meme puro, sin utilidad',
   'Lanzada en 2023 sin impuestos ni roadmap y presumiendo de ello: la tesis es el meme y nada más.',
   3),
  ('bonk', 'bonk', 'BONK', 'Bonk', '#FFB627',
   'El perro de Solana',
   'La meme coin que reactivó Solana tras el colapso de FTX, repartida por airdrop a la comunidad del ecosistema.',
   4)
on conflict (id) do update set
  slug       = excluded.slug,
  symbol     = excluded.symbol,
  name       = excluded.name,
  accent     = excluded.accent,
  tagline    = excluded.tagline,
  blurb      = excluded.blurb,
  sort_order = excluded.sort_order;
