import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import matter from "gray-matter";

import { TRACKED_COINS } from "./coins";

/**
 * Comprobaciones sobre las fichas de las monedas.
 *
 * Se lee el markdown directamente en vez de importar `coin-content.ts` porque
 * ese módulo lleva `server-only` y no se puede cargar fuera de Next.
 *
 * Lo que se vigila aquí no es el estilo, es lo que se rompe en silencio: un
 * título que se corta en el buscador, una descripción que nadie llega a leer
 * entera o una ficha sin preguntas frecuentes no dan ningún error al compilar.
 */

const DIR = path.join(process.cwd(), "content", "monedas");

/** Un buscador corta el título alrededor de los 60 caracteres. */
const MAX_TITULO = 60;

/** Por debajo de 70 la descripción desaprovecha sitio; por encima de 160 se corta. */
const MIN_DESC = 70;
const MAX_DESC = 160;

const ficheros = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];

function leer(fichero: string) {
  return matter(fs.readFileSync(path.join(DIR, fichero), "utf8"));
}

test("todas las monedas del registro tienen ficha", () => {
  const conFicha = new Set(ficheros.map((f) => f.replace(/\.md$/, "")));
  const sinFicha = TRACKED_COINS.filter((c) => !conFicha.has(c.id)).map((c) => c.id);
  assert.deepEqual(sinFicha, [], `sin ficha: ${sinFicha.join(", ")}`);
});

test("no hay fichas huérfanas de monedas que ya no seguimos", () => {
  const ids = new Set(TRACKED_COINS.map((c) => c.id));
  const huerfanas = ficheros.map((f) => f.replace(/\.md$/, "")).filter((s) => !ids.has(s as never));
  assert.deepEqual(huerfanas, [], `sobran: ${huerfanas.join(", ")}`);
});

test("los títulos caben en un resultado de búsqueda", () => {
  for (const fichero of ficheros) {
    const { data } = leer(fichero);
    const titulo = String(data.seoTitle ?? "");
    assert.ok(titulo.length > 0, `${fichero}: sin seoTitle`);
    assert.ok(
      titulo.length <= MAX_TITULO,
      `${fichero}: seoTitle de ${titulo.length} caracteres (máximo ${MAX_TITULO})`,
    );
  }
});

test("las descripciones están en el rango que se muestra entero", () => {
  for (const fichero of ficheros) {
    const { data } = leer(fichero);
    const desc = String(data.seoDescription ?? "");
    assert.ok(
      desc.length >= MIN_DESC && desc.length <= MAX_DESC,
      `${fichero}: seoDescription de ${desc.length} caracteres (rango ${MIN_DESC}-${MAX_DESC})`,
    );
  }
});

test("cada ficha trae preguntas frecuentes completas", () => {
  for (const fichero of ficheros) {
    const { data } = leer(fichero);
    const faq = data.faq as { pregunta?: string; respuesta?: string }[] | undefined;

    assert.ok(Array.isArray(faq) && faq.length >= 3, `${fichero}: menos de 3 preguntas`);
    for (const item of faq) {
      assert.ok(item.pregunta?.trim(), `${fichero}: pregunta vacía`);
      // Una respuesta de una línea no sirve ni al lector ni al esquema FAQPage.
      assert.ok(
        (item.respuesta ?? "").trim().length >= 80,
        `${fichero}: respuesta demasiado corta a «${item.pregunta}»`,
      );
    }
  }
});

test("el cuerpo tiene extensión suficiente y encabezados", () => {
  for (const fichero of ficheros) {
    const { content } = leer(fichero);

    const palabras = content.split(/\s+/).filter(Boolean).length;
    assert.ok(palabras >= 450, `${fichero}: solo ${palabras} palabras`);

    const h2 = (content.match(/^## /gm) ?? []).length;
    assert.ok(h2 >= 4, `${fichero}: solo ${h2} encabezados de nivel 2`);

    // El h1 lo pone la página con el nombre de la moneda; en el markdown sobra.
    assert.equal((content.match(/^# /gm) ?? []).length, 0, `${fichero}: no debe llevar h1`);
  }
});

test("las palabras clave existen y no se repiten entre sí", () => {
  for (const fichero of ficheros) {
    const { data } = leer(fichero);
    const claves = (data.keywords ?? []) as string[];
    assert.ok(claves.length >= 3, `${fichero}: menos de 3 palabras clave`);
    assert.equal(
      new Set(claves.map((k) => k.toLowerCase())).size,
      claves.length,
      `${fichero}: palabras clave duplicadas`,
    );
  }
});

test("los enlaces internos del cuerpo apuntan a rutas que existen", () => {
  const rutas = new Set([
    "/",
    "/blog",
    "/operaciones",
    ...TRACKED_COINS.map((c) => `/coin/${c.slug}`),
  ]);

  for (const fichero of ficheros) {
    const { content } = leer(fichero);
    for (const [, destino] of content.matchAll(/\]\((\/[^)]*)\)/g)) {
      const limpio = destino.split("#")[0];
      assert.ok(rutas.has(limpio), `${fichero}: enlace roto a ${destino}`);
    }
  }
});

test("ninguna ficha se enlaza a sí misma", () => {
  for (const fichero of ficheros) {
    const slug = fichero.replace(/\.md$/, "");
    const { content } = leer(fichero);
    assert.ok(
      !content.includes(`](/coin/${slug})`),
      `${fichero}: se enlaza a sí misma`,
    );
  }
});
