# Fase 3 - Carrito — Diseño

## Arquitectura general

```text
┌─────────────────────────────────────────────────────────┐
│                      Cliente (Next.js)                   │
│                                                          │
│  ProductCard ──"Agregar"──► useCart() ──► POST /api/cart │
│                                  │                       │
│                            (si especial)                 │
│                                  ▼                       │
│                        CredentialsModal                  │
│                         (email+pass Epic)                │
└──────────────┬───────────────────────────▲───────────────┘
               │ localStorage cache        │ GET /api/cart
               ▼                           │ (nunca creds)
┌─────────────────────────────────────────────────────────┐
│                     API Routes                           │
│  requireAuth ─► cart-service ─► crypto-service           │
└──────────────┬──────────────────────────────────────────┘
               ▼
        PostgreSQL (cart_items)
```

## Flujo de agregar producto

```text
Usuario clic "Agregar al carrito"
        │
        ▼
¿Producto especial? (VBucks | CREW | BATTLE_PASS)
        │ sí                    │ no
        ▼                       ▼
  CredentialsModal      POST /api/cart { productId, quantity }
        │                       │
  usuario llena creds           ▼
        │               cart-service.addItem()
        ▼                       │
POST /api/cart          valida: existe, activo, giftable,
{ productId, quantity,  duplicado → incrementa cantidad
  credentials }                 │
        │                       ▼
        ▼               devuelve item actualizado
encripta AES-256-GCM
guarda en encrypted_credentials
```

## Decisiones de diseño

### 1. Encriptación de credenciales — AES-256-GCM

**Opción elegida**: Node `crypto` nativo con AES-256-GCM.

- IV aleatorio de 12 bytes por operación
- Auth tag almacenado junto al ciphertext: `{ iv, tag, data }` (base64) en campo JSON
- Key derivada de `ENCRYPTION_KEY` con `scrypt` → 32 bytes

**Alternativas descartadas**:
- Librerías externas (`crypto-js`): dependencia extra innecesaria, `node:crypto` es suficiente
- Cifrado a nivel de columna en Postgres (pgcrypto): acopla la clave a la DB y complica migraciones

**Trade-off**: si se pierde `ENCRYPTION_KEY`, las credenciales son irrecuperables. Aceptable: el usuario puede volver a ingresarlas.

### 2. Credenciales NUNCA regresan al cliente

`GET /api/cart` devuelve los items **sin** el campo `encrypted_credentials`. El desencriptado solo ocurrirá en Fase 7/9 (vista de admin tras validar pago). Esto se enforcea eligiendo columnas explícitas en el SELECT de Prisma.

### 3. Persistencia DB-only + cache localStorage

El carrito vive en Postgres (fuente de verdad). localStorage guarda un snapshot para pintar el badge instantáneamente sin esperar fetch; se re-sincroniza con `GET /api/cart` al montar. No hay cola de sincronización offline: MVP requiere login.

### 4. Duplicados: incrementar cantidad

La tabla tiene `@@unique([user_id, product_id])`. Agregar un producto ya existente incrementa `quantity` (tope 10) vía upsert en vez de fallar.

### 5. Validación contra snapshot del catálogo

`cart-service` consulta `ProductSnapshot` (no la API de Fortnite) para validar que el producto siga activo y obtener precio/nombre. El carrito debe ser rápido y determinista; la frescura la garantiza el worker de catálogo (Fase 1).

### 6. Tipos especiales requieren credenciales una sola vez

Si el usuario ya tiene un item VBucks con credenciales y agrega otro V-Bucks distinto, se le piden credenciales nuevamente por item (cada regalo puede ir a cuenta distinta). El modal prellena la última usada desde localStorage como conveniencia.
