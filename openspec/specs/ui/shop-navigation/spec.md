## Purpose

Permitir que la navegación por secciones del shop funcione con scroll programático sin que la URL del navegador muestre hash fragments.

## Requirements

### Requirement: Navegación por secciones sin alterar la URL

El componente de navegación de secciones (sidebar desktop + nav móvil) DEBE realizar scroll a la sección correspondiente al hacer clic en un ítem, SIN modificar `window.location.hash` ni la URL del navegador.

- La URL visible en la barra de direcciones DEBE permanecer como `/shop` sin ningún fragmento.
- El scroll DEBE ser suave (`behavior: 'smooth'`).
- El scroll-spy que resalta la sección activa DEBE seguir funcionando correctamente.

#### Scenario: Clic en enlace de sección en sidebar desktop

- **WHEN** el usuario hace clic en un ítem de sección en la sidebar de escritorio
- **THEN** la página hace scroll suave a esa sección
- **AND** la URL permanece como `/shop` sin hash fragment

#### Scenario: Clic en enlace de sección en nav móvil

- **WHEN** el usuario hace clic en un ítem de sección en la navegación horizontal móvil
- **THEN** la página hace scroll suave a esa sección
- **AND** la URL permanece como `/shop` sin hash fragment

#### Scenario: Scroll-spy mantiene resaltado de sección activa

- **WHEN** el usuario navega entre secciones haciendo clic en los ítems de la sidebar
- **THEN** el ítem correspondiente a la sección visible se resalta visualmente
- **AND** el estado de sección activa se actualiza al hacer scroll manual

### Requirement: Identificadores de sección en el DOM

Los `<section>` de la página del shop DEBEN conservar atributos `id` para que el scroll-spy y el scroll programático puedan localizarlos.

- Cada sección DEBE tener un `id` único basado en su slug (formato: `section-<slug>`).
- Los `id` NO DEBEN exponerse en la URL del navegador.

#### Scenario: Sección tiene id para scroll programático

- **WHEN** la página del shop se renderiza con secciones del catálogo
- **THEN** cada sección tiene un atributo `id` con formato `section-<slug>`
- **AND** la URL no contiene ningún fragmento hash

### Requirement: Comportamiento al cargar con hash residual

Si un usuario llega a `/shop#section-algo` (por ejemplo, un bookmark guardado), el sistema DEBE ignorar el hash y mostrar la página sin intentar hacer scroll a esa sección.

- La página NO DEBE hacer scroll automático a una sección basándose en el hash de la URL.
- La URL con hash residual NO DEBE mostrarse al usuario; el hash DEBE eliminarse de la URL silenciosamente al cargar la página.

#### Scenario: Usuario llega con bookmark que contiene hash

- **WHEN** el usuario accede a `/shop#section-crash-bandicoot-y-spyro-el-dragon`
- **THEN** la página se muestra desde el inicio (scroll top)
- **AND** la URL se limpia a `/shop` sin el hash
