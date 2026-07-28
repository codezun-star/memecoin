-- ============================================================================
-- Comentarios en los artículos del blog
--
-- Se reutiliza la tabla `comments` en vez de crear una paralela: así los likes,
-- las políticas de RLS, el borrado suave y toda la interfaz del hilo valen
-- igual para una moneda que para un artículo. Duplicar la tabla habría
-- significado duplicar también `comment_likes` y sus políticas.
--
-- Un comentario apunta a una moneda **o** a un artículo, nunca a las dos cosas
-- ni a ninguna. Lo garantiza una constraint, no la aplicación.
--
-- Idempotente: se puede ejecutar las veces que haga falta.
-- ============================================================================

-- El destino pasa a ser opcional por separado...
alter table public.comments alter column coin_id drop not null;
alter table public.comments add column if not exists post_slug text;

-- ...pero exactamente uno de los dos tiene que estar.
alter table public.comments drop constraint if exists comments_target_check;
alter table public.comments add constraint comments_target_check check (
  (coin_id is not null and post_slug is null) or
  (coin_id is null and post_slug is not null)
);

create index if not exists comments_post_created_idx
  on public.comments (post_slug, created_at desc)
  where post_slug is not null;

-- ----------------------------------------------------------------------------
-- El trigger de un solo nivel tiene que comparar el destino correcto
-- ----------------------------------------------------------------------------
create or replace function public.enforce_single_level_thread()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
  parent_coin   text;
  parent_post   text;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id, coin_id, post_slug
    into parent_parent, parent_coin, parent_post
    from public.comments where id = new.parent_id;

  if parent_parent is not null then
    raise exception 'Solo se admite un nivel de respuestas';
  end if;

  -- Una respuesta vive siempre en el mismo hilo que su padre, sea una moneda
  -- o un artículo. Sin esto se podría colgar una respuesta de otra conversación.
  if parent_coin is distinct from new.coin_id or parent_post is distinct from new.post_slug then
    raise exception 'La respuesta debe pertenecer al mismo hilo que el comentario padre';
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- La política de inserción no cambia de intención, pero se vuelve a declarar
-- para dejar claro que ahora cubre los dos destinos.
-- ----------------------------------------------------------------------------
drop policy if exists "Comentar requiere sesion" on public.comments;
create policy "Comentar requiere sesion"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id and is_deleted = false);
