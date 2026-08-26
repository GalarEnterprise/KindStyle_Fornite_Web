# Sistema de Carrito

## Funcionalidades

- Agregar productos
- Remover productos
- Actualizar cantidad
- Persistencia (localStorage + DB si autenticado)
- Validación de productos contra catálogo actual

## Flujo

```
Producto en tienda
    ↓
Click "Agregar al carrito"
    ↓
¿Es V-Bucks/Crew/Battle Pass?
    ├─ SÍ → Modal pide email + contraseña Epic
    │        ↓
    │    Encriptar credenciales
    │        ↓
    │    Agregar al carrito con credenciales
    │
    └─ NO → Agregar normalmente
    ↓
Carrito actualizado
    ↓
Ir a checkout
```

## Estructura del Carrito

```typescript
interface CartItem {
  productId: string
  quantity: number
  priceVbucks: number
  priceCurrency: number
  type: 'gift' | 'vbucks' | 'crew' | 'battlepass'
  // Solo para vbucks/crew/battlepass:
  epicCredentials?: {
    email: string      // encriptado
    password: string   // encriptado
  }
}
```

## Reglas

- No mezclar productos que requieren credenciales con los que no
- Validar que el producto siga disponible antes de checkout
- Si el catálogo cambió (precio, disponibilidad), notificar al usuario
- Carrito persistente para usuarios autenticados
- Carrito temporal (localStorage) para invitados

## Visualización

- Lista de productos con:
  - Icono
  - Nombre
  - V-Bucks
  - Precio en moneda seleccionada
  - Cantidad
  - Botón eliminar
- Total en V-Bucks
- Total en moneda seleccionada
- Botón "Proceder al pago"
