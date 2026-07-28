---
title: "Liquidez y deslizamiento: por qué a veces no puedes vender al precio que ves"
description: "Qué es la liquidez de una meme coin, cómo funciona el deslizamiento, por qué una posición grande no se puede vender al precio de pantalla y cómo medirlo antes de entrar."
date: 2026-06-06
keywords: [liquidez cripto, deslizamiento slippage, profundidad de mercado, vender meme coin]
faq:
  - pregunta: "¿Qué es la liquidez de una criptomoneda?"
    respuesta: "La cantidad de dinero disponible para comprar y vender ese activo sin que el precio se mueva demasiado. Determina si puedes entrar y salir de una posición al precio que ves en pantalla."
  - pregunta: "¿Qué es el deslizamiento o slippage?"
    respuesta: "La diferencia entre el precio que esperabas y el que acabas pagando. Ocurre porque tu propia orden consume las mejores ofertas disponibles y avanza hacia las peores."
  - pregunta: "¿Cómo sé si una moneda tiene liquidez suficiente?"
    respuesta: "Compara el volumen diario con la capitalización. Por debajo del 1 % el mercado está dormido. Y en intercambios descentralizados, mira el tamaño del fondo de liquidez frente a la posición que quieres tomar."
  - pregunta: "¿Por qué el precio se mueve tanto cuando compro poco?"
    respuesta: "Porque la liquidez es fina. Si hay poco dinero al otro lado, una orden modesta consume varios niveles de precio de golpe. Es lo que hace que las monedas pequeñas tengan movimientos aparentemente absurdos."
---

Hay una diferencia enorme entre *tener* algo que vale mil euros y *poder
convertirlo* en mil euros. En las meme coins esa diferencia se llama liquidez, y
es probablemente el concepto que más gente ignora hasta que le hace daño.

## El precio que ves es solo el último

Cuando miras el precio de una moneda, estás viendo **el precio de la última
operación que se cruzó**. Una sola. Puede haber sido de tres euros.

Eso no significa que puedas vender mil euros a ese precio. Para eso hace falta que
haya alguien dispuesto a comprarte mil euros a ese precio, y esa es una pregunta
completamente distinta.

## Cómo funciona en la práctica

Imagina un mercado donde las órdenes de compra pendientes son:

| Precio | Cantidad disponible |
| --- | --- |
| 1,00 € | 100 € |
| 0,95 € | 200 € |
| 0,80 € | 500 € |
| 0,60 € | 2000 € |

El precio de pantalla es 1,00 €. Si vendes 100 €, lo haces a ese precio.

Pero si vendes 1000 €, tu orden va consumiendo niveles: los primeros 100 a 1,00,
los siguientes 200 a 0,95, los siguientes 500 a 0,80 y los últimos 200 a 0,60. Tu
precio medio real acaba siendo bastante peor que 1,00, y **has dejado el precio de
pantalla en 0,60**.

Esa diferencia entre lo que esperabas y lo que obtuviste es el **deslizamiento**.

## Por qué las monedas pequeñas se mueven tanto

Ahora se entiende algo que sorprende a mucha gente: por qué una moneda pequeña
sube un 40 % con una compra que en términos absolutos es modesta.

No es que haya entrado una fortuna. Es que había muy poco al otro lado.

Y funciona exactamente igual al bajar. La misma liquidez fina que hace que suba
rápido hace que se desplome cuando alguien de tamaño medio decide salir. **La
volatilidad de una meme coin pequeña es en gran medida un síntoma de su falta de
liquidez**, no de un cambio en su valor.

## Cómo medirla antes de entrar

### En intercambios centralizados: volumen frente a capitalización

Es la comprobación más rápida.

| Volumen 24 h / capitalización | Lectura |
| --- | --- |
| Menos del 1 % | Mercado dormido. Salir de una posición mediana moverá el precio |
| Del 2 % al 20 % | Normal |
| Más del 30 % | Actividad excepcional, algo está pasando |

Las dos cifras están en la ficha de cada moneda: puedes verlas para
[Dogecoin](/coin/dogecoin), [Shiba Inu](/coin/shiba-inu), [Pepe](/coin/pepe) y el
resto.

### En intercambios descentralizados: el tamaño del fondo

Aquí la pregunta es distinta y más concreta: **¿cuánto dinero hay en el fondo de
liquidez?**

Una regla práctica: si tu operación supera el 1 % del fondo, vas a notar el
deslizamiento. Si supera el 5 %, lo vas a notar mucho.

Un token con una capitalización nominal de cinco millones y un fondo de liquidez
de veinte mil euros no vale cinco millones en ningún sentido práctico. Nadie puede
sacar de ahí más que una fracción minúscula.

## La trampa de la capitalización inflada

Esto lleva a un fenómeno que conviene entender bien.

La capitalización se calcula multiplicando el precio por el suministro. Pero si el
precio lo fijó una compra de doscientos euros en un mercado sin profundidad,
multiplicar ese precio por un suministro gigantesco produce una cifra que no
representa ningún dinero real.

Es perfectamente posible crear un token con una "capitalización" de cien millones
poniendo unos pocos miles de euros. Los cien millones no existen: son el resultado
aritmético de un precio ficticio.

Por eso, en monedas pequeñas, **la liquidez es un dato más honesto que la
capitalización**.

## Qué hacer con esta información

**Comprueba la liquidez antes de entrar, no antes de salir.** El momento de
descubrir que no hay mercado no puede ser cuando quieres vender.

**Dimensiona la posición según la liquidez, no según tus ganas.** Si tu posición
representa una parte apreciable del fondo, vas a ser tú quien mueva el precio en
tu contra al salir.

**Configura la tolerancia al deslizamiento con criterio.** En intercambios
descentralizados puedes fijar cuánto deslizamiento aceptas. Ponerlo muy alto para
que la operación pase es cómodo y peligroso: es exactamente lo que explotan
quienes se dedican a colocarse delante de las órdenes ajenas.

**Desconfía de la liquidez que aparece de golpe.** Un fondo que se llena en unas
horas puede vaciarse igual de rápido si no está bloqueado. Es el mecanismo del
[rug pull](/blog/como-detectar-un-rug-pull).

## La frase que resume esto

Poder comprar no es poder vender. Son dos mercados distintos y solo uno de ellos
te importa el día que quieras salir.

## Para seguir leyendo

- [Cómo leer el gráfico de una meme coin](/blog/como-leer-el-grafico-de-una-meme-coin)
- [Cómo detectar un rug pull](/blog/como-detectar-un-rug-pull)
- [Capitalización de mercado explicada](/blog/capitalizacion-de-mercado-explicada)
