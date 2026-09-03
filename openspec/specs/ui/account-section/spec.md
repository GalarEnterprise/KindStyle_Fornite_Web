# Account Section Specification

## Purpose

Proporciona un layout compartido para la sección de cuenta del usuario con sidebar de navegación persistente, acceso directo a todas las secciones, y navegación de retorno a la tienda.

## Requirements

### Requirement: Account sidebar layout

El sistema DEBE proporcionar un layout compartido para todas las páginas bajo `/account/*` que incluya un sidebar de navegación.

- El sidebar DEBE mostrarse en todas las páginas de cuenta (`/account`, `/account/profile`, `/account/bots`, `/account/requests`, `/account/payment`, `/account/notifications`)
- El sidebar DEBE incluir enlaces a todas las secciones de cuenta
- La sección actual DEBE estar resaltada visualmente en el sidebar
- El sidebar DEBE ser colapsable en dispositivos móviles (hamburger menu)

#### Scenario: Sidebar displays on account pages
- **WHEN** un usuario autenticado navega a cualquier página bajo `/account/*`
- **THEN** el sistema muestra un sidebar con enlaces a todas las secciones de cuenta

#### Scenario: Current section highlighted
- **WHEN** el usuario está en `/account/requests`
- **THEN** el enlace "Mis solicitudes" en el sidebar DEBE estar resaltado visualmente

#### Scenario: Mobile sidebar collapse
- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** el sidebar DEBE colapsarse y ser expandible con un botón hamburger

### Requirement: Account navigation items

El sidebar DEBE incluir los siguientes enlaces de navegación:

- Mi Perfil (`/account/profile`)
- Mis solicitudes (`/account/requests`)
- Mis bots (`/account/bots`)
- Pagos (`/account/payment`)
- Notificaciones (`/account/notifications`)

#### Scenario: All navigation items present
- **WHEN** el usuario ve el sidebar de cuenta
- **THEN** se muestran los 5 enlaces de navegación listados

#### Scenario: Profile link accessible
- **WHEN** el usuario hace clic en "Mi Perfil" en el sidebar
- **THEN** el sistema navega a `/account/profile`

### Requirement: Return to shop link

El sistema DEBE proporcionar un enlace "Volver a la tienda" visible desde cualquier página de cuenta.

- El enlace DEBE estar presente en el sidebar o en un lugar prominente del layout
- El enlace DEBE navegar a `/shop`

#### Scenario: Return to shop from any account page
- **WHEN** el usuario está en cualquier página de cuenta y hace clic en "Volver a la tienda"
- **THEN** el sistema navega a `/shop`

### Requirement: Account page without redundant cards

La página `/account` (dashboard) DEBE mostrar un resumen de cuenta sin duplicar los enlaces del sidebar.

- La página DEBE mostrar información del usuario (apodo, email, rol)
- La página DEBE eliminar las 4 tarjetas de navegación que duplican el sidebar
- La página DEBE mantener un diseño limpio y enfocado en información

#### Scenario: Dashboard shows user summary
- **WHEN** el usuario accede a `/account`
- **THEN** la página muestra un resumen con apodo, email, rol y fecha de registro

#### Scenario: No duplicate navigation cards
- **WHEN** el usuario accede a `/account`
- **THEN** la página NO muestra tarjetas de navegación que dupliquen el sidebar

### Requirement: Responsive account layout

El sistema DEBE mostrar el layout de cuenta correctamente en dispositivos móviles y de escritorio.

#### Scenario: Desktop layout
- **WHEN** el usuario accede desde un dispositivo de escritorio
- **THEN** el sidebar se muestra fijo a la izquierda con el contenido a la derecha

#### Scenario: Mobile layout
- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** el sidebar se colapsa y el contenido ocupa todo el ancho
