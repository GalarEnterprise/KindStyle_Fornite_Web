# User Profile Specification

## Purpose

Proporciona una página de perfil de usuario donde los usuarios pueden visualizar y gestionar su información personal (apodo, email, y configuración de cuenta).

## Requirements

### Requirement: Profile page access

El sistema DEBE proporcionar una página de perfil accesible desde el menú desplegable del header.

- La ruta DEBE ser `/account/profile`
- La página DEBE estar protegida por autenticación (requiere login)
- La página DEBE mostrarse dentro del layout de cuenta existente

#### Scenario: Authenticated user accesses profile page
- **WHEN** un usuario autenticado navega a `/account/profile`
- **THEN** el sistema muestra la página de perfil con la información del usuario

#### Scenario: Unauthenticated user redirected to login
- **WHEN** un usuario sin sesión intenta acceder a `/account/profile`
- **THEN** el sistema redirige a `/login`

### Requirement: Profile information display

El sistema DEBE mostrar la siguiente información del usuario en la página de perfil:

- Apodo de usuario
- Email registrado
- Rol de usuario (USER, ADMIN, SUPER_ADMIN)
- Fecha de registro (si está disponible)

#### Scenario: Profile shows user data
- **WHEN** el usuario accede a su perfil
- **THEN** la página muestra apodo, email, rol y fecha de registro

### Requirement: Nickname editing

El sistema DEBE permitir al usuario editar su apodo desde la página de perfil.

- El apodo DEBE tener entre 3 y 20 caracteres alfanuméricos
- El apodo DEBE ser único
- DEBE mostrar validación en tiempo real
- DEBE guardar los cambios al enviar el formulario

#### Scenario: User edits nickname successfully
- **WHEN** el usuario ingresa un nuevo apodo válido (3-20 caracteres, único) y guarda
- **THEN** el sistema actualiza el apodo y muestra confirmación

#### Scenario: User enters invalid nickname
- **WHEN** el usuario ingresa un apodo con menos de 3 caracteres o más de 20
- **THEN** el sistema muestra error de validación

#### Scenario: User enters duplicate nickname
- **WHEN** el usuario ingresa un apodo que ya existe en el sistema
- **THEN** el sistema muestra error indicando que el apodo ya está en uso

### Requirement: Account section navigation

El sistema DEBE proporcionar navegación entre las secciones de cuenta.

- La página de perfil DEBE incluir enlaces a otras secciones: Mis solicitudes, Mis bots, Pagos, Notificaciones
- La sección actual DEBE estar resaltada visualmente

#### Scenario: Profile page shows navigation links
- **WHEN** el usuario accede a `/account/profile`
- **THEN** la página muestra enlaces a las otras secciones de cuenta

### Requirement: Responsive layout

El sistema DEBE mostrar la página de perfil correctamente en dispositivos móviles y de escritorio.

#### Scenario: Mobile profile display
- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** la página de perfil se muestra correctamente ajustada al ancho de pantalla
