# 🐕 Memecoin Plaza

Web comunitaria para meme coins: precios en tiempo real + foro. Un cruce entre
un tracker de precios y un foro, con **20 meme coins** trackeadas.

**Producción:** https://memecoin.codezun.com
**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase · Vercel.

---

## Qué incluye

| Funcionalidad | Estado |
| --- | --- |
| Home con 20 monedas (logo, precio, % 24 h, mini gráfico), ordenadas por capitalización | ✅ |
| Buscador por nombre o símbolo | ✅ |
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
| Blog en markdown: 31 artículos pre-renderizados y paginados | ✅ |
| Cinta de operaciones en tiempo real (compras y ventas) | ✅ |
| Comentarios y likes también en los artículos | ✅ |
| PWA instalable (sin modo offline, a propósito) | ✅ |
| Ficha larga por moneda (~1.000 palabras) con FAQ y datos estructurados | ✅ |

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

**SQL Editor → New query** y ejecuta **las dos, en orden**:

1. [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — tablas, RLS, triggers y permisos.
2. [`supabase/migrations/0002_more_coins.sql`](supabase/migrations/0002_more_coins.sql) — catálogo de 20 monedas.

Las dos son idempotentes y ninguna depende de que la otra se haya vuelto a
ejecutar: cada una declara las columnas que necesita con
`add column if not exists`. Se pueden pasar en cualquier momento y las veces que
haga falta.

> **Si creaste la base antes, vuelve a pasar la 0001 igualmente.** Se le añadieron
> los `GRANT` explícitos a `anon` y `authenticated`: sin ellos, según cómo esté el
> proyecto, las políticas de RLS pueden quedar tapadas por un "permission denied"
> a nivel de tabla.

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

### Por qué solo hay una cifra de 24 h

En la ficha de una moneda hay dos sitios donde podría aparecer la variación de
24 h: la cabecera y la etiqueta junto al gráfico. Durante un tiempo no coincidían
—una decía −7,50 % y la otra −6,66 %— y no era un error de cálculo.

La cabecera usa `price_change_percentage_24h`, el porcentaje oficial del
proveedor. La etiqueta del gráfico lo calculaba sobre la serie que se estaba
dibujando, y esa serie viene agrupada en tramos de varios minutos: su primer
punto no cae en el mismo instante que la referencia del proveedor. Con precios
que se mueven varios puntos en un día, ese desfase de arranque se nota.

Dos porcentajes que dicen «24 h» y no coinciden hacen dudar de los dos, así que
ahora **en el rango de 24 h se muestra la cifra oficial en los dos sitios**. Para
7 d, 30 d, 90 d y 1 a no existe cifra oficial, de modo que sí se calcula sobre la
serie y se etiqueta con el rango (`+12,4 % en 7 d`) para que quede claro que mide
otra cosa. Está en `RangeChangeBadge`, en `src/components/coin-live.tsx`.

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
│   ├── blog/                    # Listado, artículo y categorías (SSG)
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
│   ├── blog.ts                  # Lectura y parseo de los markdown del blog
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

1. Añade la entrada en `src/lib/coins.ts`. El `id` es el de CoinGecko: sale de la
   URL de la moneda en su web (`coingecko.com/en/coins/dogwifcoin` → `dogwifcoin`).
2. Añade la fila equivalente en una migración.
3. Ejecuta las comprobaciones:

   ```bash
   npm run coins:verify   # confirma que el id existe y devuelve datos
   npm test               # colores AA, ids únicos, formato del id
   ```

`coins:verify` no es opcional: un id equivocado **no da error en ninguna parte**.
La API simplemente no devuelve esa moneda y la tarjeta se queda con guiones para
siempre. El script convierte ese fallo silencioso en uno ruidoso y sale con
código 1, así que sirve tal cual en CI.

4. Escribe su ficha en `content/monedas/<id>.md` (ver más abajo).

No hay que tocar ninguna pantalla: la home, el detalle y el foro salen del
registro. Si quieres que aparezca en la cabecera y el pie, marca `featured: true`
(pero no más de seis: la cabecera se desborda).

La ficha sí conviene escribirla, pero **no bloquea nada**: una moneda sin fichero
se renderiza igual con sus datos de mercado y su hilo de comentarios. Lo único
que pierde es el contenido que la hace posicionar por sí sola.

---

## Fichas de las monedas

Cada moneda tiene una ficha larga en `content/monedas/<id>.md`, con el mismo id
que usa CoinGecko y que es el slug de la URL. Misma mecánica que el blog: son
ficheros del repositorio, no filas en la base de datos, y se resuelven en el
build.

Están fuera de `coins.ts` a propósito. Son unas novecientas palabras por moneda;
metidas en el registro lo convertirían en un fichero de veinte mil líneas donde
ya no se vería lo que importa —el id, el par, los colores— y editar un párrafo
obligaría a tocar código.

### Frontmatter

```yaml
---
seoTitle: "Dogecoin (DOGE): qué es, cómo funciona y cuántas hay"
seoDescription: "Qué es Dogecoin, quién la creó, cómo funciona su minería…"
resumen: "La meme coin más antigua que sigue en pie."
keywords:
  - qué es dogecoin
  - cuántos dogecoin hay
actualizado: 2026-07-28
faq:
  - pregunta: "¿Cuántos Dogecoin hay en circulación?"
    respuesta: "Más de 140.000 millones, y la cifra sube cada minuto…"
---
```

| Campo | Obligatorio | Para qué sirve |
| --- | --- | --- |
| `seoTitle` | Sí | El `<title>`. **Máximo 60 caracteres**: se muestra sin el sufijo de marca, así que el espacio es todo tuyo. |
| `seoDescription` | Sí | La `<meta description>`. Entre 70 y 160 caracteres. |
| `resumen` | No | Entradilla bajo el titular de la sección. |
| `keywords` | No | Alimentan la metadata. Mínimo tres, sin repetir. |
| `actualizado` | No | Fecha de revisión editorial. Es el `lastmod` de esa URL en el sitemap. |
| `faq` | Sí | Genera el bloque desplegable y el esquema `FAQPage`. Mínimo tres, con respuestas de 80 caracteres o más. |

### Reglas que verifica `npm test`

No son de estilo: son las cosas que se rompen sin dar ningún error al compilar.

- Todas las monedas del registro tienen ficha, y no sobra ninguna huérfana.
- Los títulos caben en un resultado de búsqueda y las descripciones se muestran
  enteras.
- Cada ficha trae al menos tres preguntas con respuestas que dicen algo.
- El cuerpo pasa de 450 palabras y tiene cuatro o más encabezados `##`.
- **El cuerpo no lleva `#`**: el `h1` lo pone la página con el nombre de la
  moneda, y dos `h1` en la misma página es un error de estructura.
- Los enlaces internos apuntan a rutas que existen, y ninguna ficha se enlaza a
  sí misma.

---

## Comandos

```bash
npm run dev           # desarrollo
npm run build         # build de producción
npm run start         # servir el build
npm test              # pipeline de datos, registro de monedas y contrastes
npm run coins:verify  # confirma contra la API que los ids de las monedas existen
npm run pairs:verify  # confirma que los pares de la cinta en vivo existen
npm run icons:generate # regenera favicon, icono de iOS y tarjeta social
npm run lint          # ESLint
npm run typecheck     # TypeScript sin emitir
```

---

## Logo e iconos

El original es [`public/logomeme.png`](public/logomeme.png) (500x500, con alfa).
Todo lo demás se deriva de él con `npm run icons:generate`:

| Fichero | Para qué |
| --- | --- |
| `src/app/icon.png` | Favicon de la pestaña (96 px) |
| `src/app/apple-icon.png` | Icono de pantalla de inicio en iOS (180 px, aplanado sobre la crema porque iOS no admite transparencia) |
| `src/app/opengraph-image.png` | Tarjeta de previsualización al compartir el enlace (1200x630) |
| `public/logo-mark.png` | Versión ligera para la cabecera y el pie (128 px, ~28 KB en vez de ~300 KB) |

El App Router detecta los tres primeros por su nombre y emite las etiquetas
`<link>` y `<meta>` solo. Para cambiar el logo: sustituye `public/logomeme.png`,
ejecuta el script y commitea los ficheros generados.

---

## Blog

El contenido vive entero en `content/blog/` como ficheros markdown: publicar es
añadir un `.md` y desplegar, sin base de datos y sin panel. Los comentarios de los
artículos sí reutilizan Supabase, con la misma interfaz y los mismos likes que las
fichas de monedas.

Cada artículo se pre-renderiza como HTML estático en el build
(`generateStaticParams` + `generateMetadata`), que es lo que hace que cargue al
instante y que Google lo indexe sin ejecutar JavaScript.

Lo que se genera solo al añadir un fichero: su página, su entrada en el listado,
su sitio en el `sitemap.xml` con la fecha real del artículo, su índice a partir de
los encabezados, sus etiquetas Open Graph y tres esquemas de datos estructurados
(`BlogPosting`, `BreadcrumbList` y `FAQPage` si el artículo trae preguntas).

Los enlaces externos reciben `rel="nofollow noopener noreferrer"` de forma
automática: citar una fuente da contexto sin regalarle autoridad de dominio. Los
internos no lo llevan, porque son los que refuerzan el propio sitio.

**El proceso exacto de publicación está en [BLOG.md](BLOG.md)** — formato del
frontmatter, campos disponibles, tamaño recomendado de las imágenes y cómo ver
un borrador antes de publicarlo.

El cuerpo del artículo usa una escala tipográfica propia (`prose-plaza`): es la
única zona del sitio pensada para lectura larga, así que baja el contraste
cromático y sube el ritmo vertical respecto al resto.

---

## Operaciones en vivo

`/operaciones` muestra cada compra y cada venta según se cruzan en el mercado.

**La conexión la abre el navegador de cada visitante**, no el servidor, y es una
decisión deliberada:

- Una cinta de operaciones necesita latencia de milisegundos. Sondear un endpoint
  propio cada pocos segundos daría una lista de cosas que ya pasaron.
- Retransmitir el flujo desde el servidor obligaría a mantener una conexión
  persistente por visitante, que es justo lo que un despliegue sin servidor
  dedicado no sostiene.
- El flujo es público y no lleva credenciales, así que no hay nada que proteger
  detrás de un intermediario.

A cambio hay que ser honesto en la interfaz sobre qué se está viendo: **las
operaciones de un solo mercado**, no del sector completo. La página lo dice.

### Cuando la red del visitante bloquea la conexión

Abrir la conexión desde el navegador tiene un coste: hay redes que no la dejan
pasar. Redes de empresa, algunos operadores móviles y no pocos antivirus cortan
los puertos poco habituales, y el navegador no avisa de forma limpia: se queda
callado. Por eso la cinta tiene tres niveles:

1. **Se prueban varios hosts, en orden.** El primero va por el puerto estándar,
   el mismo que cualquier página web, así que atraviesa casi cualquier red. El de
   puerto no estándar va el último, que es el que más veces se encuentra cerrado.
   Si un host no abre en seis segundos se da por perdido y se pasa al siguiente:
   sin ese límite la página se quedaba en «Conectando» durante más de un minuto.
2. **Si ninguno abre, se sondea `/api/trades`**, que trae las últimas operaciones
   desde el servidor por una vía que ninguna red corta. Se pierde el directo
   exacto —llegan en tandas de unos segundos— pero los datos son los mismos, y la
   interfaz lo etiqueta como **En diferido** en vez de fingir que es tiempo real.
3. **Si tampoco eso da nada**, se dice claramente, sin dejar la pantalla vacía.

Lo aprendido sobre la red se recuerda durante la sesión: si un host no abre aquí,
no se vuelve a probar cada vez que alguien cambia de moneda.

`/api/trades` filtra por lista blanca contra `TRADABLE_COINS`, así que a la
petición de salida solo llegan símbolos que están en el repositorio, nunca texto
de quien llama. Devuelve siempre 200, incluso sin datos: un error delataría el
estado de un servicio ajeno y llenaría la consola del navegador en cada sondeo.

La clasificación entre compra y venta usa el campo del protocolo que indica si el
comprador era el creador de la orden: si lo era, quien cruzó el mercado fue el
vendedor. Es la convención estándar de "lado agresor".

Los pares están en `tradePair` dentro de `src/lib/coins.ts`. Un par equivocado no
da error visible —el flujo simplemente no manda nada para esa moneda—, así que
hay un script que lo comprueba:

```bash
npm run pairs:verify
```

El endpoint se puede cambiar con `NEXT_PUBLIC_TRADES_WS`, lo que además permite
apuntar a un servidor de pruebas local.

---

## PWA, sitemap y robots

La web es **instalable** (manifiesto en `src/app/manifest.ts` + iconos de 192,
512 y una versión *maskable*), pero **no funciona sin conexión, a propósito**.

El service worker de [`public/sw.js`](public/sw.js) **no cachea nada**. Existe
solo porque el navegador no ofrece instalar una aplicación sin un service worker
con manejador de `fetch`. Cachear aquí sería contraproducente: esto es una web de
precios en vivo y de un foro, y servir una copia guardada mostraría precios
viejos y comentarios que ya no existen. Tampoco se guarda HTML de páginas con
sesión, así que no queda contenido de una cuenta en el disco.

Lo único que aporta: si se cae la red durante una navegación, en vez del
dinosaurio del navegador aparece un aviso propio con un botón de reintentar. Ese
aviso va incrustado en el propio service worker como texto, sin depender de
ningún recurso cacheado.

`sitemap.xml` y `robots.txt` se generan solos desde
[`src/app/sitemap.ts`](src/app/sitemap.ts) y [`src/app/robots.ts`](src/app/robots.ts).
El sitemap sale del registro de monedas, así que añadir una moneda la añade al
sitemap sin tocar nada. Quedan fuera las rutas con sesión (`/profile`), los
endpoints (`/api/`) y `/auth/`.

---

## Textos de cara al usuario

Regla del proyecto: **la interfaz no nombra la tecnología ni el estado de la
configuración.** Ni el framework, ni la base de datos, ni el proveedor de precios,
ni nombres de variables de entorno o de ficheros de migración.

Aplica sobre todo a los errores. Un visitante que ve "no se ha podido cargar" ya
tiene toda la información que puede accionar; decirle *qué* servicio ha fallado o
*qué* variable falta no le sirve de nada y expone la infraestructura. El detalle
real se registra en el servidor con `console.error`, que es donde sirve.

En concreto:

- Los errores del proveedor de identidad se traducen mediante un mapa explícito
  en `src/app/auth/actions.ts`. Los que no están en el mapa **no se muestran tal
  cual**: se registran y el usuario ve un mensaje genérico.
- `/api/markets` responde siempre 200, incluso sin precios. El endpoint funcionó;
  quien falló fue la fuente, y eso viaja en el campo `error`.
- `poweredByHeader` está desactivado en `next.config.ts`.
- La única mención externa que queda es "Datos de mercado por CoinGecko" en el
  pie, como atribución de la fuente de datos.

Esta regla es sobre la **interfaz**. Este README y `DESIGN.md` son documentación
de desarrollo y sí hablan de la tecnología: es su función.

---

## Ideas para después

- Subida de avatares a Supabase Storage (hoy es una URL).
- Realtime de Supabase para que los comentarios nuevos aparezcan sin recargar.
- Watchlist por usuario y alertas de precio.
- Moderación: reportar comentarios, rol de moderador.
- Ordenar el hilo por "más gustados" además de por fecha.

> No es asesoramiento financiero. Es un foro de internet sobre monedas de perros y ranas.
