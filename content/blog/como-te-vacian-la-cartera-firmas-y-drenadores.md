---
title: "Cómo te vacían la cartera: firmas y drenadores"
description: "Qué es un drenador de carteras, cómo funciona la firma maliciosa que lo autoriza todo y las cinco comprobaciones que hay que hacer antes de aprobar nada."
date: 2026-07-28
keywords: [me han vaciado la cartera cripto, qué es un drainer de carteras, aprobaciones de token cripto, estafa de firma en metamask]
faq:
  - pregunta: "¿Qué es un drenador de carteras?"
    respuesta: "Un programa preparado para vaciar una cartera en cuanto la víctima firma un permiso. No rompe nada ni adivina claves: se limita a ejecutar una autorización que le concediste tú al firmar."
  - pregunta: "¿Cómo me han vaciado la cartera si no di mi frase semilla?"
    respuesta: "Casi siempre por una firma. Al conectar la cartera a una web y aprobar una operación que parecía inocua, concediste permiso para mover tus tokens, y ese permiso sigue activo hasta que lo revocas."
  - pregunta: "¿Se puede recuperar el dinero robado en cripto?"
    respuesta: "Prácticamente nunca. Las transacciones de una cadena pública no se deshacen. Quien te ofrezca recuperarlo a cambio de un pago por adelantado está montando una segunda estafa sobre la primera."
  - pregunta: "¿Qué hago si creo que mi cartera está comprometida?"
    respuesta: "Mueve de inmediato lo que quede a una cartera nueva creada en un dispositivo limpio, empezando por lo de más valor, y da esa cartera por perdida. Revocar permisos después no basta si la clave está expuesta."
---

Los rug pull se llevan la atención, pero hay una forma de perder todo mucho más
silenciosa y que no depende de qué moneda compraste: **firmar algo sin entender qué
firmabas**. No hace falta que el proyecto sea una estafa. Basta con una web.

Y lo relevante es que aquí no te roban la clave. Te piden permiso, se lo das y lo
usan.

## Qué es un drenador

Un drenador de carteras es un programa que se conecta a tu cartera a través de una
web y espera a que apruebes una operación. En cuanto lo haces, mueve todo lo que
ese permiso le deja mover: normalmente los tokens de más valor, y en segundos.

No adivina contraseñas ni rompe cifrado. **Ejecuta una autorización legítima**, que
es exactamente lo que la hace tan difícil de detener: para la cadena, esa
transacción es tan válida como cualquier otra tuya.

Se venden como servicio, con panel de control y comisión sobre lo robado. Por eso
las campañas son constantes y están bien hechas.

## Las firmas peligrosas, una a una

No todas las firmas son iguales. Estas son las que hay que mirar dos veces.

### Aprobación de gasto ilimitada

Al usar un mercado descentralizado, autorizas a un contrato a mover un token tuyo.
La cantidad puede ser la justa o **ilimitada**, y por comodidad casi todo pide
ilimitada.

El permiso no caduca. Meses después, si ese contrato resulta malicioso o lo
comprometen, el permiso sigue vivo. La costumbre sana es limitar el importe cuando
la interfaz lo permita y revocar lo que ya no uses.

### Firmas fuera de la cadena

Hay firmas que no ejecutan nada en el momento y no cuestan comisión: solo autorizan
a un tercero a actuar después en tu nombre. Es la firma que más se usa en los
robos, precisamente porque **parece inofensiva**: no gasta gas y muchas carteras la
muestran como un texto ilegible.

Regla práctica: si te piden firmar algo que no entiendes y no cuesta comisión,
desconfía más, no menos.

### Transferencia disfrazada de reclamación

"Reclama tu airdrop", "verifica tu cartera", "desbloquea tus tokens". El botón
ejecuta una transferencia normal hacia la dirección del atacante. El nombre de la
página es lo único que cambia.

Ningún reparto legítimo necesita que apruebes permisos sobre tokens que ya tienes.
Lo tratamos también en [qué es un airdrop](/blog/que-es-un-airdrop).

## Por dónde llegan

**Anuncios en buscadores.** Se pagan anuncios con el nombre exacto de un servicio
conocido, apuntando a un dominio casi idéntico. Aparecen encima del resultado
real.

**Enlaces en respuestas de redes sociales.** Bajo cada anuncio importante se
responde en segundos con enlaces falsos desde cuentas que imitan a la oficial,
incluido el icono.

**Mensajes directos en Telegram, Discord y WhatsApp.** Alguien "del soporte" te
escribe primero. El soporte real nunca escribe primero.

**Tokens que aparecen solos en tu cartera.** Te envían un token cuyo nombre invita
a visitar una web para canjearlo. Interactuar con él es el anzuelo. Déjalo donde
está: tenerlo en la cartera no hace nada por sí solo.

**Grupos de compraventa entre particulares.** En los mercados donde la operación
entre personas es habitual —buena parte de Latinoamérica—, el fraude se disfraza de
comprador que envía un comprobante falso o revierte el pago después de recibir las
monedas. Solo se libera lo vendido con el dinero confirmado en la cuenta, nunca con
una captura.

## Las cinco comprobaciones antes de firmar

1. **Mira la URL entera, carácter a carácter.** Guarda en marcadores las webs que
   uses y entra siempre desde ahí.
2. **Lee qué operación es.** Si es una aprobación, ¿de qué token y por qué
   cantidad? Si es ilimitada y no sabes por qué, cancela.
3. **Comprueba el contrato que la pide.** Debería ser el de la aplicación que crees
   estar usando.
4. **Duda de lo gratis y urgente.** Toda campaña de este tipo combina un regalo con
   un plazo. Es la misma urgencia artificial de
   [los rug pull](/blog/como-detectar-un-rug-pull).
5. **Usa una cartera de usar y tirar** para cualquier web que pruebes por primera
   vez. Es la medida que más protege por menos esfuerzo, y está detallada en
   [cómo guardar meme coins](/blog/como-guardar-meme-coins-con-seguridad).

## Mantenimiento: revocar cada cierto tiempo

Las aprobaciones se acumulan sin que te enteres. Cada dos meses, revisa la lista de
permisos de tu cartera y **revoca todo lo que no uses activamente**. Cuesta una
comisión de red pequeña y cierra puertas que llevaban meses abiertas.

Hazlo especialmente después de participar en cualquier lanzamiento nuevo, que es
justo cuando más contratos desconocidos han tocado tus tokens.

## Si ya ha pasado

Actúa por este orden y sin perder tiempo en entender qué pasó:

1. **Crea una cartera nueva** en un dispositivo limpio, con una semilla nueva.
2. **Mueve lo que quede**, empezando por lo de más valor. Si hay tokens
   inmovilizados en alguna aplicación, sácalos también.
3. **Da la cartera antigua por perdida.** Si la clave está expuesta, revocar
   permisos no arregla nada.
4. **Revisa el dispositivo**, porque la vía pudo ser un programa instalado y no una
   web.
5. **No pagues a nadie que prometa recuperarlo.** Es una segunda estafa dirigida
   específicamente a las víctimas de la primera, y es tan sistemática como la
   original.

Guarda los identificadores de las transacciones y denuncia si en tu país procede.
La recuperación es improbable, pero el registro sirve para lo fiscal y para la
investigación.

## Lo que hay que retener

Tu cartera no se rompe: se autoriza. Cada firma es una decisión con consecuencias
permanentes, y la única defensa real es leer antes de aprobar y no tener en la
cartera conectada más de lo que estás dispuesto a perder esa semana.

## Para seguir leyendo

- [Cómo guardar meme coins de forma segura](/blog/como-guardar-meme-coins-con-seguridad)
- [Cómo detectar un rug pull](/blog/como-detectar-un-rug-pull)
- [Cómo investigar una meme coin antes de comprar](/blog/como-investigar-antes-de-comprar)
