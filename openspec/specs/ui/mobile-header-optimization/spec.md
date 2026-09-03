# Mobile Header Optimization

## Purpose

Optimizar el layout del header para dispositivos móviles, eliminando elementos redundantes y reorganizando el espacio disponible para evitar el corte superior y mejorar la experiencia de usuario en pantallas pequeñas.

## Requirements

### Requirement: Remove store button from header

El sistema DEBE eliminar el botón de "Tienda" del header en todas las versiones.

#### Scenario: Store button not visible in header
- **WHEN** el usuario accede a cualquier página
- **THEN** el header NO muestra un botón de "Tienda" independiente

### Requirement: Logo navigation to shop

El sistema DEBE hacer que el logo de KindStyle sea clickeable y redirija a la página del shop.

#### Scenario: Logo click navigates to shop
- **WHEN** el usuario hace clic en el logo de KindStyle en el header
- **THEN** el sistema navega a `/shop`

#### Scenario: Logo has pointer cursor
- **WHEN** el usuario pasa el cursor sobre el logo
- **THEN** el cursor cambia a pointer indicando que es clickeable

### Requirement: Remove notification bell from header

El sistema DEBE eliminar el icono de campana de notificaciones del header principal.

#### Scenario: Notification bell not visible in header
- **WHEN** el usuario accede a cualquier página
- **THEN** el header NO muestra el icono de campana de notificaciones

### Requirement: Mobile header layout optimization

El sistema DEBE ajustar el layout del header para que todos los elementos quepan correctamente en dispositivos móviles sin cortarse.

#### Scenario: Mobile header displays all elements
- **WHEN** el usuario accede desde un dispositivo móvil (ancho < 640px)
- **THEN** el header muestra el logo, carrito, botón de agregar bots (si aplica), y menú de usuario sin que ningún elemento se corte

#### Scenario: Header elements do not overflow
- **WHEN** el viewport es menor a 640px
- **THEN** todos los elementos del header son visibles y accesibles sin scroll horizontal

#### Scenario: Adequate spacing between elements
- **WHEN** el header se renderiza en móvil
- **THEN** los elementos tienen espaciado suficiente para ser tocados fácilmente (mínimo 44px de área de toque)
