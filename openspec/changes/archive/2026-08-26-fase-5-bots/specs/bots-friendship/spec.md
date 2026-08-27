# Delta Spec - bots-friendship

## ADDED Requirements

### REQ-BOT-001: CRUD de bots para admin
El sistema DEBE permitir al admin (rol ADMIN o SUPER_ADMIN) gestionar bots FulfillmentAccount: listar, crear (nombre, plataforma, capacidad, límite diario, identificador externo), actualizar y cambiar estado entre ACTIVE, COOLDOWN, LIMITED, UNAVAILABLE, DISABLED y ERROR. Las rutas admin DEBEN requerir rol ADMIN/SUPER_ADMIN.

#### Scenario: Admin crea un bot
- **WHEN** el admin envía POST /api/admin/bots con nombre, plataforma EPIC/XBOX/PLAYSTATION y límites válidos
- **THEN** el bot se crea con status ACTIVE y current_usage 0
- **AND** aparece en la lista de bots

#### Scenario: Cliente no puede acceder a rutas admin
- **WHEN** un usuario sin rol ADMIN llama a cualquier ruta /api/admin/*
- **THEN** responde 403 FORBIDDEN

### REQ-BOT-002: Registro de ID de plataforma por el cliente
El cliente autenticado DEBE poder registrar su ID de plataforma seleccionando Epic Games, Xbox o PlayStation, almacenando `platform` + `platform_user_id` (sin campo genérico). El label del campo DEBE cambiar según plataforma: Epic → "ID de Epic Games", Xbox → "Gamertag", PlayStation → "PSN ID".

#### Scenario: Cliente Epic registra su ID
- **WHEN** el cliente selecciona Epic Games e ingresa su ID
- **THEN** se crea una FriendshipRequest con platform EPIC y status CREATED
- **AND** se asignan bots automáticamente

#### Scenario: Validación de entrada
- **WHEN** el cliente envía plataforma inválida o ID vacío
- **THEN** responde 400 con código VALIDATION_ERROR

### REQ-BOT-003: Asignación capacity-based de bots
Al crear la FriendshipRequest, el sistema DEBE asignar transaccionalmente hasta `required_bots` bots con status ACTIVE y `current_usage < capacity`, priorizando los de menor carga. Cada asignación DEBE incrementar `current_usage` del bot. Si no hay bots suficientes DEBE responder 409 NO_BOTS_AVAILABLE sin dejar asignaciones parciales.

#### Scenario: Asignación exitosa de 1 bot
- **WHEN** hay al menos un bot ACTIVE con capacidad disponible
- **THEN** se crean registros FriendshipRequestBot con request_status PENDING y friendship_status PENDING
- **AND** current_usage del bot aumenta en 1
- **AND** el FriendshipRequest pasa a PROCESSING

#### Scenario: Sin bots disponibles
- **WHEN** ningún bot ACTIVE tiene capacidad disponible
- **THEN** responde 409 NO_BOTS_AVAILABLE
- **AND** no se crean FriendshipRequestBot ni se modifica current_usage

### REQ-BOT-004: Agregar bot adicional sin resetear existentes
El cliente DEBE poder solicitar un bot adicional cuando tenga menos bots que required_bots. El sistema DEBE asignar solo el nuevo bot preservando los registros existentes intactos (mismos request_sent_at, friendship_confirmed_at y estados).

#### Scenario: Cliente solicita bot faltante
- **WHEN** el usuario tiene 2 de 3 bots confirmados y pide otro
- **AND** existe un bot ACTIVE disponible no asignado a ese usuario
- **THEN** se agrega 1 nuevo FriendshipRequestBot
- **AND** los 2 bots previos conservan sus fechas y estados

### REQ-BOT-005: Acciones admin sobre amistades
El admin DEBE poder ejecutar sobre cada FriendshipRequestBot:
- MARCAR SOLICITUD ENVIADA: setea request_status REQUEST_SENT, request_sent_at, evento FRIEND_REQUEST_SENT; requiere estado previo PENDING (idempotente si ya enviado)
- CONFIRMAR AMISTAD: setea friendship_status ACCEPTED, friendship_confirmed_at, evento FRIENDSHIP_CONFIRMED; requiere solicitud previamente enviada (409 en caso contrario)
- El status del FriendshipRequest DEBE recalcularse: WAITING_ACCEPTANCE con ≥1 enviada, PARTIALLY_READY con ≥1 confirmada, READY con todas confirmadas

#### Scenario: Confirmar amistad sin solicitud enviada
- **WHEN** el admin intenta confirmar amistad de un bot con request_status PENDING
- **THEN** responde 409 REQUEST_NOT_SENT

#### Scenario: Flujo completo de un bot
- **WHEN** el admin marca solicitud enviada y luego confirma amistad
- **THEN** quedan registradas ambas fechas y ambos eventos en EventLog
- **AND** el FriendshipRequest refleja el estado derivado correcto

### REQ-BOT-006: Cola y vista detallada admin
GET /api/admin/friendships DEBE listar las FriendshipRequest ordenadas por solicitudes sin procesar primero y luego created_at ASC. GET /api/admin/friendships/[id] DEBE devolver el detalle con datos del cliente (platform_user_id), lista de bots con sus estados/fechas y acciones disponibles.

#### Scenario: Cola priorizada
- **WHEN** existen solicitudes con bots PENDING y otras avanzadas
- **THEN** las con bots PENDING aparecen primero, ordenadas por created_at ascendente

### REQ-BOT-007: Panel cliente de bots
La página /account/bots DEBE mostrar cada bot asignado con nombre, plataforma y estado (No agregado / Solicitud enviada / Amigo), y un botón SOLICITAR para pedir un bot faltante cuando confirmed+pending < required_bots. DEBE ocultar credenciales o identificadores sensibles de los bots.

#### Scenario: Vista parcialmente preparada
- **WHEN** el usuario tiene 1 bot amigo, 1 con solicitud enviada y required_bots 3
- **THEN** muestra el primero como Amigo, el segundo como Solicitud enviada
- **AND** ofrece SOLICITAR para el tercero

### REQ-BOT-008: Banner de preparación en tienda
La tienda DEBE mostrar un banner según estado de amistad del usuario autenticado: sin registro → invitación a agregar ID con acceso al info modal; parcialmente preparado → "X de Y bots agregados" con enlace a /account/bots; READY → indicador verde de cuenta preparada.

#### Scenario: Usuario listo para gifting
- **WHEN** todos los bots del usuario tienen friendship_status ACCEPTED
- **THEN** el banner muestra el estado preparado con enlace VER MIS BOTS

### REQ-BOT-009: CTA en navbar e info modal
El navbar DEBE mostrar CTA según estado: AGREGAR BOTS ✨ sin registro, BOTS 🟡 con preparación pendiente, BOTS ✓ cuando READY. El info modal DEBE explicar por qué se necesita la amistad SIN mencionar un número de horas hardcodeado.

#### Scenario: Info modal sin hardcodear período
- **WHEN** el usuario abre el modal [?]
- **THEN** explica la necesidad de amistad y el período mínimo de Fortnite
- **AND** no menciona "48 horas" ni cifra hardcodeada

### REQ-BOT-010: Trazabilidad con EventLog
Cada acción relevante (asignación, solicitud enviada, amistad confirmada) DEBE registrar un evento en EventLog con entity FRIENDSHIP_REQUEST_BOT, entity_id del registro, event_type correspondiente y metadata mínima.
