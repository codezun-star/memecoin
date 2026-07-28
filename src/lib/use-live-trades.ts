"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fusionar,
  parsearMensaje,
  parsearMensajeGate,
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
 * Hay **dos mercados**, no uno. El principal solo lista las meme coins grandes:
 * siete de las veinte que seguimos no cotizan ahí en contado, así que salen del
 * secundario. Cada uno habla su propio protocolo y **tiene su propia conexión
 * con su propio ciclo de vida**: tocar una moneda del secundario no puede
 * cortar el flujo del principal, que es lo que pasaba cuando ambos colgaban del
 * mismo efecto.
 *
 * Y hay tres niveles de respaldo, porque abrir la conexión desde el navegador
 * tiene un coste: hay redes que la bloquean —oficinas, algunos operadores
 * móviles, no pocos antivirus—:
 *
 *  1. Se prueban varios hosts por mercado, empezando por el del puerto estándar.
 *  2. Si **ningún** mercado abre, se pasa a sondear nuestro propio servidor, que
 *     sí puede traer las últimas operaciones por una vía normal. Se pierde el
 *     directo exacto, pero los datos siguen siendo reales, y la página lo dice.
 *  3. Si tampoco eso funciona, se avisa sin dejar la pantalla en blanco.
 *
 * A cambio hay que ser honesto sobre qué se está viendo: **las operaciones de
 * un solo mercado por moneda**, no de todo el sector. Se etiqueta como tal.
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

const PROTOCOLOS: Record<FuenteDeMercado, Protocolo> = {
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
  gate: {
    endpoints: process.env.NEXT_PUBLIC_TRADES_WS_GATE
      ? process.env.NEXT_PUBLIC_TRADES_WS_GATE.split(",").map((x) => x.trim()).filter(Boolean)
      : ["wss://api.gateio.ws/ws/v4/"],
    // Aquí los pares no van en la URL: se piden después, por mensaje.
    url: (base) => base,
    suscripcion: (pares) =>
      JSON.stringify({
        time: Math.floor(Date.now() / 1000),
        channel: "spot.trades",
        event: "subscribe",
        payload: pares,
      }),
    // Sin latido, el servidor corta la conexión cuando el mercado está tranquilo
    // y la cinta se pasa el rato reconectando.
    latido: {
      cadaMs: 20_000,
      mensaje: () => JSON.stringify({ time: Math.floor(Date.now() / 1000), channel: "spot.ping" }),
    },
    parsear: parsearMensajeGate,
    clavePar: (par) => par.toUpperCase(),
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
 * Una conexión a un mercado.
 *
 * Se llama una vez por mercado, siempre en el mismo orden, así que las reglas de
 * los hooks se cumplen aunque un mercado no tenga ninguna moneda elegida: en ese
 * caso queda inactivo y no abre nada.
 */
function useConexionMercado(fuente: FuenteDeMercado, pares: ParDeMoneda[]) {
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
  }, [fuente, clave]);

  return { trades, estado, activo: clave !== "" };
}

/**
 * Respaldo por sondeo al servidor.
 *
 * Solo se enciende cuando **ningún** mercado ha conseguido abrir, que es lo que
 * pasa cuando la red del visitante bloquea este tipo de conexión.
 */
function useRespaldo(monedas: string, encendido: boolean) {
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
    if (!encendido || monedas === "") return;

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
  }, [monedas, encendido]);

  return { trades, agotado };
}

export function useLiveTrades(pares: ParDeMoneda[]) {
  // Un hook por mercado, siempre los mismos y en el mismo orden.
  const binance = useConexionMercado("binance", pares);
  const gate = useConexionMercado("gate", pares);

  const conexiones = useMemo(() => [binance, gate], [binance, gate]);
  const activas = conexiones.filter((c) => c.activo);

  // Respaldo solo si todas las conexiones activas se han quedado sin hosts.
  const todasAgotadas = activas.length > 0 && activas.every((c) => c.estado === "agotado");
  const monedas = useMemo(
    () => [...new Set(pares.map((p) => p.coinId))].sort().join(","),
    [pares],
  );
  const respaldo = useRespaldo(monedas, todasAgotadas);

  const trades = useMemo(
    () => fusionar(fusionar(binance.trades, gate.trades), respaldo.trades),
    [binance.trades, gate.trades, respaldo.trades],
  );

  const estado: EstadoConexion = useMemo(() => {
    if (activas.length === 0) return "conectando";
    if (todasAgotadas) return respaldo.agotado ? "error" : "diferido";

    const valores = activas.map((c) => c.estado);
    // Con datos llegando de cualquier mercado, la cinta está viva: da igual que
    // el otro siga negociando su conexión.
    if (valores.includes("en-vivo")) return "en-vivo";
    if (valores.includes("conectando")) return "conectando";
    return "reconectando";
  }, [activas, todasAgotadas, respaldo.agotado]);

  return { trades, estado };
}
