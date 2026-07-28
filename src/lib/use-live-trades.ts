"use client";

import { useEffect, useState } from "react";

import {
  fusionar,
  parsearMensaje,
  type EstadoConexion,
  type Trade,
} from "@/lib/trades";

export type { EstadoConexion, Trade } from "@/lib/trades";

/**
 * Operaciones en vivo.
 *
 * La conexión la abre **el navegador de cada visitante**, no nuestro servidor.
 * Es una decisión deliberada:
 *
 *  - Una cinta de operaciones necesita latencia de milisegundos. Sondear cada
 *    pocos segundos daría una lista de cosas que ya pasaron, no un directo.
 *  - Retransmitir el flujo desde el servidor obligaría a mantener una conexión
 *    persistente por visitante, que es justo lo que un despliegue sin servidor
 *    dedicado no puede sostener.
 *  - El flujo es público y no lleva credenciales, así que no hay nada que
 *    proteger detrás de un intermediario.
 *
 * Pero abrir la conexión desde el navegador tiene un coste: hay redes que la
 * bloquean. Redes de empresa, algunos operadores móviles y no pocos antivirus
 * cortan los puertos poco habituales. Por eso hay tres niveles de respaldo:
 *
 *  1. Se prueban varios hosts, empezando por el que va por el puerto estándar.
 *  2. Si ninguno abre, se pasa a sondear nuestro propio servidor, que sí puede
 *     traer las últimas operaciones por una vía normal. Se pierde el directo
 *     exacto, pero los datos siguen siendo reales, y la página lo dice.
 *  3. Si tampoco eso funciona, se avisa sin dejar la pantalla en blanco.
 *
 * A cambio hay que ser honesto sobre qué se está viendo: **las operaciones de
 * un solo mercado**, no de todo el sector. Se etiqueta como tal en la interfaz.
 */

/**
 * Hosts a probar, en orden.
 *
 * El primero va por el puerto 443, el mismo que cualquier página web, así que
 * atraviesa casi cualquier red. El del puerto 9443 va el último precisamente
 * porque es el que más veces se encuentra cerrado.
 */
const ENDPOINTS = process.env.NEXT_PUBLIC_TRADES_WS
  ? // Se admite una lista separada por comas para poder apuntar a otros hosts
    // sin tocar el código. Las direcciones no llevan comas, así que no choca.
    process.env.NEXT_PUBLIC_TRADES_WS.split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  : [
      "wss://data-stream.binance.vision/stream?streams=",
      "wss://stream.binance.com:443/stream?streams=",
      "wss://stream.binance.com:9443/stream?streams=",
    ];

/**
 * Cuánto se espera a que un host abra antes de darlo por perdido.
 *
 * Sin este límite la página se queda en «Conectando» indefinidamente: una red
 * que filtra un puerto normalmente no rechaza la conexión, simplemente se queda
 * callada, y el navegador puede tardar más de un minuto en rendirse.
 */
const TIEMPO_APERTURA_MS = 6000;

/** Cada cuánto se pide el lote de respaldo cuando no hay flujo directo. */
const SONDEO_MS = 5000;

/** Sondeos seguidos sin nada antes de admitir que no hay datos. */
const FALLOS_ANTES_DE_RENDIRSE = 3;

/** Espera entre un host y el siguiente. Corta: aquí no hay nada que castigar. */
const ESPERA_ENTRE_HOSTS_MS = 400;

/**
 * Lo aprendido sobre esta red, fuera del componente a propósito.
 *
 * Que un host abra o no depende de la red del visitante, no de qué monedas haya
 * elegido. Sin esta memoria, cada vez que alguien tocaba una moneda se volvía a
 * probar el host muerto desde cero: otro error en consola y varios segundos de
 * espera antes de volver al respaldo. Guardándolo aquí, se aprende una vez por
 * pestaña y las siguientes selecciones van directas a lo que funciona.
 */
let hostAprendido = 0;
let diferidoAprendido = false;

export function useLiveTrades(pares: { coinId: string; pair: string }[]) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [estado, setEstado] = useState<EstadoConexion>("conectando");

  /**
   * Toda la configuración del efecto viaja en una sola cadena.
   *
   * Es lo que evita el problema que tenía la versión anterior: si el efecto
   * depende de un array o de una función memorizada, cualquier render puede
   * volver a dispararlo, y cada disparo dejaba atrás un socket que seguía vivo
   * reconectándose por su cuenta. Con una dependencia primitiva, el efecto se
   * ejecuta exactamente cuando cambian las monedas elegidas y nunca más.
   */
  const clave = pares
    .map((p) => `${p.pair.toLowerCase()}:${p.coinId}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (typeof window === "undefined" || clave === "") return;

    const entradas = clave.split(",").map((trozo) => {
      const [pair, coinId] = trozo.split(":");
      return { pair, coinId };
    });
    const porPar = new Map(entradas.map((e) => [e.pair, e.coinId]));
    const streams = entradas.map((e) => `${e.pair}@aggTrade`).join("/");
    const monedas = entradas.map((e) => e.coinId).join(",");

    /**
     * Bandera local al efecto, no una ref compartida.
     *
     * Este es el arreglo de fondo. Con una ref, la limpieza de un efecto la
     * ponía a `true` y el siguiente efecto la devolvía a `false` antes de que
     * llegara el evento `close` del socket anterior —`close()` es asíncrono—,
     * así que el socket viejo se creía vivo y programaba su propia reconexión.
     * Cada cambio de selección duplicaba las conexiones abiertas.
     */
    let vivo = true;
    let socket: WebSocket | null = null;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    let apertura: ReturnType<typeof setTimeout> | null = null;
    let sondeo: ReturnType<typeof setInterval> | null = null;
    let indiceHost = hostAprendido;
    let reintentos = 0;
    let fallosSondeo = 0;
    let enDiferido = diferidoAprendido;

    const empujar = (nuevas: Trade[]) => {
      if (!vivo || nuevas.length === 0) return;
      setTrades((previas) => fusionar(previas, nuevas));
    };

    /** Desactiva los manejadores antes de cerrar: un socket muerto no habla. */
    const cerrar = (s: WebSocket | null) => {
      if (!s) return;
      s.onopen = null;
      s.onmessage = null;
      s.onerror = null;
      s.onclose = null;
      try {
        s.close();
      } catch {
        // Ya estaba cerrado o nunca llegó a abrirse.
      }
    };

    const limpiarTemporizadores = () => {
      if (temporizador) {
        clearTimeout(temporizador);
        temporizador = null;
      }
      if (apertura) {
        clearTimeout(apertura);
        apertura = null;
      }
      if (sondeo) {
        clearInterval(sondeo);
        sondeo = null;
      }
    };

    const detener = () => {
      limpiarTemporizadores();
      cerrar(socket);
      socket = null;
    };

    // ---- Respaldo por sondeo -------------------------------------------------

    const sondear = async () => {
      try {
        const respuesta = await fetch(`/api/trades?monedas=${encodeURIComponent(monedas)}`, {
          cache: "no-store",
        });
        if (!vivo) return;

        const cuerpo = (await respuesta.json()) as { trades?: Trade[] };
        if (!vivo) return;

        const lote = Array.isArray(cuerpo.trades) ? cuerpo.trades : [];
        if (lote.length === 0) {
          fallosSondeo += 1;
          if (fallosSondeo >= FALLOS_ANTES_DE_RENDIRSE) setEstado("error");
          return;
        }

        fallosSondeo = 0;
        empujar(lote);
        setEstado("diferido");
      } catch {
        if (!vivo) return;
        fallosSondeo += 1;
        if (fallosSondeo >= FALLOS_ANTES_DE_RENDIRSE) setEstado("error");
      }
    };

    const activarDiferido = () => {
      if (!vivo || sondeo) return;
      enDiferido = true;
      diferidoAprendido = true;
      setEstado("diferido");
      void sondear();
      sondeo = setInterval(() => void sondear(), SONDEO_MS);
    };

    // ---- Flujo directo -------------------------------------------------------

    const siguienteHost = () => {
      if (!vivo) return;

      indiceHost += 1;
      if (indiceHost >= ENDPOINTS.length) {
        // Ningún host ha abierto. La red de este visitante bloquea la conexión
        // directa, así que la única salida es pasar por nuestro servidor.
        activarDiferido();
        return;
      }

      setEstado("reconectando");
      temporizador = setTimeout(abrir, ESPERA_ENTRE_HOSTS_MS);
    };

    function abrir() {
      if (!vivo) return;

      let s: WebSocket;
      try {
        s = new WebSocket(`${ENDPOINTS[indiceHost]}${streams}`);
      } catch {
        siguienteHost();
        return;
      }

      socket = s;
      let abierto = false;

      apertura = setTimeout(() => {
        if (!vivo || abierto || socket !== s) return;
        // Se quedó en «conectando» sin abrir ni fallar: el puerto está filtrado.
        cerrar(s);
        if (socket === s) socket = null;
        siguienteHost();
      }, TIEMPO_APERTURA_MS);

      s.onopen = () => {
        if (!vivo || socket !== s) return;
        abierto = true;
        reintentos = 0;
        hostAprendido = indiceHost;
        if (apertura) {
          clearTimeout(apertura);
          apertura = null;
        }
        setEstado("en-vivo");
      };

      s.onmessage = (evento) => {
        if (!vivo || socket !== s) return;

        let carga: unknown;
        try {
          carga = JSON.parse(evento.data as string);
        } catch {
          return;
        }

        const trade = parsearMensaje(carga, porPar);
        if (trade) empujar([trade]);
      };

      s.onerror = () => {
        // El cierre llega justo después; se gestiona ahí para no duplicar avisos.
      };

      s.onclose = () => {
        // Un socket que ya no es el actual no decide nada: es el resto del bug
        // anterior, y con esta comprobación no puede repetirse.
        if (!vivo || socket !== s) return;

        if (apertura) {
          clearTimeout(apertura);
          apertura = null;
        }
        socket = null;

        if (!abierto) {
          siguienteHost();
          return;
        }

        // La conexión funcionaba y se ha caído: se reintenta el mismo host con
        // espera creciente hasta 30 s. Martillear cada segundo no arregla nada.
        setEstado("reconectando");
        const espera = Math.min(30_000, 1000 * 2 ** Math.min(reintentos, 5));
        reintentos += 1;
        temporizador = setTimeout(abrir, espera);
      };
    }

    const arrancar = () => {
      detener();
      if (enDiferido) {
        activarDiferido();
        return;
      }
      indiceHost = hostAprendido;
      setEstado("conectando");
      abrir();
    };

    /**
     * Con la pestaña en segundo plano no se mira nada, así que no se recibe
     * nada. Un flujo de operaciones puede ser de varios mensajes por segundo;
     * mantenerlo abierto sin nadie delante solo gasta batería.
     */
    const alCambiarVisibilidad = () => {
      if (!vivo) return;
      if (document.hidden) detener();
      else arrancar();
    };

    setTrades([]);
    if (enDiferido) {
      activarDiferido();
    } else {
      setEstado("conectando");
      abrir();
    }
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      detener();
    };
  }, [clave]);

  return { trades, estado };
}
