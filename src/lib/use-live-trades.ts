"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fusionar,
  parsearMensaje,
  type EstadoConexion,
  type Trade,
} from "@/lib/trades";
import type { FuenteDeMercado } from "@/lib/coins";

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
 *  - Los flujos son públicos y no llevan credenciales, así que no hay nada que
 *    proteger detrás de un intermediario.
 *
 * Hay **dos mercados**, y se tratan de forma distinta a propósito.
 *
 * El **principal** lista las meme coins grandes y mueve varias operaciones por
 * segundo. Ahí sí compensa la conexión directa desde el navegador: es la única
 * forma de tener latencia de milisegundos.
 *
 * El **secundario** cubre las siete que el principal no lista en contado, y son
 * justamente las menos líquidas: entre operación y operación pasan minutos u
 * horas. Ese flujo **no se pide desde el navegador, se pide a nuestro servidor**.
 *
 * La razón es empírica. La conexión directa a ese mercado falla en bastantes
 * redes —bloqueo regional, filtros corporativos, operadores móviles— y se veía
 * en producción: el navegador no abría, la consola se llenaba de errores y esas
 * monedas tardaban seis segundos en caer al respaldo. Sondear cada cinco
 * segundos algo que se cruza cada diez minutos no pierde absolutamente nada, y
 * a cambio funciona para todo el mundo, esté donde esté.
 *
 * Queda un nivel de respaldo para el mercado principal: si su conexión directa
 * tampoco abre, sus monedas pasan también por el servidor. Y si eso falla, se
 * avisa sin dejar la pantalla en blanco.
 *
 * A cambio hay que ser honesto sobre qué se está viendo: **las operaciones de
 * un solo mercado por moneda**, no de todo el sector, y en diferido cuando toca.
 */

/** Cuánto se espera a que un host abra antes de darlo por perdido. */
const TIEMPO_APERTURA_MS = 6000;

/** Cada cuánto se pide el lote de respaldo cuando no hay flujo directo. */
const SONDEO_MS = 5000;

/** Sondeos seguidos sin nada antes de admitir que no hay datos. */
const FALLOS_ANTES_DE_RENDIRSE = 3;

/** Espera entre un host y el siguiente. Corta: aquí no hay nada que castigar. */
const ESPERA_ENTRE_HOSTS_MS = 400;

/** Estado de una conexión concreta, distinto del que ve la interfaz. */
type EstadoInterno =
  /** Sin monedas de este mercado seleccionadas: no cuenta para nada. */
  | "inactivo"
  | "conectando"
  | "en-vivo"
  | "reconectando"
  /** Ningún host abrió. Si todos los mercados llegan aquí, toca el respaldo. */
  | "agotado";

/**
 * Lo que cambia de un mercado a otro.
 *
 * Todo lo demás —rotación de hosts, reconexión con espera creciente, pausa al
 * ocultar la pestaña— es idéntico, así que vive una sola vez más abajo.
 */
type Protocolo = {
  /** Hosts a probar, en orden. El del puerto estándar primero. */
  endpoints: string[];
  /** URL final a partir del host y los pares. */
  url(base: string, pares: string[]): string;
  /** Mensaje a enviar nada más abrir, si el protocolo suscribe por mensaje. */
  suscripcion?(pares: string[]): string;
  /** Latido para que el servidor no cierre la conexión por inactividad. */
  latido?: { cadaMs: number; mensaje(): string };
  parsear(carga: unknown, porPar: Map<string, string>): Trade | null;
  /** Forma canónica del par, para que el mapa y el mensaje coincidan. */
  clavePar(par: string): string;
};

/**
 * Solo el mercado principal se abre desde el navegador. El secundario va por
 * servidor (ver la nota de arriba), así que aquí no aparece.
 */
const PROTOCOLOS: Record<"binance", Protocolo> = {
  binance: {
    endpoints: process.env.NEXT_PUBLIC_TRADES_WS
      ? process.env.NEXT_PUBLIC_TRADES_WS.split(",").map((x) => x.trim()).filter(Boolean)
      : [
          // El primero va por el puerto 443, el mismo que cualquier página web,
          // así que atraviesa casi cualquier red. El de puerto no estándar va el
          // último, que es el que más veces se encuentra cerrado.
          "wss://data-stream.binance.vision/stream?streams=",
          "wss://stream.binance.com:443/stream?streams=",
          "wss://stream.binance.com:9443/stream?streams=",
        ],
    url: (base, pares) => base + pares.map((p) => `${p}@aggTrade`).join("/"),
    parsear: parsearMensaje,
    clavePar: (par) => par.toLowerCase(),
  },
};

/**
 * Lo aprendido sobre esta red, fuera del componente a propósito.
 *
 * Que un host abra o no depende de la red del visitante, no de qué monedas haya
 * elegido. Sin esta memoria, cada vez que alguien toca una moneda se vuelve a
 * probar el host muerto desde cero: otro error en consola y varios segundos de
 * espera antes de volver al respaldo.
 */
const hostAprendido: Partial<Record<FuenteDeMercado, number>> = {};

export type ParDeMoneda = { coinId: string; par: string; fuente: FuenteDeMercado };

/**
 * Conexión directa al mercado principal.
 *
 * Si no hay ninguna moneda suya elegida, queda inactiva y no abre nada.
 */
function useConexionDirecta(pares: ParDeMoneda[]) {
  const fuente: FuenteDeMercado = "binance";
  const [trades, setTrades] = useState<Trade[]>([]);
  const [estado, setEstado] = useState<EstadoInterno>("inactivo");

  /**
   * Toda la configuración del efecto viaja en una sola cadena.
   *
   * Es lo que evita el problema que tenía la primera versión: si el efecto
   * depende de un array o de una función memorizada, cualquier render puede
   * volver a dispararlo, y cada disparo dejaba atrás un socket que seguía vivo
   * reconectándose por su cuenta.
   */
  const clave = pares
    .filter((p) => p.fuente === fuente)
    .map((p) => `${p.par}|${p.coinId}`)
    .sort()
    .join(",");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (clave === "") {
      setTrades([]);
      setEstado("inactivo");
      return;
    }

    const protocolo = PROTOCOLOS[fuente];
    const entradas = clave.split(",").map((trozo) => {
      const [par, coinId] = trozo.split("|");
      return { par: protocolo.clavePar(par), coinId };
    });
    const lista = entradas.map((e) => e.par);
    const porPar = new Map(entradas.map((e) => [e.par, e.coinId]));

    /**
     * Bandera local al efecto, no una ref compartida.
     *
     * Con una ref, la limpieza de un efecto la ponía a `true` y el siguiente la
     * devolvía a `false` antes de que llegara el evento `close` del socket
     * anterior —cerrar es asíncrono—, así que el socket viejo se creía vivo y
     * programaba su propia reconexión. Cada cambio de selección duplicaba las
     * conexiones abiertas.
     */
    let vivo = true;
    let socket: WebSocket | null = null;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    let apertura: ReturnType<typeof setTimeout> | null = null;
    let pulso: ReturnType<typeof setInterval> | null = null;
    let indiceHost = hostAprendido[fuente] ?? 0;
    let reintentos = 0;

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

    const limpiar = () => {
      if (temporizador) { clearTimeout(temporizador); temporizador = null; }
      if (apertura) { clearTimeout(apertura); apertura = null; }
      if (pulso) { clearInterval(pulso); pulso = null; }
    };

    const detener = () => {
      limpiar();
      cerrar(socket);
      socket = null;
    };

    const siguienteHost = () => {
      if (!vivo) return;

      indiceHost += 1;
      if (indiceHost >= protocolo.endpoints.length) {
        // Este mercado no abre por ningún host. Quien decide qué hacer con eso
        // es el hook de arriba, que ve el estado de los dos.
        setEstado("agotado");
        return;
      }

      setEstado("reconectando");
      temporizador = setTimeout(abrir, ESPERA_ENTRE_HOSTS_MS);
    };

    function abrir() {
      if (!vivo) return;

      let s: WebSocket;
      try {
        s = new WebSocket(protocolo.url(protocolo.endpoints[indiceHost], lista));
      } catch {
        siguienteHost();
        return;
      }

      socket = s;
      let abierto = false;

      apertura = setTimeout(() => {
        if (!vivo || abierto || socket !== s) return;
        // Se quedó en «conectando» sin abrir ni fallar: puerto filtrado.
        cerrar(s);
        if (socket === s) socket = null;
        siguienteHost();
      }, TIEMPO_APERTURA_MS);

      s.onopen = () => {
        if (!vivo || socket !== s) return;
        abierto = true;
        reintentos = 0;
        hostAprendido[fuente] = indiceHost;
        if (apertura) { clearTimeout(apertura); apertura = null; }

        if (protocolo.suscripcion) {
          try {
            s.send(protocolo.suscripcion(lista));
          } catch {
            // Si no se puede suscribir, el cierre llegará solo.
          }
        }

        if (protocolo.latido) {
          const { cadaMs, mensaje } = protocolo.latido;
          pulso = setInterval(() => {
            if (s.readyState !== WebSocket.OPEN) return;
            try {
              s.send(mensaje());
            } catch {
              // Igual: el cierre se gestiona en onclose.
            }
          }, cadaMs);
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

        const trade = protocolo.parsear(carga, porPar);
        if (trade) setTrades((previas) => fusionar(previas, [trade]));
      };

      s.onerror = () => {
        // El cierre llega justo después; se gestiona ahí para no duplicar.
      };

      s.onclose = () => {
        // Un socket que ya no es el actual no decide nada: es el resto del
        // fallo original, y con esta comprobación no puede repetirse.
        if (!vivo || socket !== s) return;

        limpiar();
        socket = null;

        if (!abierto) {
          siguienteHost();
          return;
        }

        // Funcionaba y se ha caído: mismo host con espera creciente hasta 30 s.
        setEstado("reconectando");
        const espera = Math.min(30_000, 1000 * 2 ** Math.min(reintentos, 5));
        reintentos += 1;
        temporizador = setTimeout(abrir, espera);
      };
    }

    const arrancar = () => {
      detener();
      indiceHost = hostAprendido[fuente] ?? 0;
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
    arrancar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      detener();
    };
  }, [clave]);

  return { fuente, trades, estado, activo: clave !== "" };
}

/**
 * Respaldo por sondeo al servidor.
 *
 * Cubre **las monedas cuyo mercado no ha conseguido abrir**, no todas o ninguna.
 * La primera versión solo se encendía si fallaban los dos mercados, y eso dejaba
 * un agujero real: con DOGE y APU elegidas a la vez, si el mercado de APU no
 * abría pero el de DOGE sí, APU no recibía nada por ningún camino —ni en vivo ni
 * diferido— y su fila simplemente no aparecía.
 */
function useRespaldo(monedas: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [agotado, setAgotado] = useState(false);

  /**
   * Lo acumulado solo se tira cuando cambian las monedas, no cuando se apaga el
   * sondeo.
   *
   * Si se vaciara al apagarlo, la cinta parpadearía en cada clic: tocar una
   * moneda reinicia las conexiones, el estado deja de ser «agotado» durante unos
   * segundos, y con él se iría todo lo que ya se había traído por servidor.
   */
  useEffect(() => {
    setTrades([]);
    setAgotado(false);
  }, [monedas]);

  useEffect(() => {
    if (monedas === "") return;

    let vivo = true;
    let fallos = 0;

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
          fallos += 1;
          if (fallos >= FALLOS_ANTES_DE_RENDIRSE) setAgotado(true);
          return;
        }

        fallos = 0;
        setAgotado(false);
        setTrades((previas) => fusionar(previas, lote));
      } catch {
        if (!vivo) return;
        fallos += 1;
        if (fallos >= FALLOS_ANTES_DE_RENDIRSE) setAgotado(true);
      }
    };

    void sondear();
    const intervalo = setInterval(() => void sondear(), SONDEO_MS);

    return () => {
      vivo = false;
      clearInterval(intervalo);
    };
  }, [monedas]);

  return { trades, agotado };
}

export function useLiveTrades(pares: ParDeMoneda[]) {
  const directa = useConexionDirecta(pares);

  /**
   * Monedas que llegan por nuestro servidor.
   *
   * Dos grupos, por motivos distintos: las del mercado secundario **siempre**
   * —su conexión directa falla en demasiadas redes y son las menos líquidas, así
   * que no se pierde nada— y las del principal solo si su conexión se ha quedado
   * sin hosts.
   */
  const monedasPorServidor = useMemo(() => {
    const ids = pares
      .filter((p) => p.fuente !== "binance" || directa.estado === "agotado")
      .map((p) => p.coinId);
    return [...new Set(ids)].sort().join(",");
  }, [pares, directa.estado]);

  const respaldo = useRespaldo(monedasPorServidor);

  const trades = useMemo(
    () => fusionar(directa.trades, respaldo.trades),
    [directa.trades, respaldo.trades],
  );

  const estado: EstadoConexion = useMemo(() => {
    if (pares.length === 0) return "conectando";

    const directoVivo = directa.activo && directa.estado === "en-vivo";
    const hayPorServidor = monedasPorServidor !== "";

    if (!hayPorServidor) {
      if (directoVivo) return "en-vivo";
      if (directa.estado === "reconectando") return "reconectando";
      return "conectando";
    }

    // Nada llega y el servidor tampoco trae nada: no hay más que contar.
    if (respaldo.agotado && !directoVivo) return "error";

    /**
     * Basta con que **una** moneda venga por el servidor para decir «diferido».
     *
     * Decir «en vivo» porque las otras sí abren sería engañoso justo para la
     * moneda que el visitante está mirando.
     */
    return "diferido";
  }, [pares.length, directa.activo, directa.estado, monedasPorServidor, respaldo.agotado]);

  return { trades, estado };
}
