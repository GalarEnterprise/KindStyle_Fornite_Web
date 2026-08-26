# Fortnite Store MVP

## SPECIFICATION — VERSIÓN CONSOLIDADA

---

# 0. OBJETIVO

Construir una tienda online especializada exclusivamente en productos de Fortnite.

La plataforma estará inspirada en las mejores características observadas en tiendas como LIMX y otras tiendas especializadas en gifting, pero tendrá una arquitectura propia, modular y preparada para evolucionar desde un MVP operado manualmente hasta un sistema de fulfillment automatizado.

La prioridad inicial NO será construir un checkout de pago tradicional.

El MVP inicial estará centrado en:

- Catálogo automático de la tienda de Fortnite.
- Skins y cosméticos.
- Packs y bundles.
- Gestos.
- Picos.
- Planeadores.
- Otros productos regalables.
- Productos de recarga.
- Battle Pass / Crew / otros servicios cuando exista un método de entrega apropiado.
- Carrito.
- Solicitudes de compra.
- Generación automática de solicitud.
- WhatsApp con mensaje preparado.
- Copiar solicitud.
- Registro del Fortnite ID del cliente.
- Gestión de bots/amigos.
- Gestión individual del estado de cada bot.
- Cronómetro individual por bot.
- Panel administrativo.
- Tracking para el cliente.
- Notificaciones.
- Arquitectura preparada para fulfillment automático futuro.

---

# 1. PRINCIPIO FUNDAMENTAL DEL MVP

La tienda NO funcionará inicialmente como un ecommerce tradicional.

No existirá:

```text
Producto
↓
Comprar
↓
Checkout
↓
Pago automático
```

El flujo principal será:

```text
Producto
↓
Agregar al carrito
↓
Solicitar productos
↓
Generar Request
↓
Generar mensaje
↓
Copiar solicitud
o
Abrir WhatsApp
↓
Vendedor
↓
Confirmación
↓
Pago directo
↓
Fulfillment
```

El sitio será inicialmente:

> Catálogo + carrito + sistema de solicitudes + gestión de preparación de cuenta + comunicación directa con vendedor.

---

# 2. OBJETIVO DE EXPERIENCIA DEL CLIENTE

El cliente siempre debe saber:

- Qué producto está viendo.
- Cuánto cuesta.
- Si es regalables.
- Qué necesita hacer antes de poder recibirlo.
- Qué bots están agregados.
- Cuánto tiempo lleva cada bot.
- Cuándo podrá recibir el regalo.
- Qué falta para completar la preparación.
- Cómo contactar al vendedor.
- Cómo consultar el estado de su solicitud.

Nunca debe existir una situación donde el cliente descubra las condiciones de entrega únicamente después de pagar.

---

# 3. FILOSOFÍA DE UX SOBRE LOS BOTS

Los bots deben comunicarse al usuario **antes de que compre**, pero sin convertirlos en una barrera intrusiva.

El sistema debe educar al cliente progresivamente.

El usuario puede:

1. Navegar la tienda.
2. Ver productos.
3. Agregar productos al carrito.
4. Preparar sus bots.
5. Esperar a tener bots listos.
6. Generar la solicitud.
7. Contactar al vendedor.

También se debe permitir que un usuario solicite productos sin haber preparado sus bots, porque pueden existir casos donde el vendedor quiera revisar primero la solicitud.

La preparación de bots es una funcionalidad prioritaria, pero no debe bloquear todo el sitio.

---

# 4. CTA PRINCIPAL DE BOTS EN LA NAVEGACIÓN

En la barra principal debe existir un apartado:

```text
AGREGAR BOTS
```

Este elemento debe adquirir mayor visibilidad cuando el usuario no haya configurado todavía sus bots.

Ejemplo:

```text
INICIO
TIENDA
SKINS
PAVOS
CLUB
AGREGAR BOTS ✨
AYUDA
🛒
CUENTA
```

Si el usuario ya tiene bots preparados, mostrar:

```text
BOTS ✓
```

Si existen bots pendientes:

```text
BOTS 🟡
```

Si nunca ha configurado:

```text
AGREGAR BOTS ✨
```

La UI puede utilizar:

- animación sutil;
- badge;
- glow;
- indicador de estado;

pero nunca debe resultar molesta.

---

# 5. BANNER DE PREPARACIÓN DE BOTS

Encima de los productos de la tienda debe existir un pequeño banner informativo.

Ejemplo:

```text
------------------------------------------------------------

Agrega tu ID de plataforma para acelerar tu servicio

[ ? ] [ CONTÁCTANOS ]

[ AGREGAR BOTS ]

------------------------------------------------------------

TIENDA DE REGALOS

------------------------------------------------------------
```

Este banner:

- aparece especialmente cuando el usuario todavía no tiene bots;
- no bloquea la navegación;
- no bloquea el catálogo;
- puede ocultarse si el cliente ya completó la configuración;
- debe adaptarse a móvil.

---

# 6. INFORMACIÓN [?]

El botón:

```text
[ ? ]
```

abre un tooltip, popover o modal pequeño.

Debe explicar:

```text
¿Por qué necesitamos agregarte como amigo?

Para poder enviarte regalos de Fortnite,
nuestras cuentas de entrega deben agregarte
como amigo.

Fortnite establece un período mínimo de amistad
antes de que pueda realizarse el gifting.

Por eso recomendamos configurar tus bots
antes de realizar tu solicitud.

Mientras antes los agregues, antes podremos
preparar tu cuenta para tus regalos.
```

No hardcodear "48 horas" dentro del motor.

La interfaz puede presentar:

> "Período mínimo de amistad requerido"

y obtener el tiempo configurable desde las reglas actuales del sistema.

Actualmente la regla oficial de Epic establece un mínimo de dos días de amistad para gifting, pero esta duración debe permanecer configurable para poder adaptarse a futuros cambios. 

---

# 7. BOTÓN CONTACTANOS

El botón:

```text
[ CONTÁCTANOS ]
```

NO requiere que exista una compra.

Debe abrir directamente el canal comercial configurado.

Preferentemente:

```text
WhatsApp
```

y opcionalmente:

```text
Email
```

El cliente puede entrar a preguntar:

- cómo funcionan los regalos;
- cuánto tarda;
- cómo agregar bots;
- qué productos puede solicitar;
- qué plataformas son compatibles;
- dudas sobre V-Bucks;
- dudas sobre Battle Pass;
- cualquier otra consulta.

El contacto debe ser accesible desde:

- banner;
- header;
- footer;
- página de ayuda;
- carrito;
- página de tracking.

---

# 8. SELECTOR DE PLATAFORMA

El cliente podrá registrar la cuenta desde:

```text
Epic Games
Xbox
PlayStation
```

UI:

```text
¿Dónde tienes tu cuenta?

[ Epic Games ]

[ Xbox ]

[ PlayStation ]
```

Dependiendo de la selección mostrar:

### Epic

```text
ID de Epic Games
[________________]
```

### Xbox

```text
Gamertag
[________________]
```

### PlayStation

```text
PSN ID
[________________]
```

El sistema debe almacenar:

```text
platform
platform_user_id
```

No usar un campo genérico que pierda la plataforma.

---

# 9. SOLICITAR BOTS

Después de introducir el ID:

```text
[ SOLICITAR BOTS DE AMISTAD ]
```

Antes de confirmar:

```text
¿Tus datos son correctos?

Plataforma:
Epic Games

ID:
Pablito123

[ CANCELAR ]
[ CONFIRMAR ]
```

Después:

```text
✓ Solicitud registrada

En breve enviaremos las solicitudes
de amistad necesarias.

Estate atento a tu buzón de solicitudes
de amistad.

Aceptar las solicitudes lo antes posible
acelerará el proceso de tus regalos.

[ VER ESTADO ]
```

El sistema debe generar un `friendship_request`.

---

# 10. MODELO DE REQUEST

Separar:

## Request

Representa:

> El cliente quiere solicitar productos.

## FriendshipRequest

Representa:

> El cliente quiere preparar su cuenta para gifting.

No mezclar ambas entidades.

---

# 11. REQUEST ID

Cada solicitud debe tener un ID humano legible.

Formato sugerido:

```text
REQ-20260823-8F42
```

Debe ser único.

El Request ID aparecerá:

- en el cliente;
- en administración;
- en WhatsApp;
- en email;
- en notificaciones;
- en soporte.

---

# 12. TEXTO GENERADO DE LA SOLICITUD

Cuando el usuario genere su solicitud, crear automáticamente un texto estructurado.

Ejemplo:

```text
Hola 👋

Quiero solicitar los siguientes productos:

🎁 REGALOS
• Spider-Man — 1,500 V-Bucks
• Batman Pack — 2,500 V-Bucks

💰 RECARGA
• 4,500 V-Bucks

🎮 Datos de mi cuenta
Plataforma: Epic Games
ID: Pablito123

🆔 Solicitud:
REQ-20260823-8F42

Quedo atento a la confirmación de disponibilidad
y precio final.
```

El texto debe generarse dinámicamente.

---

# 13. COPIAR SOLICITUD

Debe existir:

```text
[ COPIAR SOLICITUD ]
```

Después de copiar:

```text
✓ Solicitud copiada
```

El texto debe ser seleccionable y copiarse como texto plano.

---

# 14. WHATSAPP CON MENSAJE PREPARADO

Además del botón de copiar:

```text
[ 💬 ABRIR WHATSAPP ]
```

El sistema debe construir un enlace de WhatsApp con el mensaje codificado.

Al abrirlo:

```text
WhatsApp
↓
Conversación con vendedor
↓
Mensaje ya escrito
```

El usuario únicamente debe pulsar:

```text
ENVIAR
```

No obligar al cliente a copiar manualmente si está usando WhatsApp.

El botón de copiar debe permanecer disponible como alternativa.

---

# 15. DATOS DISPONIBLES EN ADMINISTRACIÓN

Cada Request debe mostrar:

```text
Request ID
Cliente
Email
WhatsApp
Fortnite ID
Plataforma
Productos
Tipo de producto
Fecha de solicitud
Estado
Friendship Request
```

El Fortnite ID debe ser visible directamente y tener:

```text
[ COPIAR ID ]
```

---

# 16. PRODUCTO / SKU

Cada producto debe tener tres identificadores:

```text
internal_sku
fortnite_product_id
fortnite_offer_id
```

Ejemplo:

```text
SKU:
FORT-000001

Fortnite Product ID:
CID_123_ABC

Fortnite Offer ID:
V123456
```

No utilizar el ID de Fortnite como SKU principal.

---

# 17. SINCRONIZACIÓN DEL CATÁLOGO

Utilizar:

```text
Primary Provider:
Community Fortnite API
```

y:

```text
Snapshot System
```

Flujo:

```text
Scheduler
↓
Community API
↓
Fetch Shop
↓
Validate
↓
Normalize
↓
Compare Snapshot
↓
Upsert DB
↓
Create New Snapshot
↓
Update Cache
```

---

# 18. SNAPSHOTS

Guardar un snapshot por actualización relevante.

Cada snapshot debe contener:

- fecha;
- fuente;
- payload original;
- productos;
- precios;
- offer IDs;
- información de tienda.

Ejemplo:

```text
shop_snapshot
2026-08-23T00:00
```

Si la API deja de funcionar temporalmente:

```text
API FAIL
↓
último snapshot válido
↓
servir tienda conocida
```

La interfaz debe indicar cuando corresponda:

```text
Última actualización:
Hace 14 minutos
```

Nunca fingir que una tienda está actualizada si estamos utilizando datos antiguos.

---

# 19. GIFTABILITY ENGINE

Implementar un motor propio.

Inicialmente SOLO resolverá:

> ¿Este producto puede solicitarse como regalo?

No intentará todavía comprobar automáticamente si el destinatario específico cumple todas las condiciones.

Resultado:

```text
GIFTABLE
NOT_GIFTABLE
UNKNOWN
```

El estado `UNKNOWN` debe conducir a:

```text
MANUAL_REVIEW
```

No permitir que una incertidumbre se convierta automáticamente en:

```text
TRUE
```

---

# 20. FUTURA VALIDACIÓN DEL DESTINATARIO

No implementar en el MVP la comprobación automática de:

- A2F del cliente;
- amistad;
- elegibilidad individual;
- restricciones particulares de la cuenta;
- disponibilidad individual del gifting.

Eso será una fase futura.

Actualmente la validación individual se realizará por el vendedor.

La arquitectura debe dejar preparada una interfaz futura:

```ts
RecipientEligibilityService
```

pero NO debe ser una dependencia necesaria del MVP.

---

# 21. FRIENDSHIP REQUEST

Crear una entidad específica.

Campos mínimos:

```text
id
request_id
user_id
platform
platform_user_id
status
required_bots
eligibility_at
created_at
updated_at
```

Estados:

```text
CREATED
PROCESSING
WAITING_ACCEPTANCE
PARTIALLY_READY
READY
CANCELLED
```

---

# 22. FULFILLMENT ACCOUNTS / BOTS

Los bots se representan como `FulfillmentAccount`.

Ejemplo:

```text
BOT-EPIC-001
BOT-EPIC-002
BOT-XBOX-001
```

Cada cuenta tendrá:

```text
id
name
platform
status
capacity
daily_limit
current_usage
external_identifier
created_at
updated_at
```

Estados:

```text
ACTIVE
COOLDOWN
LIMITED
UNAVAILABLE
DISABLED
ERROR
```

Nunca almacenar contraseñas o secretos de las cuentas en texto plano.

---

# 23. ASIGNACIÓN DE BOTS

Para el MVP usar:

> Capacity Based Assignment.

Cada solicitud determinará cuántos bots necesita.

Ejemplo:

```text
required_bots = 3
```

El sistema buscará cuentas que:

```text
platform compatible
+
ACTIVE
+
capacity disponible
+
no bloqueadas
```

y reservará las necesarias.

No utilizar Round Robin como mecanismo principal.

Preparar la arquitectura para implementar Smart Assignment posteriormente.

---

# 24. REQUIRED BOTS

NO asumir que todas las solicitudes requieren el mismo número de bots.

Guardar:

```text
required_bots
```

en la friendship request.

Ejemplo:

```text
Cliente A → 1 bot
Cliente B → 2 bots
Cliente C → 3 bots
```

La regla que determine este número deberá ser configurable.

---

# 25. TABLA FRIENDSHIP REQUEST BOTS

Crear:

```text
friendship_request_bots
```

Campos:

```text
id
friendship_request_id
fulfillment_account_id

request_status
friendship_status

request_sent_at
friendship_confirmed_at

eligibility_at

created_at
updated_at
```

Estados de solicitud:

```text
PENDING
REQUEST_SENT
```

Estados de amistad:

```text
PENDING
ACCEPTED
REJECTED
UNKNOWN
```

---

# 26. FLUJO INDIVIDUAL DE CADA BOT

Cada bot tendrá su propia secuencia.

```text
Bot seleccionado
↓
Solicitud pendiente
↓
Solicitud enviada
↓
Cliente acepta
↓
Vendedor confirma amistad
↓
Cronómetro iniciado
↓
Eligible
```

No existe un cronómetro global obligatorio.

---

# 27. CRONÓMETRO POR BOT

Cada bot tiene:

```text
friendship_confirmed_at
eligibility_at
```

Ejemplo:

```text
BOT 1
Amistad:
23 Ago 12:00

Eligible:
25 Ago 12:00
```

```text
BOT 2
Amistad:
23 Ago 15:00

Eligible:
25 Ago 15:00
```

```text
BOT 3
Amistad:
24 Ago 10:00

Eligible:
26 Ago 10:00
```

---

# 28. NO RESETEAR TEMPORIZADORES

Cuando se añada un nuevo bot:

```text
BOT 1 → 20h restantes
BOT 2 → 26h restantes
BOT 3 → 40h restantes
BOT 4 → recién agregado
```

NO reiniciar los temporizadores existentes.

El Bot 4 comienza su propio cronómetro.

---

# 29. ELEGIBILIDAD PARA UN REGALO

Cuando llegue una solicitud de regalo:

```text
Request
↓
Consulta DB
↓
Buscar friendship bots
↓
¿Quiénes son amigos?
↓
¿Quiénes ya son elegibles?
↓
¿Quiénes están disponibles?
↓
Seleccionar bots válidos
```

La entrega futura podrá utilizar:

```text
ANY_ELIGIBLE_BOT
```

No necesariamente:

```text
ALL_BOTS
```

---

# 30. REGLA CLAVE DE ENTREGA

La existencia de varios bots significa que un cliente puede quedar habilitado para recibir antes de que todos sus bots estén disponibles.

Por ejemplo:

```text
BOT 1 → elegible ✅
BOT 2 → elegible ✅
BOT 3 → esperando
```

Si la operación requiere solamente un bot disponible:

```text
READY FOR FULFILLMENT
```

Si requiere más:

```text
WAITING_FOR_ADDITIONAL_BOT
```

La regla debe ser configurable.

---

# 31. AÑADIR NUEVOS BOTS

Si el administrador añade un nuevo bot al pool:

```text
BOT-EPIC-004
```

el sistema NO modifica los timers existentes.

Un cliente podrá visualizar:

```text
Bots agregados:

BOT 1 ✓
BOT 2 ✓
BOT 3 ✓

Nuevo bot disponible:

BOT 4 +
[ SOLICITAR AMISTAD ]
```

El cliente puede solicitarlo manualmente.

---

# 32. PANEL DEL CLIENTE — BOTS

Crear:

```text
/account/bots
```

Mostrar:

```text
MIS BOTS

Bot 1 — Epic
🟢 Amigo
⏱ 21h 42m restantes

Bot 2 — Epic
🟢 Amigo
⏱ 27h 18m restantes

Bot 3 — Epic
🟡 Solicitud enviada
Esperando aceptación

Bot 4 — Epic
⚪ No agregado
[ SOLICITAR ]
```

---

# 33. PANEL DE ADMINISTRACIÓN DE AMISTADES

Ruta:

```text
/admin/friendships
```

La lista NO debe ordenarse alfabéticamente.

Debe utilizar como prioridad:

```text
eligibility_wait_started_at ASC
```

o, para solicitudes todavía no iniciadas:

```text
created_at ASC
```

Interpretación:

> El usuario que lleva más tiempo esperando debe aparecer primero.

---

# 34. LISTA ADMINISTRATIVA

Ejemplo:

```text
SOLICITUDES DE AMISTAD

🔴 Pablito123
Esperando: 18h 32m

🟡 monsexx
Esperando: 11h 02m

🟡 juanitopro
Esperando: 4h 21m
```

El orden representa prioridad operativa.

---

# 35. VISTA DETALLADA ADMIN

Al seleccionar un usuario:

```text
-------------------------------------------------
FRIENDSHIP REQUEST
-------------------------------------------------

Request:
FR-20260823-0042

User ID:
Pablito123

Platform:
Epic Games

[ COPIAR ID ]

Solicitud creada:
23 Ago — 23:41

-------------------------------------------------
BOTS
-------------------------------------------------

BOT 1 — EPIC
[ ABRIR CUENTA ]

Solicitud enviada:
✓
23 Ago — 23:53

Amistad:
✓
23 Ago — 00:12

Timer:
23 Ago — 00:12
↓
25 Ago — 00:12

-------------------------------------------------

BOT 2 — EPIC
[ ABRIR CUENTA ]

Solicitud enviada:
✓
23 Ago — 23:55

Amistad:
✗

[ CONFIRMAR AMISTAD ]

-------------------------------------------------

BOT 3 — EPIC

Solicitud:
✗

[ ENVIAR SOLICITUD ]

-------------------------------------------------
```

---

# 36. BOTÓN PARA ABRIR CUENTA

Cada bot será representado como una acción:

```text
[ ABRIR CUENTA ]
```

Esto llevará al vendedor al destino correspondiente para utilizar la cuenta de fulfillment.

La aplicación NO debe automatizar el acceso mediante:

- contraseñas del cliente;
- cookies robadas;
- session tokens;
- bypass de autenticación;
- evasión de mecanismos de seguridad.

El vendedor utilizará los mecanismos de autenticación permitidos.

---

# 37. MARCAR SOLICITUD ENVIADA

No utilizar únicamente un checkbox editable.

Utilizar:

```text
[ MARCAR SOLICITUD ENVIADA ]
```

Al pulsarlo:

```text
request_sent_at = now()
request_status = REQUEST_SENT
```

y registrar un evento:

```text
FRIEND_REQUEST_SENT
```

con:

```text
admin_user_id
timestamp
bot_id
```

---

# 38. CONFIRMAR AMISTAD

Después:

```text
[ CONFIRMAR AMISTAD ]
```

El vendedor debe marcar que verificó manualmente que el usuario aparece como amigo.

Registrar:

```text
friendship_confirmed_at
friendship_status = ACCEPTED
```

y:

```text
FRIENDSHIP_CONFIRMED
```

Nunca asumir automáticamente que porque se envió una solicitud esta fue aceptada.

---

# 39. INICIO DEL TIMER INDIVIDUAL

Una vez confirmada una amistad:

```text
friendship_confirmed_at
```

el sistema calcula:

```text
eligibility_at
```

utilizando la duración configurable vigente.

Ejemplo conceptual:

```text
friendship_confirmed_at
+
configured_friendship_period
=
eligibility_at
```

No almacenar:

```text
48
```

como valor rígido en código.

---

# 40. NOTIFICACIÓN CUANDO EMPIEZA UN TIMER

El cliente recibe:

```text
🟢 Bot preparado

El Bot 1 ya está agregado a tu cuenta.

Tu período de espera ha comenzado.

Fecha de disponibilidad:
25 Ago 2026 — 12:00

Tiempo restante:
47h 59m
```

---

# 41. TRACKING POR BOT

La vista del cliente debe diferenciar:

```text
BOT 1
🟢 Amigo
⏱ 20h restantes

BOT 2
🟢 Amigo
⏱ 32h restantes

BOT 3
🟡 Solicitud enviada
Esperando aceptación

BOT 4
⚪ No agregado
[ SOLICITAR ]
```

Esto es obligatorio para dar transparencia al cliente.

---

# 42. CLIENTE PUEDE SOLICITAR NUEVOS BOTS

Si existe un nuevo bot disponible:

```text
BOT 4
Nuevo bot disponible

[ SOLICITAR AMISTAD ]
```

Al solicitarlo:

```text
friendship_request_bot
```

se crea sin modificar los registros anteriores.

El cronómetro empieza solamente cuando este nuevo bot sea confirmado como amigo.

---

# 43. RESUMEN DE PREPARACIÓN

Mostrar:

```text
Preparación:

2 de 3 bots agregados

✅ Bot 1
✅ Bot 2
🟡 Bot 3
```

y:

```text
Puede comenzar el fulfillment cuando
exista al menos un bot elegible y disponible
según las reglas aplicables al producto.
```

No asumir que todos los bots son siempre necesarios.

---

# 44. REQUEST VS PURCHASE

Durante el MVP:

```text
REQUEST ≠ PURCHASE
```

Una solicitud solamente significa:

> El cliente expresó intención de adquirir productos.

Un pedido/purchase real solamente existirá cuando el vendedor confirme:

```text
availability
+
price
+
payment
```

---

# 45. PAGO

No implementar gateway de pago inicialmente.

El cliente será dirigido a comunicación directa con el vendedor.

El sistema debe dejar preparado:

```text
PaymentService
```

para una fase futura.

No implementar:

- Stripe;
- Mercado Pago;
- checkout online;

en el MVP.

---

# 46. ESTADOS DE REQUEST

Utilizar:

```text
CREATED
WHATSAPP_OPENED
CONTACTED
UNDER_REVIEW
PRICE_CONFIRMED
PAYMENT_PENDING
PAID
FULFILLMENT_PENDING
FULFILLED
CANCELLED
EXPIRED
```

---

# 47. ESTADOS DE FRIENDSHIP REQUEST

Utilizar:

```text
CREATED
PROCESSING
WAITING_ACCEPTANCE
PARTIALLY_READY
READY
CANCELLED
```

---

# 48. ESTADOS INDIVIDUALES DE BOT

Solicitud:

```text
PENDING
REQUEST_SENT
```

Amistad:

```text
PENDING
ACCEPTED
REJECTED
UNKNOWN
```

Disponibilidad:

```text
AVAILABLE
WAITING
ELIGIBLE
UNAVAILABLE
```

---

# 49. NOTIFICACIONES

Crear `NotificationService`.

Canales:

```text
WEB
EMAIL
WHATSAPP
```

Eventos:

```text
FRIENDSHIP_REQUEST_CREATED
FRIEND_REQUEST_SENT
FRIENDSHIP_CONFIRMED
BOT_TIMER_STARTED
BOT_TIMER_COMPLETED
NEW_BOT_AVAILABLE
READY_FOR_FULFILLMENT
FULFILLMENT_COMPLETED
```

---

# 50. NOTIFICACIONES SOBRE NUEVOS BOTS

Si se agrega un nuevo bot:

```text
🎁 Nuevo bot disponible

Hemos agregado una nueva cuenta de entrega
que puedes agregar para preparar tu cuenta.

[ SOLICITAR AMISTAD ]
```

El usuario debe poder activarlo sin perder los tiempos de sus bots anteriores.

---

# 51. SISTEMA DE SNAPSHOTS DEL CATÁLOGO

Tabla:

```text
shop_snapshots
```

Campos:

```text
id
provider
fetched_at
shop_date
raw_payload
checksum
created_at
```

El sistema debe poder reconstruir:

```text
¿Qué mostraba la tienda el día X?
```

---

# 52. PRODUCTS

Campos:

```text
id
internal_sku

fortnite_product_id
fortnite_offer_id

name
slug
description

type
subcategory
rarity
series

price_vbucks

image_url
icon_url
featured_image_url
banner_url

giftable
active
visible

first_seen_at
last_seen_at

created_at
updated_at
```

---

# 53. SHOP ITEMS

```text
id
shop_snapshot_id
product_id
price_vbucks
display_order
section
featured
created_at
```

---

# 54. USERS

```text
id
email
name
role
created_at
updated_at
```

---

# 55. FORTNITE ACCOUNTS

```text
id
user_id
platform
platform_user_id
display_name
verification_status
created_at
updated_at
```

---

# 56. REQUESTS

```text
id
request_number
user_id

status
channel

message

created_at
updated_at
```

---

# 57. REQUEST ITEMS

```text
id
request_id

product_id

sku
product_name_snapshot

fortnite_product_id
fortnite_offer_id

price_vbucks_snapshot

quantity
fulfillment_type

created_at
```

---

# 58. FULFILLMENT ACCOUNTS

```text
id
name
platform
status

capacity
daily_limit
current_usage

external_identifier

created_at
updated_at
```

---

# 59. FRIENDSHIP REQUESTS

```text
id
request_id
user_id

platform
platform_user_id

status
required_bots

created_at
updated_at
```

---

# 60. FRIENDSHIP REQUEST BOTS

```text
id

friendship_request_id
fulfillment_account_id

request_status
friendship_status

request_sent_at
friendship_confirmed_at

eligibility_at

created_at
updated_at
```

---

# 61. ORDER FUTURO

No implementar todavía un ecommerce payment/order completo.

Pero reservar arquitectura para:

```text
orders
order_items
payments
fulfillment_jobs
```

en fases posteriores.

---

# 62. EVENT LOG

Toda acción relevante debe generar un evento.

Ejemplos:

```text
REQUEST_CREATED
FORTNITE_ID_ADDED

FRIENDSHIP_REQUEST_CREATED

FRIEND_REQUEST_SENT
FRIENDSHIP_CONFIRMED

BOT_TIMER_STARTED
BOT_TIMER_COMPLETED

NEW_BOT_AVAILABLE

REQUEST_CONFIRMED
PAYMENT_CONFIRMED

FULFILLMENT_STARTED
FULFILLMENT_COMPLETED
FULFILLMENT_FAILED
```

Cada evento debe guardar:

```text
entity
entity_id
event_type
user_id
metadata
created_at
```

---

# 63. PRIORIDAD OPERATIVA

La lista de administración debe priorizar al usuario que lleva más tiempo esperando.

No utilizar orden alfabético.

Reglas:

### Si el cliente todavía está esperando que se envíen solicitudes:

```text
created_at ASC
```

### Si ya existe amistad y timer:

```text
eligibility_at ASC
```

La interfaz debe poner arriba al usuario con mayor antigüedad pendiente.

---

# 64. REDIS

Redis será utilizado para:

- locks;
- jobs;
- timers;
- cache;
- workers;
- rate limiting;
- futuras reservas de bots.

---

# 65. TIMER ARCHITECTURE

No depender exclusivamente de un JavaScript en frontend.

El frontend solamente calcula visualmente:

```text
eligibility_at - current_time
```

La fuente de verdad es PostgreSQL.

Para eventos:

```text
eligibility_at
↓
Delayed Job
↓
Worker
↓
BOT_TIMER_COMPLETED
```

Además mantener un checker periódico para recuperar jobs que hayan fallado.

---

# 66. MULTIPLES CRONÓMETROS

Nunca tener:

```text
friendship_request.timer
```

como única fuente temporal.

Cada:

```text
friendship_request_bot
```

debe poseer:

```text
friendship_confirmed_at
eligibility_at
```

Esto permite:

```text
Bot A → 10h
Bot B → 20h
Bot C → 35h
Bot D → 46h
```

simultáneamente.

---

# 67. QUERY DE ELEGIBILIDAD FUTURA

Cuando se solicite fulfillment:

```text
SELECT friendship_request_bots
WHERE friendship_request_id = ?
AND friendship_status = ACCEPTED
AND eligibility_at <= NOW()
AND fulfillment_account.status = ACTIVE
```

Después seleccionar solamente los bots elegibles.

Esto permite que el sistema futuro pueda entregar usando:

```text
ANY_ELIGIBLE_BOT
```

o:

```text
N_ELIGIBLE_BOTS
```

según la regla del producto.

---

# 68. FULFILLMENT ENGINE FUTURO

Crear abstracción:

```ts
interface FulfillmentProvider {
  checkAvailability(...)
  prepare(...)
  fulfill(...)
  getStatus(...)
}
```

Proveedores posibles:

```text
MockProvider
ManualProvider
GiftProvider
CodeProvider
ExternalProvider
```

No activar métodos reales hasta verificar que sean legal y técnicamente apropiados.

---

# 69. PRE-FLIGHT FUTURO

El futuro sistema debe poder comprobar:

```text
producto
+
recipient
+
eligibility
+
bot
+
availability
+
limits
```

antes del fulfillment.

En MVP esta etapa permanece parcialmente manual.

---

# 70. BOT ASSIGNMENT FUTURO

Inicialmente:

```text
Capacity Based
```

Posteriormente:

```text
Smart Assignment
```

considerando:

```text
capacity
usage
cooldown
platform
product
health
daily limits
```

---

# 71. RETRIES FUTUROS

Implementar infraestructura preparada para:

```text
exponential backoff
error classification
bot replacement
retry
dead letter queue
manual review
```

En MVP no debe ejecutarse fulfillment automático.

---

# 72. ESCALABILIDAD

Arquitectura inicial:

```text
Web
+
API
+
PostgreSQL
+
Redis
+
Worker
```

Cuando aumente el volumen:

```text
API
↓
Redis/BullMQ
↓
Multiple Workers
```

Separar jobs:

```text
Catalog Worker
Notification Worker
Friendship Worker
Fulfillment Worker
```

No utilizar microservicios desde el comienzo.

---

# 73. ANALYTICS

Registrar:

```text
product_view
product_add_to_cart
request_created
whatsapp_opened
friendship_requested
friendship_completed
request_confirmed
sale_confirmed
```

Esto permitirá medir:

```text
views
→
cart
→
requests
→
WhatsApp
→
sales
```

---

# 74. DIFERENCIADOR DEL PRODUCTO

La tienda debe diferenciarse mediante:

## Transparencia

El cliente sabe exactamente qué está pasando.

## Preparación anticipada

El usuario descubre el requisito de amistad antes de comprar.

## Tracking

Cada bot tiene su propio estado.

## Tiempo individual

Cada bot posee su propio cronómetro.

## Nuevos bots

Agregar un nuevo bot no reinicia los timers anteriores.

## Comunicación

WhatsApp está integrado directamente en el flujo.

## Request ID

Cada solicitud puede rastrearse fácilmente.

---

# 75. HOME PAGE

Estructura:

```text
HEADER
↓
HERO
↓
BANNER AGREGAR BOTS
↓
TIENDA DE HOY
↓
CATEGORÍAS
↓
PRODUCTOS DESTACADOS
↓
CÓMO FUNCIONA
↓
TRACKING / CONFIANZA
↓
FAQ
↓
CONTACTO
↓
FOOTER
```

---

# 76. BANNER DE BOTS EN SHOP

Mostrar únicamente cuando sea relevante.

Estado sin bots:

```text
Agrega tu ID de plataforma para acelerar tu servicio

[ ? ]
[ CONTÁCTANOS ]

[ AGREGAR BOTS ]
```

Estado parcialmente preparado:

```text
Tu cuenta está en preparación

2 de 3 bots agregados

[ VER MIS BOTS ]
```

Estado listo:

```text
🟢 Tu cuenta está preparada para gifting

[ VER MIS BOTS ]
```

---

# 77. CART

El carrito debe mostrar:

```text
Producto
Precio V-Bucks
Cantidad
Tipo
Giftable
```

Antes de generar solicitud:

```text
Validar productos
↓
Validar catálogo
↓
Validar estado
↓
Generar Request
```

---

# 78. REQUEST GENERATION

Al pulsar:

```text
SOLICITAR PRODUCTOS
```

el backend debe:

1. Validar productos.
2. Obtener snapshots.
3. Crear Request.
4. Crear Request Items.
5. Generar Request Number.
6. Generar mensaje.
7. Devolver WhatsApp URL.
8. Mostrar copia.

---

# 79. WHATSAPP TRACKING

Cuando el usuario abra:

```text
ABRIR WHATSAPP
```

registrar:

```text
whatsapp_opened_at
```

Esto permitirá conocer la conversión.

No asumir que:

```text
whatsapp_opened = mensaje enviado
```

Son eventos diferentes.

---

# 80. PANEL ADMIN REQUESTS

Ruta:

```text
/admin/requests
```

Orden:

```text
created_at DESC
```

para nuevas solicitudes comerciales.

Filtros:

```text
NEW
CONTACTED
UNDER_REVIEW
PAYMENT_PENDING
PAID
FULFILLMENT_PENDING
FULFILLED
CANCELLED
```

---

# 81. PANEL ADMIN FRIENDSHIPS

Ruta:

```text
/admin/friendships
```

Orden prioritario:

1. Timer más cercano a completarse.
2. Usuarios esperando desde hace más tiempo.
3. Solicitudes sin procesar.

El criterio exacto debe estar implementado como `priority_score` o consulta determinista, no depender del orden visual del frontend.

---

# 82. SEGURIDAD

Nunca almacenar:

- contraseñas de clientes;
- credenciales de Epic del cliente;
- cookies;
- session tokens;
- secretos.

Usar:

- variables de entorno;
- secret manager;
- RBAC;
- audit logs;
- rate limiting;
- secure cookies;
- validation;
- Zod;
- webhook verification futura.

---

# 83. MOCK MODE

Debe existir:

```text
MOCK_FORTNITE=true
MOCK_FULFILLMENT=true
```

para desarrollar sin conectarse a operaciones reales.

El Mock debe permitir probar:

```text
shop
request
friendship
bots
timers
notifications
fulfillment
```

---

# 84. FASES ACTUALIZADAS

## FASE 0 — Foundation

- Monorepo.
- TypeScript.
- Next.js.
- API.
- Prisma.
- PostgreSQL.
- Redis.
- Docker.
- env.
- tests.

---

## FASE 1 — Catálogo

- Fortnite API.
- Snapshot.
- Normalización.
- SKU.
- Shop.
- Search.
- Filters.

---

## FASE 2 — Identidad Fortnite

- User account.
- Epic/Xbox/PlayStation.
- Fortnite ID.
- Platform selection.
- Account dashboard.

---

## FASE 3 — Carrito

- Add to cart.
- Remove.
- Update.
- Cart persistence.
- Product validation.

---

## FASE 4 — Request System

- Request.
- Request Item.
- Request ID.
- Message generator.
- Copy button.
- WhatsApp deep link.
- WhatsApp tracking.

---

## FASE 5 — Bot System

- Add bots CTA.
- Banner.
- Info modal.
- Platform selector.
- Friendship Request.
- Bot assignment.
- Admin panel.

---

## FASE 6 — Individual Timers

- Friendship confirmation.
- `friendship_confirmed_at`.
- `eligibility_at`.
- Individual timers.
- Multiple simultaneous timers.
- New bot without resetting old timers.

---

## FASE 7 — Notifications

- Web.
- Email.
- WhatsApp.
- New bot.
- Friendship sent.
- Friendship confirmed.
- Timer started.
- Timer completed.

---

## FASE 8 — Admin Operations

- Requests.
- Friendship queue.
- Bot pool.
- Priority queue.
- Customer details.
- Fortnite ID copy.
- Audit log.

---

## FASE 9 — Future Fulfillment

- Fulfillment abstraction.
- Preflight.
- Capacity.
- Redis locks.
- Worker.
- Retry.
- DLQ.

---

## FASE 10 — Future Payments

- PaymentService.
- Mercado Pago.
- Stripe.
- Webhooks.
- Idempotency.

No implementar ahora.

---

# 85. DEFINITION OF DONE DEL MVP

El MVP se considera funcional cuando puede ejecutar:

```text
CLIENTE
↓
Navega tienda
↓
Ve producto
↓
Agrega al carrito
↓
Registra Fortnite ID
↓
Solicita bots
↓
Ve estado
↓
Vendedor recibe solicitud
↓
Vendedor envía solicitudes
↓
Marca enviadas
↓
Cliente acepta
↓
Vendedor confirma
↓
Timer individual inicia
↓
Cliente ve timer
↓
Cliente genera solicitud
↓
Copia o abre WhatsApp
↓
Vendedor recibe Request ID
```

El fulfillment automático y el pago online NO forman parte del Definition of Done del primer MVP.

---

# 86. REGLAS PARA OPENCODE

Antes de implementar:

1. Analizar repository.
2. Leer `AGENTS.md`.
3. Leer `SPEC.md`.
4. Revisar arquitectura existente.
5. No inventar APIs.
6. No asumir funcionalidades externas.
7. Crear interfaces cuando la integración real aún no exista.
8. Implementar mocks.
9. Escribir tests.
10. Ejecutar tests después de cada fase.

No crear toda la aplicación en una sola operación.

Completar una fase antes de empezar la siguiente.

---

# 87. REGLA PARA LOS BOTS

Los bots son un recurso operativo.

No deben convertirse en una dependencia de frontend.

Toda la lógica debe estar en backend:

```text
Bot
↓
Friendship Request
↓
Status
↓
Eligibility
↓
Availability
```

El frontend solamente representa el estado.

---

# 88. REGLA PARA LOS TIMERS

La fuente de verdad es:

```text
PostgreSQL
```

No:

```text
localStorage
```

No:

```text
browser timer
```

No:

```text
JavaScript state
```

El frontend debe calcular visualmente el tiempo restante a partir de:

```text
eligibility_at
```

El backend determina si ya es elegible.

---

# 89. REGLA PARA NUEVOS BOTS

Agregar un bot:

```text
BOT 4
```

NO debe modificar:

```text
BOT 1 eligibility_at
BOT 2 eligibility_at
BOT 3 eligibility_at
```

Cada relación:

```text
friendship_request_bot
```

es independiente.

---

# 90. REGLA PARA EL ADMIN

Toda acción manual importante debe dejar registro.

Ejemplos:

```text
admin marked request sent
admin confirmed friendship
admin started timer
admin disabled bot
admin changed bot capacity
```

Guardar:

```text
admin_id
action
entity
entity_id
timestamp
metadata
```

---

# 91. REGLA DE OPERACIONES

El sistema debe favorecer el flujo:

```text
Más antiguo esperando
↓
Primero atender
```

No priorizar por:

- nombre;
- alfabeto;
- usuario VIP automáticamente;
- último usuario creado;

salvo que posteriormente se implemente una política explícita de prioridad.

---

# 92. FUTURA ESCALABILIDAD

Objetivo:

```text
10 requests/day
↓
100/day
↓
500/day
↓
1,000/day
```

Arquitectura:

```text
API
↓
Redis
↓
Workers
```

Inicialmente:

```text
1 Worker
```

Posteriormente aumentar horizontalmente.

No migrar a microservicios hasta que exista una necesidad real.

---

# 93. ARQUITECTURA FINAL DEL MVP

```text
                       FORTNITE
                          │
                          ▼
                  COMMUNITY API
                          │
                          ▼
                    SHOP SYNC
                          │
                  ┌───────┴────────┐
                  ▼                ▼
             PostgreSQL        Snapshots
                  │
                  ▼
              NEXT.JS WEB
                  │
        ┌─────────┼──────────┐
        ▼         ▼          ▼
       Shop      Cart      Account
                            │
                            ▼
                    Fortnite ID
                            │
                            ▼
                    Friendship UI
                            │
                            ▼
                      Request System
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       Copy Request                  WhatsApp
              │                           │
              └─────────────┬─────────────┘
                            ▼
                         SELLER
                            │
                            ▼
                    ADMIN DASHBOARD
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
             Requests             Friendships
                                      │
                                      ▼
                                  Bot Pool
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                       Bot 1        Bot 2        Bot 3
                         │            │            │
                         ▼            ▼            ▼
                       Timer        Timer        Timer
                         │            │            │
                         └────────────┼────────────┘
                                      ▼
                              Eligibility Ready
                                      │
                                      ▼
                              FUTURE FULFILLMENT
```

---

# 94. DIFERENCIADOR PRINCIPAL

El producto NO debe venderse únicamente como:

> "Una tienda de skins."

La experiencia debe transmitir:

> "Te mostramos la tienda, te ayudamos a preparar tu cuenta y puedes ver exactamente en qué etapa está tu entrega."

El cliente debe pasar de:

```text
"No sé qué está pasando"
```

a:

```text
"Bot 1 ya está agregado.
Bot 2 está esperando.
Me faltan 21 horas.
Ya sé qué debo hacer."
```

Ese es uno de los principales valores diferenciales del sistema.

---

# 95. INSTRUCCIÓN FINAL PARA OPENCODE

Construir este sistema como un monolito modular preparado para crecer.

Prioridad:

```text
1. Correctness
2. Security
3. Business logic
4. Reliability
5. Maintainability
6. UX
7. Performance
8. Visual polish
```

No implementar pago online todavía.

No implementar fulfillment automático todavía.

No implementar verificación automática del destinatario todavía.

Sí implementar:

- catálogo;
- snapshots;
- SKU;
- carrito;
- requests;
- WhatsApp;
- Fortnite ID;
- bots;
- friendship requests;
- individual timers;
- admin dashboard;
- client tracking;
- notifications;
- Redis;
- worker infrastructure;
- interfaces futuras.

La arquitectura debe permitir añadir posteriormente:

```text
Payment Provider
Recipient Eligibility Provider
Fulfillment Provider
Smart Bot Assignment
Automatic Gift Engine
```

sin reconstruir el proyecto.

No usar información falsa ni inventar integraciones.

Cuando una integración externa todavía no esté disponible:

```text
Interface
+
Mock implementation
+
TODO documented
```

No bloquear el resto del proyecto.

El proyecto debe evolucionar desde:

```text
CATALOG
+
REQUESTS
+
MANUAL OPERATIONS
```

hacia:

```text
CATALOG
+
REQUESTS
+
AUTOMATED FRIENDSHIP MANAGEMENT
+
AUTOMATED FULFILLMENT
+
PAYMENTS
+
SCALING
```

sin romper las funcionalidades existentes.

# FIN DEL SPEC