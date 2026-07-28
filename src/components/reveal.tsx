"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Aparición al entrar en pantalla.
 *
 * Envuelve contenido que puede seguir siendo un componente de servidor: solo el
 * envoltorio se hidrata, no lo de dentro.
 *
 * Tres decisiones que importan más de lo que parece:
 *
 * 1. **El HTML del servidor sale visible.** El estado inicial no lleva ninguna
 *    clase que esconda nada. Un rastreador que no ejecute JavaScript ve el
 *    contenido tal cual, y Google no puede interpretarlo como texto oculto.
 *
 * 2. **Se oculta antes de pintar, no después.** Con `useLayoutEffect` el
 *    navegador aplica el estado inicial de la animación en el mismo fotograma,
 *    así que no hay parpadeo. Y solo se oculta lo que está por debajo del
 *    primer pantallazo: lo que ya se ve, no se toca.
 *
 * 3. **Hay red de seguridad.** Si nadie hace scroll —un rastreador, una pestaña
 *    en segundo plano, un navegador sin IntersectionObserver— todo se muestra
 *    igualmente pasados dos segundos. Nunca se queda contenido invisible.
 */

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Milisegundos tras los que el contenido se muestra pase lo que pase. */
const RED_DE_SEGURIDAD_MS = 2000;

const VARIANTES = {
  up: "translate-y-6",
  down: "-translate-y-4",
  left: "translate-x-6",
  right: "-translate-x-6",
  scale: "scale-[0.97]",
  fade: "",
} as const;

export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  as: Etiqueta = "div",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof VARIANTES;
  /** Retardo en milisegundos, para escalonar elementos de una rejilla. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  // Ref por callback: acepta cualquier elemento HTML, así el componente puede
  // renderizarse como div, section, li o article sin pelearse con los tipos.
  const asignarRef = (nodo: HTMLElement | null) => {
    ref.current = nodo;
  };
  // Arranca en `true`: el marcado del servidor no esconde nada.
  const [visible, setVisible] = useState(true);
  const [animando, setAnimando] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    // Lo que ya está en pantalla no se anima: animar el primer pantallazo
    // retrasa la sensación de carga en vez de mejorarla.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    setVisible(false);
    setAnimando(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    observer.observe(el);

    const red = setTimeout(() => {
      setVisible(true);
      observer.disconnect();
    }, RED_DE_SEGURIDAD_MS);

    return () => {
      observer.disconnect();
      clearTimeout(red);
    };
  }, []);

  return (
    <Etiqueta
      ref={asignarRef}
      style={animando && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        // Solo transform y opacity: son las dos propiedades que el compositor
        // anima sin recalcular diseño (DESIGN.md §7).
        animando && "transition-[opacity,transform] duration-[600ms] ease-out will-change-[opacity,transform]",
        !visible && "opacity-0",
        !visible && VARIANTES[variant],
        className,
      )}
    >
      {children}
    </Etiqueta>
  );
}

/**
 * Escalona una lista de elementos.
 *
 * El retardo se corta a los seis primeros: más allá, el último tardaría tanto en
 * aparecer que se percibe como lentitud, no como elegancia.
 */
export function RevealStagger({
  children,
  className,
  step = 70,
  variant = "up",
  as = "div",
}: {
  children: React.ReactNode[];
  className?: string;
  step?: number;
  variant?: keyof typeof VARIANTES;
  as?: "div" | "section";
}) {
  const Etiqueta = as;
  return (
    <Etiqueta className={className}>
      {children.map((hijo, i) => (
        <Reveal key={i} variant={variant} delay={Math.min(i, 5) * step}>
          {hijo}
        </Reveal>
      ))}
    </Etiqueta>
  );
}
