# Sistema de Pagos (Manual)

## Métodos de Pago

### Transferencia Bancaria
```
💳 MERCADO PAGO (Clabe):
722969040853088360
Beneficiario: Lidia Isela Perez R.
```

### Depósito OXXO
```
🏧 OXXO (Cuenta):
4217 4703 3148 7708
Beneficiario: Lidia Isela Perez R.
```

## Flujo de Pago

```
Cliente tiene pedido(s) pendiente(s)
    ↓
Ir a página de pagos (/account/payment)
    ↓
Ver lista de pedidos con total a pagar
    ↓
Seleccionar método (Transferencia / OXXO)
    ↓
Mostrar datos bancarios con botón [COPIAR]
    ↓
Botón "VALIDAR PAGO"
    ↓
Pantalla para subir comprobante (jpg/png/webp)
    ↓
Estado: "VALIDACIÓN EN PROCESO" + tracker visual
    ↓
Admin recibe notificación
    ↓
Admin descarga comprobante y valida
    ↓
├─ VÁLIDO → Estado: PAID, notificar cliente
└─ NO VÁLIDO → Estado: CANCELLED, notificar con motivo
```

## Reglas

- **Múltiples pedidos**: Cliente puede tener varios pedidos pendientes
- **Pago conjunto**: Se paga todo lo del carrito en una sola transacción
- **Pago total**: No se permiten pagos parciales
- **Comprobante obligatorio**: Sin comprobante no se valida
- **Formatos**: jpg, png, webp

## Página de Pagos

```
TUS PEDIDOS PENDIENTES

Pedido REQ-20260823-8F42
• Spider-Man — 1,500 V-Bucks — $112.50 MXN
• Batman Pack — 2,500 V-Bucks — $187.50 MXN
Subtotal: $300.00 MXN

Pedido REQ-20260825-A1B2
• 4,500 V-Bucks — $337.50 MXN
Subtotal: $337.50 MXN

TOTAL A PAGAR: $637.50 MXN

MÉTODO DE PAGO
[ Transferencia ] [ OXXO ]

DATOS PARA PAGO
(Se muestran según selección)
[ COPIAR DATOS ]

[ VALIDAR PAGO ]
```

## Pantalla de Validación

```
VALIDACIÓN EN PROCESO

Tu comprobante está siendo revisado.
Te notificaremos cuando sea confirmado.

[Tracker visual con estados]
⚪ Comprobante subido
🟡 En revisión
⚪ Validado / Rechazado

Tiempo estimado: 1-24 horas
```

## Credenciales Especiales (V-Bucks/Crew/Battle Pass)

Para productos que requieren acceso a la cuenta:

1. Cliente ingresa email + contraseña al agregar al carrito
2. Credenciales se encriptan y guardan
3. Admin **NO puede verlas** hasta validar pago
4. Después de validar: admin puede ver credenciales para fulfillment
5. Si pago rechazado: credenciales permanecen encriptadas, cliente debe reintentar

## Notificaciones

- Al subir comprobante: "Validación en proceso..."
- Al validar: "Pago confirmado" + detalle
- Al rechazar: "Pago no válido" + motivo + nota admin
- Recordar subir comprobante si pasan X horas

## Popup Post-Pago

Después de completar el proceso de pago:

```
¿Quieres proporcionarnos tu número?

Para avisarte cuando tu pedido esté listo,
puedes dejarnos tu número de WhatsApp.

[ Número: ___________ ]
[ Omitir ] [ Guardar ]

(Este popup solo aparece si el usuario no tiene número)
```

## Estructura DB

### payments
```
id, request_id, user_id,
method, amount, currency,
receipt_file_url, receipt_file_name,
status, admin_notes,
validated_by, validated_at,
created_at, updated_at
```

### payment_statuses
```
PENDING_RECEIPT
VALIDATION_IN_PROGRESS
VALIDATED
REJECTED
```

## Admin - Gestión de Pagos

- Ver lista de pagos pendientes
- Descargar comprobante
- Validar / Rechazar
- Agregar nota al rechazar
- Ver historial de pagos
