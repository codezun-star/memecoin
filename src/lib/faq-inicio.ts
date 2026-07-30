import type { FaqItem } from "@/lib/markdown";

/**
 * Preguntas de entrada al tema.
 *
 * Son las que trae quien todavía no sabe qué es esto, que es un perfil de
 * búsqueda distinto del de quien ya busca una moneda concreta. Esas otras
 * preguntas viven en la ficha de cada moneda.
 *
 * Viven en su propio módulo, y no dentro de la portada, porque las consumen
 * tres sitios: el bloque visible, el `FAQPage` de la portada y `/llms.txt`.
 * Un route handler que importara la página arrastraría con ella medio árbol
 * de componentes; así solo se lleva el texto.
 */
export const FAQ_INICIO: FaqItem[] = [
  {
    pregunta: "¿Qué es una meme coin?",
    respuesta:
      "Una criptomoneda cuyo valor no procede de un producto, unos ingresos ni una tecnología propia, sino de la comunidad y la cultura que se forma a su alrededor. Dogecoin fue la primera, en 2013, y hoy hay miles. Lo que las distingue no es la tecnología —muchas son tokens estándar sin nada especial— sino que su precio depende casi por completo de la atención que consigan.",
  },
  {
    pregunta: "¿Cuáles son las meme coins más importantes?",
    respuesta:
      "Por capitalización, las referencias históricas son Dogecoin y Shiba Inu. A partir de 2023 se sumaron Pepe en Ethereum, y Bonk, dogwifhat y otras en Solana. En esta página verás las que seguimos, ordenadas por capitalización y con los datos actualizándose solos.",
  },
  {
    pregunta: "¿Cómo se leen los datos de una meme coin?",
    respuesta:
      "El precio unitario por sí solo no dice nada, porque depende de cuántas unidades existan: una moneda a 0,00002 $ con billones de unidades puede valer más en total que otra a 5 $. Lo comparable es la capitalización, que es precio por suministro circulante. El volumen de 24 horas indica cuánto se ha movido de verdad; un precio que aguanta sin volumen se sostiene sobre muy pocas operaciones.",
  },
  {
    pregunta: "¿De dónde salen los precios de esta página?",
    respuesta:
      "De datos públicos de mercado que se actualizan solos cada veinte segundos, sin necesidad de recargar. En la página de operaciones puedes ver además las compras y ventas individuales según se ejecutan.",
  },
  {
    pregunta: "¿Hace falta registrarse para consultar los precios?",
    respuesta:
      "No. Todos los precios, gráficos y datos de mercado son públicos y no requieren cuenta. Solo hace falta registrarse para participar en el debate: escribir comentarios y dar like a los de otras personas.",
  },
  {
    pregunta: "¿Es buena idea invertir en meme coins?",
    respuesta:
      "Aquí no damos recomendaciones de inversión ni las daremos. Lo que sí conviene tener claro es el perfil de riesgo: son de los activos más volátiles que existen, prácticamente todas han caído más de un 80 % desde sus máximos en algún momento, y la mayoría de las que se lanzan desaparecen. La información de este sitio está para ayudarte a decidir por tu cuenta, no para decidir por ti.",
  },
];
