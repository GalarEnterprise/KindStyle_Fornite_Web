# User Profile Specification

## Purpose

Proporciona una página de perfil de usuario donde los usuarios pueden visualizar y gestionar su información personal (apodo, email, y configuración de cuenta).

## Requirements

### Requirement: Profile page access

El sistema DEBE proporcionar una página de perfil accesible desde el menú desplegable del header y desde el sidebar de cuenta.

- La ruta DEBE ser `/account/profile`
- La página DEBE estar protegida por autenticación (requiere login)
- La página DEBE mostrarse dentro del layout de cuenta con sidebar
- El UserMenu DEBE incluir un enlace "Mi Perfil" que navegue a `/account/profile`

#### Scenario: Authenticated user accesses profile from user menu
- **WHEN** un usuario autenticado hace clic en "Mi Perfil" en el UserMenu dropdown
- **THEN** el sistema navega a `/account/profile` y muestra la página de perfil

#### Scenario: Authenticated user accesses profile from sidebar
- **WHEN** un usuario autenticado hace clic en "Mi Perfil" en el sidebar de cuenta
- **THEN** el sistema navega a `/account/profile` y muestra la página de perfil

#### Scenario: Unauthenticated user redirected to login
- **WHEN** un usuario sin sesión intenta acceder a `/account/profile`
- **THEN** el sistema redirige a `/login`

### Requirement: Profile information display

El sistema DEBE mostrar la siguiente información del usuario en la página de perfil:

- Apodo de usuario
- Email registrado
- Rol de usuario (USER, ADMIN, SUPER_ADMIN)
- Fecha de registro (si está disponible)
- Estado de contraseña (creada o no creada)

#### Scenario: Profile shows user data
- **WHEN** el usuario accede a su perfil
- **THEN** la página muestra apodo, email, rol, fecha de registro y estado de contraseña

#### Scenario: Profile shows password status
- **WHEN** el usuario accede a su perfil
- **THEN** la página indica si tiene contraseña creada y ofrece opción de crear/cambiar

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

### Requirement: Password management from profile

El sistema DEBE permitir al usuario gestionar su contraseña desde la página de perfil.

- Si el usuario NO tiene contraseña, DEBE mostrar botón "Crear contraseña"
- Si el usuario TIENE contraseña, DEBE mostrar botón "Cambiar contraseña"
- Al hacer clic en "Crear contraseña", DEBE mostrar formulario de creación
- Al hacer clic en "Cambiar contraseña", DEBE mostrar formulario con contraseña actual y nueva

#### Scenario: User without password sees create option
- **WHEN** el usuario accede a su perfil y no tiene contraseña creada
- **THEN** la página muestra botón "Crear contraseña"

#### Scenario: User with password sees change option
- **WHEN** el usuario accede a su perfil y tiene contraseña creada
- **THEN** la página muestra botón "Cambiar contraseña"

#### Scenario: Create password form
- **WHEN** el usuario hace clic en "Crear contraseña"
- **THEN** se muestra formulario con campos: nueva contraseña, confirmar contraseña

#### Scenario: Change password form
- **WHEN** el usuario hace clic en "Cambiar contraseña"
- **THEN** se muestra formulario con campos: contraseña actual, nueva contraseña, confirmar contraseña

### Requirement: Responsive layout

El sistema DEBE mostrar la página de perfil correctamente en dispositivos móviles y de escritorio.

#### Scenario: Mobile profile display
- **WHEN** el usuario accede desde un dispositivo móvil
- **THEN** la página de perfil se muestra correctamente ajustada al ancho de pantalla
