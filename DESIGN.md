# Sistema de diseño — Memecoin Plaza

Documento de referencia de la identidad visual. **Todo lo que aparece aquí está
implementado como tokens en `tailwind.config.ts` y `src/app/globals.css`.** Si vas a
añadir una pantalla nueva, usa tokens — no hex sueltos ni valores mágicos.

---

## 1. Principio rector

> Energía meme/degen, ejecución de producto serio.

Traducción práctica en tres reglas que resuelven casi cualquier duda de diseño:

1. **El color grita, la tipografía susurra.** La personalidad vive en gradientes,
   glows y acentos por moneda. El texto de lectura es sobrio y de alto contraste.
2. **Los números nunca son un chiste.** Precios, market caps y porcentajes van en
   fuente monoespaciada tabular. Un precio nunca "baila" al actualizarse.
3. **Divertido ≠ infantil.** Nada de Comic Sans, emojis como iconografía funcional
   ni animaciones que interrumpan. La diversión se nota en el detalle (hover,
   gradientes, formas), no en el ruido.

Se ha optado por un **tema oscuro único**. Los colores de las cuatro monedas
(naranja, dorado, verde, ámbar) son saturados y cálidos: sobre fondo claro pierden
fuerza y generan problemas de contraste; sobre carbón cálido brillan. Un solo tema
bien ejecutado > dos temas a medias en un MVP.

---

## 2. Paleta

### 2.1 Fondos — "warm charcoal"

Nunca gris neutro ni negro puro: todos los fondos llevan una pizca de rojo/amarillo
para armonizar con las marcas de las monedas.

| Token Tailwind | Hex | Uso |
| --- | --- | --- |
| `bg-ink-950` | `#0B0A09` | Fondo raíz del documento |
| `bg-ink-900` | `#12100E` | Fondo de página / base del gradiente |
| `bg-ink-800` | `#1A1613` | Superficie de tarjeta |
| `bg-ink-700` | `#241E19` | Superficie elevada, inputs, hover de fila |
| `bg-ink-600` | `#332A22` | Bordes, separadores |
| `bg-ink-500` | `#4A3D31` | Borde en hover, estados disabled |

### 2.2 Colores de marca (uno por moneda)

Cada moneda tiene un color propio que tiñe su tarjeta, su glow y los acentos de su
página de detalle. Es el recurso principal de identidad del producto.

| Moneda | Token | Hex | Notas |
| --- | --- | --- | --- |
| Shiba Inu | `shiba` | `#FF7A18` | Naranja cálido del Shiba |
| Dogecoin | `doge` | `#F5C542` | Dorado mostaza |
| Pepe | `pepe` | `#4ADE80` | Verde brillante |
| Bonk | `bonk` | `#FFB627` | Ámbar vibrante |

Cada uno tiene variantes `-soft` (fondo tintado al ~12 %) y `-deep` (versión oscura
para gradientes). Se exponen además como variables CSS por página
(`--coin-accent`, `--coin-accent-soft`) para que los componentes genéricos se tiñan
solos sin lógica condicional.

### 2.3 Primarios de UI

Los colores de acción se derivan del cruce Shiba × Doge — el "calor" común a las
cuatro marcas — para que la UI sea coherente sin pertenecer a ninguna moneda.

| Token | Hex | Uso |
| --- | --- | --- |
| `brand-500` | `#FF8A1F` | Color de acción principal |
| `brand-400` | `#FFA23D` | Hover |
| `brand-600` | `#E56A00` | Active / pressed |
| `accent-500` | `#4ADE80` | Acento secundario (verde Pepe): likes, éxito, activos |
| `gradient-hype` | `#FF7A18 → #F5C542` | Gradiente de titulares y CTA |

### 2.4 Texto

| Token | Hex | Uso |
| --- | --- | --- |
| `text-cream` | `#FFF8EF` | Titulares, precios, texto primario |
| `text-sand` | `#C6B7A6` | Texto secundario, labels |
| `text-dust` | `#8C7C6C` | Metadatos, timestamps, placeholders |

`cream` sobre `ink-800` da ~15:1 de contraste; `sand` ~7:1; `dust` ~4.6:1 y por eso
`dust` solo se usa en texto de apoyo, nunca en contenido esencial.

### 2.5 Estados de mercado

**Regla dura: verde y rojo se reservan para dirección de precio.** No se usan para
nada más en la UI, para que un vistazo baste para leer el mercado.

| Token | Hex | Uso |
| --- | --- | --- |
| `up-500` | `#3DDC84` | Subida de precio, delta positivo |
| `up-soft` | `rgba(61,220,132,.14)` | Fondo del badge en verde |
| `down-500` | `#FF4D6A` | Bajada de precio, delta negativo |
| `down-soft` | `rgba(255,77,106,.14)` | Fondo del badge en rojo |
| `flat-500` | `#8C7C6C` | Variación nula o dato no disponible |

Además del color, la dirección se refuerza siempre con **signo (+/−) y una flecha**:
no dependemos solo del color (daltonismo).

---

## 3. Tipografía

Tres familias, cada una con un trabajo que la otra no puede hacer.

| Rol | Familia | Token | Por qué |
| --- | --- | --- | --- |
| Display | **Bricolage Grotesque** | `font-display` | Grotesca variable con formas ligeramente irregulares y ancho ajustable: da carácter en titulares sin caer en fuente de póster de fiesta. |
| Interfaz | **Inter** | `font-sans` | Neutra, altísima legibilidad en tamaños pequeños. Todo el texto de lectura. |
| Datos | **JetBrains Mono** | `font-mono` | Cifras tabulares: los precios no cambian de ancho al actualizarse. Exclusiva para números y símbolos de ticker. |

### Escala tipográfica

| Clase | Tamaño / interlineado | Uso |
| --- | --- | --- |
| `text-display-xl` | 56 / 1.0, tracking −0.03em | Hero de la home |
| `text-display-lg` | 40 / 1.05, tracking −0.02em | Título de página de moneda |
| `text-display-md` | 28 / 1.15 | Cabeceras de sección |
| `text-lg` | 18 / 1.5 | Subtítulo, intro |
| `text-base` | 16 / 1.6 | Cuerpo, comentarios |
| `text-sm` | 14 / 1.5 | Metadatos, labels |
| `text-xs` | 12 / 1.4, tracking 0.08em, uppercase | Eyebrows, etiquetas de tabla |

Los titulares display van en peso 700–800; el cuerpo en 400–500. Nunca display por
debajo de 20 px: a tamaño pequeño su carácter se lee como ruido.

---

## 4. Espaciado y layout

Escala base de **4 px**. Se usan casi siempre los pasos 2/3/4/6/8/12/16
(8, 12, 16, 24, 32, 48, 64 px).

- Ancho máximo de contenido: **1200 px** (`max-w-shell`), con `px-4 md:px-8`.
- Padding interno de tarjeta: 20 px móvil, 24 px desktop.
- Separación vertical entre secciones: 48 px móvil, 64 px desktop.
- Grid de monedas: 1 columna en móvil, 2 en `md`, 4 en `xl`, gap de 20 px.

## 5. Radios, bordes y profundidad

| Token | Valor | Uso |
| --- | --- | --- |
| `rounded-card` | 20 px | Tarjetas, paneles, modales |
| `rounded-input` | 14 px | Inputs, selects, textareas |
| `rounded-full` | 9999 px | Botones, badges, avatares, pills |

La profundidad **no** se hace con sombras negras (invisibles sobre fondo oscuro),
sino con tres capas combinadas:

1. **Borde de 1 px** semitransparente claro (`border-white/6`) que simula luz cenital.
2. **Sombra difusa** `shadow-soft` (`0 12px 32px -12px rgba(0,0,0,.7)`) para despegar
   del fondo.
3. **Glow de color** `shadow-glow` — halo del color de la moneda al 25 %, solo en
   hover o en elementos destacados. Es el recurso que da el punto "degen".

Los botones primarios llevan además un `inset` claro de 1 px arriba: simula un
material plástico con brillo, no un rectángulo plano.

## 6. Componentes

### Botón

| Variante | Fondo | Texto | Uso |
| --- | --- | --- | --- |
| `primary` | gradiente `hype` | `ink-950` | Acción principal, uno por vista |
| `secondary` | `ink-700` + borde | `cream` | Acciones de apoyo |
| `ghost` | transparente | `sand` | Terciaria, iconos |
| `danger` | `down-soft` + borde | `down-500` | Borrar |

Alturas: `sm` 32 px, `md` 40 px, `lg` 48 px. Siempre pill. En hover: `translateY(-1px)`
+ glow; en active vuelve a `0`. Focus visible obligatorio con anillo `brand-400`.

### Card

`bg-ink-800` + borde `white/6` + `rounded-card` + `shadow-soft`. En hover (si es
interactiva): borde teñido con el color de la moneda, `translateY(-2px)` y glow.
Transición 180 ms `ease-out`.

### Input

`bg-ink-700`, borde `white/8`, `rounded-input`, alto 44 px, placeholder en `dust`.
En focus: borde `brand-500` + anillo de 3 px `brand-500/25`. Los errores usan
`down-500` en borde **y** texto de ayuda (nunca solo color).

### Badge de variación

Pill compacta, `font-mono`, fondo `up-soft`/`down-soft`, texto `up-500`/`down-500`,
con flecha ▲/▼ y signo explícito.

## 7. Movimiento

- Duración estándar **180 ms**, `ease-out`. Nada por encima de 300 ms.
- Solo se animan `transform`, `opacity`, `box-shadow`, `border-color` (propiedades
  baratas para el compositor).
- Microinteracciones: elevación en hover de tarjeta, "pop" del corazón al dar like
  (escala 1 → 1.25 → 1), barrido del gradiente en el CTA, subrayado que crece en los
  enlaces de navegación.
- Se respeta `prefers-reduced-motion: reduce`: todas las animaciones se desactivan.

## 8. Accesibilidad

- Contraste mínimo AA (4.5:1) para todo el texto; los tokens ya lo cumplen.
- La dirección del precio se codifica con color **+ signo + flecha**.
- Foco visible en todo elemento interactivo; nunca `outline: none` sin sustituto.
- Los botones de icono llevan `aria-label`; el botón de like expone `aria-pressed`.
- Objetivos táctiles ≥ 40 px de alto.
