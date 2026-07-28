# Sistema de diseño — Memecoin Plaza

Documento de referencia de la identidad visual. **Todo lo que aparece aquí está
implementado como tokens en `tailwind.config.ts` y `src/app/globals.css`.** Si vas a
añadir una pantalla nueva, usa tokens — no hex sueltos ni valores mágicos.

---

## 1. Principio rector

> Energía meme/degen, ejecución de producto serio.

Traducción práctica en tres reglas que resuelven casi cualquier duda de diseño:

1. **El color grita, la tipografía susurra.** La personalidad vive en el color de
   cada moneda, los degradados y la luz. El texto de lectura es sobrio y de alto
   contraste.
2. **Los números nunca son un chiste.** Precios, capitalizaciones y porcentajes
   van en fuente monoespaciada tabular. Un precio nunca "baila" al actualizarse.
3. **Divertido ≠ infantil.** Nada de Comic Sans, emojis como iconografía
   funcional ni animaciones que interrumpan. La diversión se nota en el detalle
   (hover, degradados, formas), no en el ruido.

**Tema claro único.** La base es una crema cálida (`#FFFBF3`), no blanco puro: el
blanco puro deja los naranjas y dorados de las cuatro marcas flotando sin
contexto, mientras que sobre crema entran en la misma familia de temperatura. Un
solo tema bien ejecutado > dos temas a medias en un MVP.

---

## 2. Paleta

Todos los colores de texto de esta sección están **verificados a WCAG AA
(≥ 4,5:1)** sobre `canvas` y sobre `surface`. No es una estimación: los ratios se
calcularon antes de fijar los valores, y varios tokens se oscurecieron a
propósito para llegar (`brand-strong`, `up` e `ink-faint` no pasaban en su primer
valor).

### 2.1 Superficies — crema cálida

Nunca gris neutro: todos los fondos llevan una pizca de rojo/amarillo para
armonizar con las marcas de las monedas.

| Token Tailwind | Hex | Uso |
| --- | --- | --- |
| `bg-canvas` | `#FFFBF3` | Fondo de página |
| `bg-surface` | `#FFFFFF` | Superficie de tarjeta y panel |
| `bg-sunken` | `#FBF3E6` | Inputs, fondos secundarios, hover de fila |
| `border-line` | `#F0E3CE` | Bordes y separadores |
| `border-line-strong` | `#E0CDB0` | Borde en hover, contornos marcados |

### 2.2 Colores de marca (uno por moneda)

Cada una de las **20 monedas** tiene un color propio que tiñe su tarjeta, su
franja superior y los acentos de su página de detalle. Es el recurso principal de
identidad.

Sobre fondo claro un amarillo o un verde vivos **no se leen como texto**, así que
cada moneda tiene dos variantes y no son intercambiables:

- **`accent`** → logos, franjas, halos, relleno del área del gráfico.
- **`accentInk`** → texto, trazo del gráfico, iconos y estados activos.

Las variantes `accentInk` **no están elegidas a ojo**: se generan oscureciendo el
tono del `accent` (manteniendo matiz y saturación) hasta pasar 4,6:1 sobre crema
y sobre blanco. `src/lib/coins.test.ts` lo vuelve a comprobar en cada ejecución de
`npm test`, junto con dos reglas más:

- `accent` siempre más claro que `accentInk` (si se invierten, los rellenos salen
  oscuros y los textos ilegibles).
- Ningún `accentInk` puede acercarse a los tokens `up` o `down`, para que un trazo
  de color nunca se confunda con "sube" o "baja". Pepe es la única excepción
  asumida: es verde por definición.

Las cuatro originales, como referencia:

| Moneda | `accent` (vivo) | `accentInk` (AA) |
| --- | --- | --- |
| Shiba Inu | `#FF7A18` | `#BE5000` |
| Dogecoin | `#F5C542` | `#926C04` |
| Pepe | `#4ADE80` | `#15843E` |
| Bonk | `#FFB627` | `#9C6700` |

Ambas viajan como variables CSS por página (`--coin-accent`, `--coin-accent-ink`)
para que los componentes genéricos se tiñan solos sin lógica condicional por
moneda.

### 2.3 Primarios de UI

Los colores de acción se derivan del cruce Shiba × Doge — el "calor" común a las
cuatro marcas — para que la UI sea coherente sin pertenecer a ninguna moneda.

| Token | Hex | Uso |
| --- | --- | --- |
| `brand` | `#FF7A18` | Rellenos y degradados de acción |
| `brand-strong` | `#B84E08` | **La única variante válida para texto y enlaces** (4,92:1) |
| `bg-hype` | `#FF7A18 → #FFC42E` | Gradiente de titulares y CTA |

El botón primario lleva **texto oscuro** (`ink`) sobre el gradiente, no blanco:
en blanco el naranja se queda en 2,6:1 y no pasa AA; en oscuro sube a ~11:1.

### 2.4 Texto

| Token | Hex | Contraste sobre canvas | Uso |
| --- | --- | --- | --- |
| `text-ink` | `#1F1710` | 17,1:1 | Titulares, precios, texto primario |
| `text-ink-soft` | `#6A5847` | 6,6:1 | Texto secundario, cuerpo |
| `text-ink-faint` | `#7C6957` | 5,1:1 | Metadatos, timestamps, placeholders |

### 2.5 Estados de mercado

**Regla dura: verde y rojo se reservan para dirección de precio.** No se usan
para nada más en la UI, para que un vistazo baste para leer el mercado. (El botón
de "me gusta" usa naranja de marca justamente por esto.)

| Token | Hex | Uso |
| --- | --- | --- |
| `up` | `#0B7F45` | Subida de precio, delta positivo |
| `up-soft` | `rgba(11,127,69,.10)` | Fondo del badge en verde |
| `down` | `#CE1F45` | Bajada de precio, delta negativo |
| `down-soft` | `rgba(206,31,69,.09)` | Fondo del badge en rojo |
| `flat` | `#7C6957` | Variación nula o dato no disponible |

Además del color, la dirección se refuerza siempre con **signo (+/−) y una
flecha**: no dependemos solo del color (daltonismo).

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

Sobre fondo claro la profundidad **sí** se hace con sombra real, pero tintada en
cálido: una sombra gris o negra sobre crema se ve sucia.

1. **Borde de 1 px** `border-line` que define el canto de la tarjeta.
2. **Sombra** `shadow-soft` — `0 1px 2px rgba(31,23,16,.04)` de contacto más
   `0 8px 24px -14px rgba(31,23,16,.16)` de difusión.
3. **`shadow-lift`** para elementos flotantes (menús, tooltips).
4. **`shadow-glow`** — la difusión toma el color de la moneda, solo en hover de
   tarjeta. Es el recurso que da el punto "degen".

Las tarjetas de moneda llevan además una **franja de 1 px del color de la marca**
en el borde superior: sobre fondo claro el borde teñido solo no se distingue, y
la franja identifica la moneda de un vistazo.

Los botones primarios llevan un `inset` claro de 1 px arriba: simulan un material
plástico con brillo, no un rectángulo plano.

## 6. Componentes

### Botón

| Variante | Fondo | Texto | Uso |
| --- | --- | --- | --- |
| `primary` | gradiente `hype` | `ink` (oscuro) | Acción principal, uno por vista |
| `secondary` | `surface` + borde | `ink` | Acciones de apoyo |
| `ghost` | transparente | `ink-soft` | Terciaria, iconos |
| `danger` | `down-soft` + borde | `down` | Borrar |

Alturas: `sm` 32 px, `md` 40 px, `lg` 48 px. Siempre pill. En hover:
`translateY(-1px)` + brillo; en active vuelve a `0`. Focus visible obligatorio
con anillo `brand`.

### Card

`bg-surface` + borde `line` + `rounded-card` + `shadow-soft`. En hover (si es
interactiva): borde del color de la moneda, `translateY(-2px)` y glow.
Transición 180 ms `ease-out`.

### Input

`bg-sunken`, borde `line`, `rounded-input`, alto 44 px, placeholder en
`ink-faint`. En focus: borde `brand` + anillo de 3 px `brand/25`. Los errores
usan `down` en borde **y** texto de ayuda (nunca solo color).

### Badge de variación

Pill compacta, `font-mono`, fondo `up-soft`/`down-soft`, texto `up`/`down`, con
flecha ▲/▼ y signo explícito.

### Indicador "en vivo"

Punto que late + etiqueta de estado + "hace X s". Tres estados: `live` (verde),
`stale` (ámbar, reintentando) y `error` (rojo). Sin él, un número que se
actualiza solo es indistinguible de uno congelado.

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
- Los mensajes de error dicen qué puede hacer la persona, no qué falló por dentro
  (ver "Textos de cara al usuario" en el README).

---

## 9. Formateo de cifras

Solo se usa `Intl` para la **parte numérica**; el símbolo de moneda y el sufijo
de escala se componen a mano en `src/lib/format.ts`.

El motivo es concreto: `Intl.NumberFormat` con `style:"currency"` y
`notation:"compact"` da resultados distintos en Node y en Chrome
(`23,45 mil M US$` contra `23,45 mil MUS$`). Esa diferencia rompía la hidratación
de React en todas las páginas con precios, además de leerse mal. Componer el
formato a mano lo hace determinista entre motores.

Los decimales se eligen según la magnitud, no fijos: PEPE cotiza a ~0,0000012 $ y
con dos decimales se mostraría como `0,00 $`.
