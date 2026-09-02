# Section Banners Specification

## Purpose

Define cómo cada sección de la tienda muestra un banner dinámico (imagen + colores de fondo) derivado del pack de items reales de la sección, actualizándose automáticamente con cada rotación del shop sin intervención manual.

## Requirements

### Requirement: Banner de sección derivado del pack de items

El sistema DEBE resolver y mostrar un banner por cada sección de `/shop` a partir de los datos de sus propios entries.

- La imagen del banner DEBE tomarse del arte del entry base de la sección (`newDisplayAsset` del entry destacado; fallback: arte del primer entry del layout en orden API)
- El fondo DEBE componerse con los `colors` del entry base (gradiente `color1`→`color3` si existen; fallback `textBackgroundColor` a sólido; fallback final: gradiente neutro del tema actual)
- El título de la sección DEBE seguir visible sobre el banner con contraste asegurado por `textBackgroundColor`
- NO DEBE hardcodearse ningún banner por nombre de sección
- Cuando una sección no tenga ningún arte ni color disponible, DEBE degradar a encabezado de solo texto (comportamiento actual), sin hueco roto ni imagen vacía

#### Scenario: Sección con entry destacado con arte y colores

- **WHEN** la sección "Kai Cenat" tiene un entry featured con arte de tile y `colors.color1`/`color3`
- **THEN** el encabezado de la sección muestra ese arte como banner sobre el gradiente de esos colores
- **AND** el título "Kai Cenat" se lee sobre el banner

#### Scenario: Sección sin arte disponible

- **WHEN** todos los entries de una sección carecen de `newDisplayAsset` y `colors`
- **THEN** el encabezado se renderiza como texto plano (comportamiento actual)
- **AND** no se muestra imagen rota ni contenedor vacío

### Requirement: Fallback determinístico con banners de referencia

Cuando el arte del pack de items no esté disponible, el sistema PUEDE usar como respaldo un banner de perfil de `GET /v1/banners` (dados ya sincronizados), y en ese caso:

- La selección DEBE ser determinística e inyectiva por sección: DEBE derivarse de `layout.id` (fallback: slug de `layout.name`), no del azar ni del orden mutable del día
- El mapeo token→hex del fondo DEBE poder resolverse con los datos de `GET /v1/banners/colors` cuando el banner de referencia los use
- La misma sección DEBE obtener siempre el mismo banner de referencia mientras no cambie su identidad (slug/layoutId)

#### Scenario: Dos secciones sin arte obtienen banners distintos

- **WHEN** dos secciones del día caen al fallback de banner de referencia
- **THEN** cada una muestra un banner distinto (selección sin colisión por hash de `layout.id`)

### Requirement: Dinamismo entre rotaciones del shop

El banner de una sección DEBE cambiar cuando cambie su pack de items.

- Al crearse un nuevo snapshot del shop con entries/colores/arte distintos para una sección, la sección DEBE reflejar el nuevo banner en la siguiente renderización de `/shop`
- Si los items de la sección no cambiaron entre sincronizaciones, el banner NO DEBE cambiar (estabilidad visual)
- Las reglas de caché de tienda vigente se aplican igual al banner: NO DEBE mostrarse banner de un día anterior cuando ya existe snapshot válido del día actual

#### Scenario: Rotación diaria cambia el banner

- **WHEN** Epic mueve un set de "Aura máxima" a otra sección en el shop del día siguiente
- **THEN** el banner de "Aura máxima" pasa a derivarse de sus nuevos entries sin cambio de código ni configuración manual

### Requirement: Banner en navegación lateral

La sidebar de secciones PUEDE mostrar una miniatura del banner resuelto para cada sección.

- Si existe banner para la sección, la miniatura DEBE usar la misma imagen resuelta (sin duplicar resolución)
- Si la sección degradó a encabezado de texto, la miniatura NO DEBE mostrarse (texto solo, como hoy)

#### Scenario: Miniatura coherente con el banner

- **WHEN** una sección tiene banner resuelto y se renderiza la sidebar de escritorio
- **THEN** la entrada del sidebar muestra la miniatura de ese banner junto al título

### Requirement: Imágenes remotas seguras

Todo banner renderizado DEBE respetar las restricciones existentes de imágenes remotas de Next.js.

- Las URLs DEBE provenir de dominios ya whitelisteada (`fortnite-api.com`, `epicgames.com`)
- NO DEBE renderizarse ninguna URL de imagen que no venga de datos persistidos por el sync (ni del payload crudo)

#### Scenario: URL de banner fuera de la whitelist

- **WHEN** un registro contiene una URL de banner en un dominio no permitido
- **THEN** el componente degrada a encabezado de texto para esa sección sin error en cliente
