---
title: "Cómo detectar un rug pull antes de que te pase"
description: "Qué es exactamente un rug pull, los tres tipos que existen, las señales concretas que puedes comprobar tú mismo en cinco minutos y las excusas que suelen acompañarlos."
date: 2026-05-30
keywords: [qué es un rug pull, estafa cripto, detectar estafa meme coin, liquidez bloqueada]
faq:
  - pregunta: "¿Qué es un rug pull?"
    respuesta: "Una estafa en la que quienes crearon un token retiran de golpe la liquidez del mercado o venden su posición masiva, dejando el precio prácticamente en cero y a los compradores sin posibilidad de vender."
  - pregunta: "¿Cómo sé si la liquidez está bloqueada?"
    respuesta: "Existen servicios de bloqueo que emiten un comprobante público con la fecha de desbloqueo. Si un proyecto no puede enseñarte ese comprobante, asume que la liquidez se puede retirar en cualquier momento."
  - pregunta: "¿Qué es un honeypot?"
    respuesta: "Un contrato manipulado para que puedas comprar pero no vender. El gráfico sube porque solo hay compras, y cuando intentas salir la transacción falla."
  - pregunta: "¿Un contrato renunciado garantiza que sea seguro?"
    respuesta: "No. Elimina el riesgo de que cambien las reglas del contrato, pero no protege contra la concentración de tenedores ni contra la retirada de liquidez si esta no está bloqueada."
---

Un rug pull es el momento en el que quienes crearon un token se llevan el dinero y
dejan a los compradores con algo que no vale nada y no se puede vender. La
traducción literal —tirar de la alfombra— describe bien la sensación.

No es un riesgo teórico ni raro. En las redes donde crear un token cuesta minutos
y unos céntimos, es una de las causas más frecuentes de pérdida total. Y lo
frustrante es que la mayoría eran detectables antes.

## Los tres tipos

### 1. Retirada de liquidez

El más común. Para que un token se pueda comprar y vender en un intercambio
descentralizado, alguien tiene que aportar un fondo con las dos monedas del par:
el token nuevo y una moneda de referencia.

Quien aporta ese fondo puede retirarlo. Si lo hace, desaparece la contraparte: ya
no hay nadie contra quien vender. El precio se desploma a cero en una sola
transacción.

**Cómo se previene:** bloqueando la liquidez mediante un servicio que la retiene
durante un plazo, o destruyendo los comprobantes del fondo. En ambos casos queda un
registro público verificable.

### 2. Venta masiva del creador

Aquí no hay truco técnico: simplemente quien lanzó el token se quedó con una parte
enorme del suministro, esperó a que hubiera compradores y vendió todo de golpe.

Es legal en muchos sitios y difícil de distinguir de una toma de beneficios
legítima. La única defensa es mirar la distribución **antes** de comprar.

### 3. Honeypot

El más retorcido. El contrato está manipulado para que las compras funcionen y las
ventas fallen. Puede estar hecho con una lista blanca, con un impuesto de venta del
100 % o con una condición escondida.

El gráfico se ve precioso —solo sube, porque nadie puede vender— hasta que intentas
salir y la transacción se rechaza una y otra vez.

## Las señales que puedes comprobar en cinco minutos

Ninguna es concluyente por sí sola. Tres o más juntas deberían bastar para
alejarse.

### Distribución concentrada

Mira las primeras carteras. Si diez direcciones controlan más de la mitad del
suministro y no son contratos identificables como fondos de liquidez o de
bloqueo, el precio depende de que ninguna de ellas venda.

Es la señal más importante y la más ignorada. La desarrollamos en
[ballenas y concentración](/blog/ballenas-y-concentracion-de-holders).

### Liquidez sin bloquear o ridícula

Dos preguntas: ¿cuánta liquidez hay y está bloqueada?

Un token con una capitalización nominal de varios millones y un fondo de liquidez
de unos pocos miles es una ficción: ese precio no soporta ni una venta mediana.

### Contrato sin renunciar

Si quien lo creó conserva los permisos de administración, puede acuñar tokens
nuevos, congelar carteras o cambiar los impuestos. No siempre significa mala fe
—algunos proyectos legítimos los conservan para poder corregir errores— pero es un
poder que tienes que confiarle a un desconocido.

### Impuestos de compraventa altos o modificables

Un impuesto del 10 % en cada operación se come el capital. Uno que se pueda
cambiar después es directamente un honeypot esperando a activarse.

### Equipo anónimo con promesas concretas

El anonimato por sí solo no es señal de estafa: [Pepe](/blog/que-es-pepe-coin) y
[Shiba Inu](/blog/historia-de-shiba-inu) nacieron de creadores anónimos.

El problema es el anonimato **acompañado de promesas verificables**: alianzas con
empresas conocidas, aplicaciones que van a salir, acuerdos firmados. Si nadie da la
cara, nadie responde cuando esas promesas no se cumplen.

### Redes sociales sin conversación

Cien mil seguidores y tres comentarios por publicación. Un canal de comunidad con
mucha gente donde solo hablan cuentas de administración. La actividad se puede
comprar; la conversación real, mucho menos.

### Urgencia artificial

"Últimas horas." "Se acaba la preventa." "Entra antes del anuncio grande." La prisa
es la herramienta principal de cualquier estafa, porque impide precisamente lo que
estás haciendo ahora: comprobar.

## La tabla rápida

| Señal | Riesgo | Cómo comprobarlo |
| --- | --- | --- |
| 10 carteras con más del 50 % | Muy alto | Explorador de la cadena |
| Liquidez sin bloquear | Muy alto | Comprobante del servicio de bloqueo |
| Liquidez menor al 5 % de la capitalización | Alto | Comparar ambas cifras |
| Contrato sin renunciar | Medio-alto | Explorador de la cadena |
| Impuestos superiores al 5 % | Medio | Simulador de compraventa |
| Comunidad sin conversación real | Medio | Leer los canales |
| Urgencia y cuentas atrás | Medio | Sentido común |

## Lo que pasa después

Hay un guion que se repite tras cada rug pull, y reconocerlo ayuda a no caer en la
segunda parte de la estafa:

1. **"Nos han hackeado."** Casi siempre es falso. Un hackeo real deja rastro
   verificable en la cadena.
2. **"Vamos a relanzar."** El relanzamiento consiste en pedirte más dinero para
   recuperar el que ya perdiste.
3. **Aparece alguien que "recupera fondos"** por una comisión por adelantado. Es
   una segunda estafa dirigida específicamente a las víctimas de la primera.

No hay ningún mecanismo para deshacer una transacción en una cadena pública.
Cualquiera que te prometa recuperar el dinero está mintiendo.

## La regla que resume todo

Si no puedes explicar en una frase quién tiene el token, dónde está la liquidez y
qué impide que alguien la retire, no tienes información suficiente para comprar.

Las monedas grandes y con años de historia como [Dogecoin](/coin/dogecoin) o
[Pepe](/coin/pepe) tienen estos riesgos estructurales resueltos hace tiempo. No las
hace buenas inversiones —siguen siendo activos muy volátiles— pero al menos el
riesgo que asumes es el del mercado, no el de que alguien apague la luz.

## Para seguir leyendo

- [Cómo investigar una meme coin antes de comprar](/blog/como-investigar-antes-de-comprar)
- [Liquidez y deslizamiento](/blog/liquidez-y-deslizamiento)
- [Errores de principiante](/blog/errores-de-principiante)
