# 🐕 Memecoin Plaza

Web comunitaria para meme coins: precios en tiempo real + foro. Un cruce entre
CoinGecko y un foro, centrado en **Dogecoin, Shiba Inu, Pepe y Bonk**.

**Producción:** https://memecoin.codezun.com
**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel.

---

## Qué incluye

| Funcionalidad | Estado |
| --- | --- |
| Home con tarjetas de las 4 monedas (logo, precio, % 24 h, mini gráfico) | ✅ |
| **Precios en tiempo real**, refrescándose solos cada 20 s sin recargar | ✅ |
| Página de detalle (precio, capitalización, volumen, máx./mín., ATH) | ✅ |
| Gráfico con rangos 24 h / 7 d / 30 d / 90 d / 1 año, rejilla, tooltip y línea de referencia | ✅ |
| Registro y login con email + contraseña | ✅ |
| Login con Google / Discord | 🔌 Código listo, **sin activar** (ver más abajo) |
| Perfil de usuario (username, avatar, bio) | ✅ |
| Hilo de comentarios por moneda, con respuestas de un nivel | ✅ |
| Likes en comentarios (con actualización optimista) | ✅ |
| Borrado de los comentarios propios | ✅ |
| Esquema SQL con RLS, triggers, permisos y seed | ✅ |

---

## Puesta en marcha

### 1. Instalar

```bash
npm install
cp .env.example .env.local
```

La web **arranca sin configurar nada**: verás el diseño completo y las zonas de
comunidad mostrarán un aviso de "Supabase sin configurar".

### 2. Supabase

En **Project Settings → API** copia la *Project URL* y la *anon public key* a
`.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Ejecutar la migración

**SQL Editor → New query**, pega
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecútalo.

> **Si ya la habías ejecutado antes, vuelve a ejecutarla.** Es idempotente y se le
> han añadido dos cosas necesarias: los `GRANT` explícitos a `anon` y
> `authenticated` (sin ellos, según cómo esté el proyecto, las políticas de RLS
> pueden quedar tapadas por un "permission denied" a nivel de tabla) y la columna
> `coins.accent_ink`.

### 4. URLs de autenticación

En Supabase → **Authentication → URL Configuration**:

- *Site URL*: `https://memecoin.codezun.com`
- *Redirect URLs*: `https://memecoin.codezun.com/**` y `http://localhost:3000/**`

Hace falta aunque no uses OAuth: el enlace de confirmación de email vuelve por ahí.

### 5. Desactivar la confirmación por email

El registro está pensado para que el usuario entre **de inmediato**, sin pasar por
el correo. Eso no se controla desde el código, sino desde el panel:

1. **Authentication → Sign In / Providers** (en paneles antiguos, *Providers*).
2. Abre el proveedor **Email**.
3. Desactiva el interruptor **Confirm email**.
4. **Save**.

Hecho eso, `supabase.auth.signUp()` devuelve sesión directamente y la app redirige
al usuario ya logueado. Si algún día vuelves a activarlo, el código lo detecta
solo y muestra el aviso de "revisa tu correo" — no hay que tocar nada.

> Desactivarlo **no confirma retroactivamente** a las cuentas ya creadas. Si una
> cuenta anterior sigue sin poder entrar, bórrala en **Authentication → Users** y
> regístrala de nuevo.

### 6. Arrancar

```bash
npm run dev
```

---

## Datos en tiempo real

Los precios no se quedan congelados en el render del servidor:

```
CoinGecko  ←(máx. 1 llamada/15 s)─  /api/markets  ←(sondeo/20 s)─  navegador
```

- **Primer pintado desde el servidor.** La página llega con precios ya puestos
  (bueno para SEO y para no ver huecos), y a partir de ahí el cliente toma el relevo.
- **`/api/markets` agrupa las llamadas.** Tiene un throttle en memoria de 15 s y
  colapsa las peticiones concurrentes en una sola: da igual que haya 1 pestaña
  abierta o 200, CoinGecko recibe como mucho una llamada cada 15 s. Es lo que
  permite vivir dentro del tier gratuito (~30 peticiones/minuto).
- **El navegador sondea cada 20 s**, se para cuando la pestaña no está visible y
  refresca al volver.
- **Un fallo no vacía la pantalla.** Si CoinGecko corta, se sigue mostrando el
  último dato bueno y el indicador pasa a "Reintentando".
- **Se nota que está vivo**: el precio destella en verde o rojo al cambiar, y hay
  un indicador con punto latiente y "hace X s".

### Validación de los datos

Todo lo que devuelve CoinGecko pasa por `normalizeMarket` / `normalizeChart`
antes de tocar la UI: se descartan monedas que no trackeamos, se aceptan números
que lleguen como string y **cualquier campo corrupto se convierte a `null` en vez
de propagar `NaN`** hasta la pantalla. Hay 15 pruebas cubriendo esto:

```bash
npm test
```

---

## Activar Google o Discord más adelante

El MVP entra solo con email + contraseña, pero **todo el camino de OAuth está
escrito**: la acción de servidor, el callback que intercambia el código por
sesión y la creación automática de perfil con el nombre y el avatar del proveedor.

Para activar uno:

1. Supabase → **Authentication → Providers**, activa el proveedor y pega client
   id/secret. La URI de redirección que pide el proveedor es
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`.
2. Añade su id a `ENABLED_PROVIDERS` en
   [`src/lib/auth-providers.ts`](src/lib/auth-providers.ts):

   ```ts
   export const ENABLED_PROVIDERS: OAuthProviderId[] = ["google"];
   ```

Ya está. El botón aparece solo en `/login` y `/signup`. **No hay que tocar ningún
componente.** Mientras la lista esté vacía, la acción de servidor rechaza
cualquier intento de OAuth aunque alguien fuerce el formulario.

---

## CoinGecko

Funciona sin API key con el tier público. Si te quedas corto, saca una *Demo API
key* gratuita y añade `COINGECKO_API_KEY=CG-xxxx`.

Si CoinGecko falla, la web **no se rompe**: muestra un aviso y el foro sigue
funcionando.

---

## Despliegue en Vercel

1. Importa el repositorio.
2. Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL=https://memecoin.codezun.com`
   y, si la usas, `COINGECKO_API_KEY`.
3. Apunta el dominio `memecoin.codezun.com` al proyecto en **Settings → Domains**.

---

## Diseño

Sistema de diseño definido **antes** que las pantallas y documentado en
**[DESIGN.md](DESIGN.md)**. Tokens en [`tailwind.config.ts`](tailwind.config.ts) y
[`src/app/globals.css`](src/app/globals.css). Resumen:

- **Tema claro sobre crema cálida** (`#FFFBF3`), no blanco puro: sobre blanco los
  naranjas y dorados de las cuatro marcas flotan sin contexto; sobre crema entran
  en la misma familia de temperatura.
- **Dos variantes por moneda.** La viva (`accent`) para logos, franjas y rellenos;
  la de contraste AA (`accentInk`) para texto y trazos del gráfico. Sobre fondo
  claro un amarillo o un verde vivos no se leen como texto. Ambas viajan como
  variables CSS (`--coin-accent`, `--coin-accent-ink`).
- **Contrastes verificados, no estimados.** Todos los colores de texto están
  calculados a WCAG AA (≥ 4,5:1); tres tokens se oscurecieron porque no llegaban.
- **Tres tipografías con un trabajo cada una**: Bricolage Grotesque (titulares),
  Inter (interfaz), JetBrains Mono (cifras tabulares, para que los precios no
  bailen al actualizarse).
- **Verde y rojo reservados** a la dirección del precio, siempre con signo y
  flecha. Por eso el botón de "me gusta" es naranja y no verde.

---

## Esquema de base de datos

```
auth.users  (gestionada por Supabase)
   │ 1:1  (trigger on_auth_user_created)
   ▼
profiles ──────┐
   │ 1:N       │ 1:N
   ▼           ▼
comments ──► comment_likes
   │ N:1          (PK compuesta: un like por usuario y comentario)
   ▼
coins
```

| Tabla | Para qué | Notas |
| --- | --- | --- |
| `profiles` | Datos públicos del usuario | Espejo de `auth.users`; username único sin distinguir mayúsculas |
| `coins` | Catálogo de monedas | La PK es el id de CoinGecko, así que no hace falta tabla de mapeo. Los precios **no** se guardan: son volátiles |
| `comments` | Hilo por moneda | `parent_id` para respuestas de un nivel (lo fuerza un trigger), `like_count` desnormalizado, borrado suave si tiene respuestas |
| `comment_likes` | Likes | PK compuesta `(comment_id, user_id)`: el doble like lo impide la base de datos, no la app |

**RLS activa en las cuatro tablas.** Todo se lee en público; escribir requiere
sesión y solo sobre lo propio. `coins` es de solo lectura desde el cliente.

Decisiones que conviene conocer:

- **`like_count` desnormalizado**, mantenido por trigger. Evita un `count()` por
  comentario al pintar el hilo.
- **Borrado suave selectivo**: si el comentario tiene respuestas se marca como
  borrado (borrarlo de verdad se llevaría las respuestas de otros por el
  `on delete cascade`); si no las tiene, se borra del todo.
- **Perfil automático al registrarse**: `handle_new_user` genera el username a
  partir de los metadatos, lo sanea (quita espacios y acentos) y le añade un
  sufijo si ya está cogido.

El esquema está probado contra un Postgres real. El arnés está en el repo
([`supabase/tests/schema_test.sql`](supabase/tests/schema_test.sql)) y cubre 19
comprobaciones de triggers, constraints y políticas RLS: que un usuario no pueda
borrar comentarios ajenos ni suplantar a otro, que `anon` pueda leer pero no
escribir, que no se puedan anidar dos niveles de respuestas, que el contador de
likes cuadre, etc.

```bash
createdb memecoin_test
psql -d memecoin_test -f supabase/tests/schema_test.sql
```

---

## Estructura

```
src/
├── app/
│   ├── page.tsx                 # Home: hero + grid de monedas en vivo
│   ├── coin/[slug]/page.tsx     # Detalle: datos, gráfico y debate
│   ├── api/markets/route.ts     # Endpoint de sondeo con throttle compartido
│   ├── login/ · signup/         # Autenticación
│   ├── profile/                 # Perfil editable
│   ├── auth/
│   │   ├── actions.ts           # Server actions de login/registro/logout/OAuth
│   │   └── callback/route.ts    # Retorno de OAuth y confirmación por email
│   └── actions/comments.ts      # Server actions de comentarios y likes
├── components/
│   ├── ui/                      # Primitivas del sistema de diseño
│   ├── comments/                # Formulario, item del hilo, botón de like
│   ├── live-*.tsx               # Sondeo, indicador y precio con destello
│   ├── coin-live.tsx            # Cabecera, gráfico y stats en vivo
│   └── coin-card.tsx · sparkline.tsx · price-chart.tsx
├── lib/
│   ├── coingecko.ts             # Cliente + normalización de la API de precios
│   ├── coingecko.test.ts        # Pruebas del pipeline de datos
│   ├── use-live-markets.ts      # Hook de sondeo
│   ├── auth-providers.ts        # Configuración de OAuth (vacía = solo email)
│   ├── coins.ts · comments.ts · format.ts
│   └── supabase/                # Clientes de browser, servidor y middleware
├── types/database.ts
└── middleware.ts                # Refresco de sesión
supabase/migrations/0001_init.sql
```

### Añadir una moneda nueva

1. Añade la entrada en `src/lib/coins.ts` (el `id` es el de CoinGecko).
2. Añade la fila equivalente en el `insert` de la migración.

No hay que tocar ninguna pantalla.

---

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm test           # pruebas del pipeline de datos
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
```

---

## Ideas para después

- Subida de avatares a Supabase Storage (hoy es una URL).
- Realtime de Supabase para que los comentarios nuevos aparezcan sin recargar.
- Watchlist por usuario y alertas de precio.
- Moderación: reportar comentarios, rol de moderador.
- Ordenar el hilo por "más gustados" además de por fecha.

> No es asesoramiento financiero. Es un foro de internet sobre monedas de perros y ranas.
