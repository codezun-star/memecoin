# 🐕 Memecoin Plaza

MVP de una web comunitaria para meme coins: precios en vivo + foro. Un cruce
entre CoinGecko y un foro, centrado en **Dogecoin, Shiba Inu, Pepe y Bonk**.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · listo para Vercel.

---

## Qué incluye el MVP

| Funcionalidad | Estado |
| --- | --- |
| Home con tarjetas de las 4 monedas (logo, precio, % 24 h, mini gráfico) | ✅ |
| Página de detalle por moneda (precio, capitalización, volumen, máx./mín., ATH) | ✅ |
| Gráfico de precio con rangos 24 h / 7 d / 30 d / 90 d / 1 año | ✅ |
| Registro y login con email + contraseña | ✅ |
| Login con Google (OAuth) | ✅ |
| Perfil de usuario (username, avatar, bio) | ✅ |
| Hilo de comentarios por moneda, con respuestas de un nivel | ✅ |
| Likes en comentarios (con actualización optimista) | ✅ |
| Borrado de los comentarios propios | ✅ |
| Esquema SQL con RLS, triggers y seed | ✅ |

---

## Puesta en marcha

### 1. Instalar

```bash
npm install
cp .env.example .env.local
```

La web **arranca sin configurar nada**: verás los precios y el diseño completo,
y las zonas de comunidad mostrarán un aviso de "Supabase sin configurar". Para
tener foro y cuentas, sigue con el paso 2.

### 2. Crear el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → API** copia la *Project URL* y la *anon public key*.
3. Pégalas en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Ejecutar la migración

En el panel de Supabase: **SQL Editor → New query**, pega el contenido de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecútalo.

Con la CLI de Supabase sería:

```bash
supabase link --project-ref <tu-ref>
supabase db push
```

Esto crea las tablas, las políticas de RLS, los triggers y mete las 4 monedas.

### 4. Arrancar

```bash
npm run dev
```

→ http://localhost:3000

---

## Configuración opcional

### Google OAuth

1. En Google Cloud Console crea unas credenciales OAuth 2.0 de tipo *Web application*.
2. En **URIs de redirección autorizados** añade:
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`
3. En Supabase: **Authentication → Providers → Google**, activa el proveedor y pega
   el Client ID y el Client Secret.
4. En **Authentication → URL Configuration** añade tus URLs de redirección
   (`http://localhost:3000/**` y la de producción).

El botón de Google ya está en las pantallas de login y registro; en cuanto el
proveedor esté activo, funciona.

### CoinGecko

Funciona sin API key con el tier público (~30 peticiones/minuto). Como todas las
llamadas pasan por el cache ISR de Next (60 s los precios, 300 s los gráficos), da
de sobra para desarrollo y tráfico bajo.

Si te quedas corto, saca una *Demo API key* gratuita y añádela:

```bash
COINGECKO_API_KEY=CG-xxxxxxxx
```

Si CoinGecko falla o corta por límite de peticiones, la web **no se rompe**:
muestra un aviso y sigue funcionando con el resto (foro incluido).

---

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Añade las variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y, si la usas, `COINGECKO_API_KEY`.
3. Deploy. No hace falta configurar nada más: la URL del sitio se detecta sola
   a partir de las variables que inyecta Vercel.
4. En Supabase → **Authentication → URL Configuration**, añade tu dominio de
   producción a *Site URL* y a *Redirect URLs*.

---

## Diseño

El sistema de diseño está definido **antes** que las pantallas y documentado en
**[DESIGN.md](DESIGN.md)**: paleta, tipografía, escala de espaciado, radios,
profundidad, componentes, movimiento y accesibilidad.

Los tokens viven en [`tailwind.config.ts`](tailwind.config.ts) y
[`src/app/globals.css`](src/app/globals.css). Resumen rápido:

- **Tema oscuro único** sobre carbón cálido — los cuatro colores de marca son
  cálidos y saturados, y sobre fondo claro se apagan.
- **Un color por moneda** (naranja Shiba, dorado Doge, verde Pepe, ámbar Bonk)
  que viaja como variable CSS `--coin-accent` y tiñe tarjetas, glows y acentos.
- **Tres tipografías con un trabajo cada una**: Bricolage Grotesque (titulares),
  Inter (interfaz), JetBrains Mono (cifras tabulares, para que los precios no
  bailen al actualizarse).
- **Verde y rojo reservados** para la dirección del precio, siempre acompañados
  de signo y flecha para no depender solo del color.

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
| `profiles` | Datos públicos del usuario | Espejo de `auth.users`; el username es único sin distinguir mayúsculas |
| `coins` | Catálogo de monedas | La PK es el id de CoinGecko, así que no hace falta tabla de mapeo. Los precios **no** se guardan: son volátiles y se piden a la API |
| `comments` | Hilo por moneda | `parent_id` para respuestas de un nivel (lo fuerza un trigger), `like_count` desnormalizado, borrado suave si tiene respuestas |
| `comment_likes` | Likes | PK compuesta `(comment_id, user_id)`: el doble like lo impide la base de datos, no la app |

**Row Level Security activo en las cuatro tablas.** Todo se lee en público
(la web es consultable sin cuenta); escribir requiere sesión y solo sobre lo
propio. `coins` es de solo lectura desde el cliente.

Decisiones que conviene conocer:

- **`like_count` desnormalizado**, mantenido por un trigger. Evita un `count()`
  por comentario al pintar el hilo.
- **Borrado suave selectivo**: si el comentario tiene respuestas se marca como
  borrado (borrarlo de verdad se llevaría por delante las respuestas de otros por
  el `on delete cascade`); si no las tiene, se borra del todo.
- **Perfil automático al registrarse**: el trigger `handle_new_user` genera el
  username a partir de los metadatos del registro, del nombre de Google o del
  email, y le añade un sufijo si ya está cogido.

---

## Estructura

```
src/
├── app/
│   ├── page.tsx                 # Home: hero + grid de monedas
│   ├── coin/[slug]/page.tsx     # Detalle: datos, gráfico y debate
│   ├── login/ · signup/         # Autenticación
│   ├── profile/                 # Perfil editable
│   ├── auth/
│   │   ├── actions.ts           # Server actions de login/registro/logout
│   │   └── callback/route.ts    # Retorno de OAuth y confirmación por email
│   └── actions/comments.ts      # Server actions de comentarios y likes
├── components/
│   ├── ui/                      # Primitivas del sistema de diseño
│   ├── comments/                # Formulario, item del hilo, botón de like
│   ├── coin-card.tsx · sparkline.tsx · price-chart.tsx
│   └── site-header.tsx · site-footer.tsx
├── lib/
│   ├── coingecko.ts             # Cliente de la API de precios
│   ├── coins.ts                 # Registro de las monedas trackeadas
│   ├── comments.ts              # Consultas del hilo
│   ├── format.ts                # Formateo de cifras
│   └── supabase/                # Clientes de browser, servidor y middleware
├── types/database.ts            # Tipos del esquema
└── middleware.ts                # Refresco de sesión
supabase/migrations/0001_init.sql
```

### Añadir una moneda nueva

1. Añade la entrada en `src/lib/coins.ts` (el `id` es el de CoinGecko).
2. Añade la fila equivalente en el `insert` de la migración.

No hay que tocar ninguna pantalla: home, detalle y foro salen del registro.

---

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run start      # servir el build
npm run lint       # ESLint
npm run typecheck  # TypeScript sin emitir
```

---

## Ideas para después del MVP

- Subida de avatares a Supabase Storage (hoy es una URL).
- Realtime de Supabase para que los comentarios nuevos aparezcan sin recargar.
- Watchlist por usuario y alertas de precio.
- Moderación: reportar comentarios, rol de moderador.
- Ordenar el hilo por "más gustados" además de por fecha.

> No es asesoramiento financiero. Es un foro de internet sobre monedas de perros y ranas.
