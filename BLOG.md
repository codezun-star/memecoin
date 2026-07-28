# Cómo publicar un artículo

El contenido vive entero en ficheros markdown: **publicar es crear un fichero y
desplegar**, sin base de datos y sin panel de administración.

Los comentarios de los artículos sí usan Supabase, igual que los de las fichas de
monedas, pero son un añadido encima: el artículo se genera y se lee igual aunque
no haya nadie registrado.

---

## Los tres pasos

### 1. Crea el fichero

En `content/blog/`, con extensión `.md`. **El nombre del fichero es la URL**:

```
content/blog/por-que-subio-bonk.md   →   memecoin.codezun.com/blog/por-que-subio-bonk
```

Usa minúsculas y guiones. Nada de espacios, acentos ni mayúsculas — si los pones,
se convierten solos, pero es mejor escribirlo bien desde el principio.

### 2. Escribe el frontmatter

Va al principio del fichero, entre `---`, y es lo que alimenta el listado, el SEO
y las redes sociales:

```markdown
---
title: "Por qué subió Bonk esta semana"
description: "El airdrop a la comunidad de Solana, el volumen que trajo y qué dice el gráfico de los últimos siete días."
date: 2026-08-03
keywords: [bonk, airdrop bonk, análisis bonk]
faq:
  - pregunta: "¿Por qué subió Bonk esta semana?"
    respuesta: "Por la combinación del airdrop a la comunidad de Solana y el volumen que trajo consigo."
---

Aquí empieza el artículo…
```

### 3. Sube el fichero

Haz commit y push a `main`. Vercel reconstruye y el artículo aparece publicado,
en el listado y en el `sitemap.xml`. **No hay que tocar código.**

---

## Campos del frontmatter

| Campo | ¿Obligatorio? | Para qué sirve |
| --- | --- | --- |
| `title` | **Sí** | Titular del artículo, `<title>` de la pestaña y titular en redes |
| `description` | **Sí** | Resumen del listado, meta description de Google y texto al compartir |
| `date` | **Sí** | Fecha de publicación. Ordena el listado (más reciente arriba) |
| `keywords` | No | Palabras clave. No se muestran: alimentan la metadata |
| `faq` | No | Preguntas frecuentes. Se pintan al final y generan el esquema `FAQPage` de Google |
| `image` | No | Imagen destacada. Si no la pones, se usa la portada con el logo |
| `imageAlt` | No | Descripción de la imagen para lectores de pantalla |
| `slug` | No | Fuerza una URL distinta al nombre del fichero |
| `author` | No | Por defecto, "Memecoin Plaza" |
| `updated` | No | Fecha de última revisión. Se muestra y se manda a Google |
| `draft` | No | `true` lo oculta en producción, pero se ve en `npm run dev` |

**Si falta `title`, `description` o `date`, el artículo se ignora** y sale un
aviso en el log del build. Es deliberado: un fichero a medias no tira el
despliegue entero del sitio, pero tampoco se publica a medias.

### Sobre la descripción

Es el campo que más rinde en SEO: es lo que Google enseña debajo del titular.
Apunta a **150-160 caracteres** y que se lea como una frase, no como una lista de
palabras clave.

### Sobre las imágenes

**Si no pones ninguna, se usa la portada con el logo** (`/blog/portada.png`), así
que ningún artículo se queda sin imagen.

Para una propia, ponla en `public/blog/` y referencia `image: /blog/nombre.jpg`.
Lo ideal es **1200×630**: es la proporción que usan las tarjetas de Twitter,
WhatsApp y LinkedIn. Una imagen cuadrada funciona, pero se recorta.

### Sobre las preguntas frecuentes

El bloque `faq` no es decorativo: genera el esquema `FAQPage` que Google puede
usar para desplegar las preguntas directamente en los resultados de búsqueda.
Tres o cuatro preguntas reales, con respuestas de una o dos frases que se
entiendan sin leer el artículo, es lo que mejor funciona.

---

## Qué puedes escribir en el cuerpo

Markdown estándar, más las extensiones de GitHub:

```markdown
## Encabezado de sección

Texto normal con **negrita**, *cursiva* y [enlaces](https://ejemplo.com).

- Listas
- Con viñetas

1. O numeradas
2. Como esta

> Una cita destacada, que sale con una barra naranja al lado.

| Tabla | Con columnas |
| --- | --- |
| Fila | Valor |

`código en línea` y bloques de código con triple acento grave.
```

Cada `##` y `###` genera automáticamente un enlace a sí mismo, así que se puede
compartir un punto concreto del artículo. Los `##` forman además el índice que
aparece al principio.

**Los enlaces externos salen solos con `rel="nofollow noopener noreferrer"` y se
abren en otra pestaña.** Citar una fuente da contexto al lector, pero no tiene
por qué regalarle autoridad de dominio. Los enlaces internos (a `/blog/…` o a
`/coin/…`) no llevan `nofollow`: esos sí queremos que transmitan autoridad, y son
la forma principal de que los artículos se refuercen entre sí.

---

## Antes de publicar

```bash
npm run dev
```

Y abre `http://localhost:3000/blog`. Con `npm run dev` **también se ven los
borradores** (`draft: true`), así que puedes dejar un artículo a medias en el
repositorio sin que salga publicado.

---

## Lo que pasa solo, sin que hagas nada

Al añadir un `.md` y desplegar:

- Aparece en `/blog`, arriba del todo si es el más reciente.
- Se genera su página en `/blog/su-slug`, **pre-renderizada como HTML estático**
  en el build (por eso carga instantánea y Google la indexa sin ejecutar JavaScript).
- Entra en `sitemap.xml` con su fecha real de publicación.
- Se generan sus etiquetas Open Graph y tres esquemas de datos estructurados:
  `BlogPosting` (fecha y autor en el resultado), `BreadcrumbList` (la ruta bajo
  el titular) y `FAQPage` si hay preguntas.
- Se monta su índice a partir de los `##`, si hay tres o más.
- Se abre su hilo de comentarios, donde los usuarios registrados pueden
  responder y dar likes igual que en las fichas de las monedas.
- Aparece en "Sigue leyendo" del resto de artículos.

---

## Detalle técnico, por si hace falta tocarlo

Todo el parseo está en [`src/lib/blog.ts`](src/lib/blog.ts): lee `content/blog/`,
saca el frontmatter con `gray-matter` y convierte el markdown a HTML con
`remark`/`rehype`.

El HTML del artículo se inyecta con `dangerouslySetInnerHTML`. Es seguro **porque
el contenido son ficheros de este repositorio**, escritos por quien mantiene el
sitio y revisados al hacer merge: no hay entrada de terceros en ese camino. Por eso
también se permite HTML suelto dentro del markdown, para poder incrustar algo
puntual. Si algún día el blog acepta artículos de fuera, ese HTML habría que
sanearlo (`rehype-sanitize`) antes de renderizarlo.
