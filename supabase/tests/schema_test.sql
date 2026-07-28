-- ============================================================================
-- Pruebas del esquema
--
-- Reproduce lo mínimo de Supabase (esquema auth, auth.uid(), roles anon y
-- authenticated) para poder ejecutar y probar 0001_init.sql contra un Postgres
-- normal, sin depender del proyecto real.
--
-- Comprueba 19 cosas: creación automática de perfil, saneado y desduplicación
-- del username, el contador de likes, el límite de un nivel de respuestas, las
-- constraints de longitud y formato, y que la RLS impida borrar comentarios
-- ajenos, suplantar usuarios, quitar likes de otros o escribir siendo anónimo.
--
-- Uso (contra una base de datos vacía y desechable):
--   createdb memecoin_test
--   psql -d memecoin_test -f supabase/tests/schema_test.sql
--
-- No lo ejecutes contra tu base de datos de producción: inserta datos de prueba.
-- ============================================================================
\set ON_ERROR_STOP on

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- En Supabase auth.uid() lee el sub del JWT. Aquí, una GUC de sesión.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
end $$;

\echo '>>> Ejecutando la migración'
\ir ../migrations/0001_init.sql
\ir ../migrations/0002_more_coins.sql
\ir ../migrations/0003_blog_comments.sql
\echo '>>> Migraciones OK'

-- ---------------------------------------------------------------------------
\echo ''
\echo '### 1. Alta de usuario crea perfil (username de los metadatos)'
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"username":"degen_ana"}');
select username from public.profiles where id = '11111111-1111-1111-1111-111111111111';

\echo '### 2. Username de Google (full_name con espacios y acentos) se sanea'
insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'jose@test.com',
        '{"full_name":"José Ruiz Pérez","picture":"https://x/y.png"}');
select username, avatar_url from public.profiles where id = '22222222-2222-2222-2222-222222222222';

\echo '### 3. Username duplicado recibe sufijo'
insert into auth.users (id, email, raw_user_meta_data)
values ('33333333-3333-3333-3333-333333333333', 'otra@test.com', '{"username":"degen_ana"}');
select username from public.profiles where id = '33333333-3333-3333-3333-333333333333';

\echo '### 4. Sin metadatos: username del email'
insert into auth.users (id, email) values ('44444444-4444-4444-4444-444444444444', 'pepe.lover@test.com');
select username from public.profiles where id = '44444444-4444-4444-4444-444444444444';

\echo '### 5. Catálogo sembrado (debe haber 20 y ninguna sin accent_ink)'
select count(*) as monedas,
       count(accent_ink) as con_accent_ink
  from public.coins;

-- ---------------------------------------------------------------------------
\echo ''
\echo '### 6. like_count lo mantiene el trigger'
insert into public.comments (id, coin_id, user_id, body)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'dogecoin',
        '11111111-1111-1111-1111-111111111111', 'DOGE a 1 dólar o la ruina');

insert into public.comment_likes (comment_id, user_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');
select like_count as tras_2_likes from public.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001';

delete from public.comment_likes
 where comment_id = 'aaaaaaaa-0000-0000-0000-000000000001'
   and user_id = '22222222-2222-2222-2222-222222222222';
select like_count as tras_quitar_1 from public.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '### 7. Doble like imposible (PK compuesta)'
do $$ begin
  insert into public.comment_likes (comment_id, user_id)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');
  raise exception 'FALLO: se permitió el doble like';
exception when unique_violation then raise notice 'OK: doble like rechazado';
end $$;

-- ---------------------------------------------------------------------------
\echo ''
\echo '### 8. Respuesta de un nivel: OK'
insert into public.comments (id, coin_id, user_id, parent_id, body)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'dogecoin',
        '22222222-2222-2222-2222-222222222222',
        'aaaaaaaa-0000-0000-0000-000000000001', 'Copium puro');
select 'respuesta creada' as resultado;

\echo '### 9. Respuesta a una respuesta: rechazada'
do $$ begin
  insert into public.comments (coin_id, user_id, parent_id, body)
  values ('dogecoin', '33333333-3333-3333-3333-333333333333',
          'aaaaaaaa-0000-0000-0000-000000000002', 'anidando demasiado');
  raise exception 'FALLO: se permitió anidar dos niveles';
exception when others then raise notice 'OK: rechazado -> %', sqlerrm;
end $$;

\echo '### 10. Respuesta en otra moneda que el padre: rechazada'
do $$ begin
  insert into public.comments (coin_id, user_id, parent_id, body)
  values ('pepe', '33333333-3333-3333-3333-333333333333',
          'aaaaaaaa-0000-0000-0000-000000000001', 'moneda cruzada');
  raise exception 'FALLO: se permitió cruzar monedas';
exception when others then raise notice 'OK: rechazado -> %', sqlerrm;
end $$;

\echo '### 11. Comentario vacío y demasiado largo: rechazados'
do $$ begin
  insert into public.comments (coin_id, user_id, body)
  values ('pepe', '11111111-1111-1111-1111-111111111111', '');
  raise exception 'FALLO: se permitió cuerpo vacío';
exception when check_violation then raise notice 'OK: cuerpo vacío rechazado';
end $$;
do $$ begin
  insert into public.comments (coin_id, user_id, body)
  values ('pepe', '11111111-1111-1111-1111-111111111111', repeat('x', 2001));
  raise exception 'FALLO: se permitieron 2001 caracteres';
exception when check_violation then raise notice 'OK: >2000 caracteres rechazado';
end $$;

\echo '### 12. Username inválido: rechazado'
do $$ begin
  update public.profiles set username = 'con espacios'
   where id = '11111111-1111-1111-1111-111111111111';
  raise exception 'FALLO: se permitió un username con espacios';
exception when check_violation then raise notice 'OK: username con espacios rechazado';
end $$;

\echo '### 13. Unicidad de username sin distinguir mayúsculas'
do $$ begin
  update public.profiles set username = 'DEGEN_ANA'
   where id = '44444444-4444-4444-4444-444444444444';
  raise exception 'FALLO: se permitió un duplicado por mayúsculas';
exception when unique_violation then raise notice 'OK: DEGEN_ANA vs degen_ana rechazado';
end $$;

-- ---------------------------------------------------------------------------
\echo ''
\echo '### 14. RLS: un usuario NO puede borrar el comentario de otro'
set role authenticated;
set app.user_id = '33333333-3333-3333-3333-333333333333';
delete from public.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select count(*) as sigue_existiendo from public.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '### 15. RLS: un usuario NO puede comentar en nombre de otro'
do $$ begin
  insert into public.comments (coin_id, user_id, body)
  values ('pepe', '11111111-1111-1111-1111-111111111111', 'suplantando a ana');
  raise exception 'FALLO: se permitió suplantar a otro usuario';
exception when insufficient_privilege then raise notice 'OK: suplantación rechazada por RLS';
end $$;

\echo '### 16. RLS: un usuario NO puede quitar el like de otro'
delete from public.comment_likes
 where comment_id = 'aaaaaaaa-0000-0000-0000-000000000001'
   and user_id = '33333333-3333-3333-3333-333333333333'
   and false;  -- placeholder para no borrar el propio
set app.user_id = '11111111-1111-1111-1111-111111111111';
delete from public.comment_likes where comment_id = 'aaaaaaaa-0000-0000-0000-000000000001';
select count(*) as likes_intactos from public.comment_likes
 where comment_id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '### 17. RLS: el autor SÍ borra lo suyo (borrado suave con respuestas)'
set app.user_id = '11111111-1111-1111-1111-111111111111';
update public.comments set is_deleted = true, body = '[comentario eliminado]'
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is_deleted, body from public.comments where id = 'aaaaaaaa-0000-0000-0000-000000000001';

\echo '### 18. RLS: anon puede leer pero no escribir'
set role anon;
select count(*) as comentarios_visibles_para_anon from public.comments;
do $$ begin
  insert into public.comments (coin_id, user_id, body)
  values ('pepe', '11111111-1111-1111-1111-111111111111', 'anon colándose');
  raise exception 'FALLO: anon pudo comentar';
exception when insufficient_privilege then raise notice 'OK: anon no puede comentar';
end $$;

\echo '### 19. RLS: nadie puede tocar el catálogo de monedas'
do $$ begin
  insert into public.coins (id, slug, symbol, name, accent)
  values ('scam', 'scam', 'SCAM', 'Scam', '#000');
  raise exception 'FALLO: anon pudo insertar una moneda';
exception when insufficient_privilege then raise notice 'OK: catálogo de monedas protegido';
end $$;

reset role;

-- ---------------------------------------------------------------------------
\echo ''
\echo '### 20. Un comentario puede colgar de un artículo del blog'
insert into public.comments (id, post_slug, user_id, body)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'guia-meme-coins',
        '11111111-1111-1111-1111-111111111111', 'Buen artículo');
select post_slug, coin_id is null as sin_moneda
  from public.comments where id = 'bbbbbbbb-0000-0000-0000-000000000001';

\echo '### 21. No puede apuntar a los dos destinos a la vez'
do $$ begin
  insert into public.comments (coin_id, post_slug, user_id, body)
  values ('pepe', 'guia-meme-coins', '11111111-1111-1111-1111-111111111111', 'los dos');
  raise exception 'FALLO: se permitieron moneda y artículo a la vez';
exception when check_violation then raise notice 'OK: destino doble rechazado';
end $$;

\echo '### 22. Ni quedarse sin destino'
do $$ begin
  insert into public.comments (user_id, body)
  values ('11111111-1111-1111-1111-111111111111', 'huérfano');
  raise exception 'FALLO: se permitió un comentario sin destino';
exception when check_violation then raise notice 'OK: comentario sin destino rechazado';
end $$;

\echo '### 23. Una respuesta no puede saltar de un artículo a una moneda'
do $$ begin
  insert into public.comments (coin_id, user_id, parent_id, body)
  values ('pepe', '22222222-2222-2222-2222-222222222222',
          'bbbbbbbb-0000-0000-0000-000000000001', 'cruzando hilos');
  raise exception 'FALLO: se permitió cruzar de artículo a moneda';
exception when others then raise notice 'OK: rechazado -> %', sqlerrm;
end $$;

\echo '### 24. Los likes funcionan igual en un artículo'
insert into public.comment_likes (comment_id, user_id)
values ('bbbbbbbb-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');
select like_count from public.comments where id = 'bbbbbbbb-0000-0000-0000-000000000001';

\echo ''
\echo '>>> TODAS LAS PRUEBAS TERMINADAS'
