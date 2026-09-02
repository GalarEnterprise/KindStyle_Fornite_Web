# User Menu Specification

## Purpose

Proporciona un menú desplegable en el header que agrupa las acciones del usuario (navegación a cuenta, pedidos, cerrar sesión) en un solo componente, mejorando la experiencia de usuario y liberando espacio en la barra de navegación.

## Requirements

### Requirement: UserMenu dropdown trigger

El sistema DEBE mostrar el apodo del usuario como trigger del menú desplegable en el header.

- El trigger DEBE mostrar el apodo del usuario (o "Mi cuenta" si no tiene apodo)
- El trigger DEBE ser un botón con indicador visual de dropdown (flecha hacia abajo)
- El trigger DEBE cambiar de estilo al pasar el cursor (hover state)

#### Scenario: User sees their nickname as dropdown trigger
- **WHEN** el usuario está autenticado y tiene apodo configurado
- **THEN** el header muestra el apodo como botón del menú desplegable

#### Scenario: User without nickname sees fallback text
- **WHEN** el usuario está autenticado pero no tiene apodo
- **THEN** el header muestra "Mi cuenta" como texto del trigger

### Requirement: Dropdown menu items

El sistema DEBE mostrar las siguientes opciones en el menú desplegable:

- Mi Cuenta (enlace a `/account`)
- Mis Pedidos (enlace a `/account/requests`)
- Cerrar Sesión (acción de logout)

#### Scenario: Dropdown shows all menu items
- **WHEN** el usuario hace clic en el trigger del menú
- **THEN** se despliega un menú con las tres opciones: Mi Cuenta, Mis Pedidos, Cerrar Sesión

#### Scenario: Mi Cuenta navigates to account page
- **WHEN** el usuario hace clic en "Mi Cuenta"
- **THEN** el sistema navega a `/account`

#### Scenario: Mis Pedidos navigates to requests page
- **WHEN** el usuario hace clic en "Mis Pedidos"
- **THEN** el sistema navega a `/account/requests`

#### Scenario: Cerrar Sesión logs out the user
- **WHEN** el usuario hace clic en "Cerrar Sesión"
- **THEN** el sistema ejecuta la acción de logout y redirige a `/`

### Requirement: Dropdown behavior

El sistema DEBE cerrar el menú desplegable cuando:

- El usuario hace clic fuera del menú
- El usuario presiona la tecla Escape
- El usuario selecciona una opción del menú

#### Scenario: Click outside closes dropdown
- **WHEN** el menú está abierto y el usuario hace clic fuera de él
- **THEN** el menú se cierra

#### Scenario: Escape key closes dropdown
- **WHEN** el menú está abierto y el usuario presiona Escape
- **THEN** el menú se cierra

#### Scenario: Menu item click closes dropdown
- **WHEN** el usuario hace clic en cualquier opción del menú
- **THEN** el menú se cierra antes de ejecutar la acción

### Requirement: Admin link visibility

El sistema DEBE mostrar el enlace "Admin" en el menú desplegable solo para usuarios con rol ADMIN o SUPER_ADMIN.

#### Scenario: Admin user sees Admin link
- **WHEN** el usuario tiene rol ADMIN o SUPER_ADMIN
- **THEN** el menú desplegable incluye un enlace "Admin" que navega a `/admin/dashboard`

#### Scenario: Regular user does not see Admin link
- **WHEN** el usuario tiene rol USER
- **THEN** el menú desplegable NO muestra el enlace "Admin"

### Requirement: Responsive design

El sistema DEBE mostrar el menú desplegable correctamente en dispositivos móviles y de escritorio.

#### Scenario: Mobile dropdown display
- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** el menú desplegable se muestra correctamente ajustado al ancho de pantalla

### Requirement: Remove standalone logout button

El sistema DEBE eliminar el botón de logout independiente del header.

#### Scenario: No standalone logout button in header
- **WHEN** el usuario está autenticado
- **THEN** el header NO muestra un botón de "Salir" independiente (solo accessible vía menú desplegable)
