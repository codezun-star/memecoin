/**
 * Service worker de Memecoin Plaza.
 *
 * Existe por un único motivo: sin un service worker con manejador de `fetch`,
 * el navegador no ofrece instalar la aplicación. Cumple ese requisito y nada más.
 *
 * **No cachea nada.** Es deliberado: esto es una web de precios en vivo y de un
 * foro. Servir una versión guardada mostraría precios viejos y comentarios que
 * ya no están, que es peor que decir claramente que no hay conexión. Tampoco se
 * guarda ningún HTML de páginas con sesión, así que no queda contenido de una
 * cuenta en el disco a la espera de que lo vea otra persona.
 *
 * Lo único que aporta: cuando falla una navegación por falta de red, en vez del
 * dinosaurio del navegador se muestra un aviso propio. Ese aviso va incrustado
 * aquí como texto, no cacheado, para que no dependa de ningún otro recurso.
 */

const VERSION = "v1";

self.addEventListener("install", () => {
  // Sin precarga: no hay nada que guardar.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpia cachés de versiones anteriores por si alguna vez llegaron a existir.
      const nombres = await caches.keys();
      await Promise.all(nombres.map((nombre) => caches.delete(nombre)));
      await self.clients.claim();
    })(),
  );
});

const PAGINA_SIN_CONEXION = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión · Memecoin Plaza</title>
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    padding: 24px; text-align: center; background: #FFFBF3; color: #1F1710;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background-image:
      radial-gradient(40rem 26rem at 10% -10%, rgba(255,122,24,.12), transparent 60%),
      radial-gradient(36rem 24rem at 90% -6%, rgba(74,222,128,.12), transparent 60%);
  }
  .caja { max-width: 26rem }
  img { width: 96px; height: 96px; margin-bottom: 20px }
  h1 { font-size: 1.5rem; margin: 0 0 8px; letter-spacing: -.02em }
  p { margin: 0 0 24px; color: #6A5847; line-height: 1.6 }
  button {
    border: 0; cursor: pointer; border-radius: 999px; padding: 12px 24px;
    font-size: 1rem; font-weight: 600; color: #1F1710;
    background: linear-gradient(96deg, #FF7A18 0%, #FFC42E 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.45);
  }
  button:hover { filter: brightness(1.06) }
</style>
</head>
<body>
  <div class="caja">
    <img src="/icons/icon-192.png" alt="">
    <h1>Te quedaste sin conexión</h1>
    <p>Memecoin Plaza muestra precios en vivo, así que necesita internet para
       funcionar. En cuanto vuelvas a tener red, esto se arregla solo.</p>
    <button onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>`;

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Todo lo que no sea abrir una página va directo a la red, sin tocarlo.
  if (request.method !== "GET" || request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(
      () =>
        new Response(PAGINA_SIN_CONEXION, {
          status: 503,
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        }),
    ),
  );
});

// Permite forzar la actualización desde la página cuando se despliega una versión nueva.
self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.VERSION = VERSION;
