# KindStyle - Tienda Fortnite MVP

## Resumen del Proyecto

Tienda online especializada en productos de Fortnite con sistema de gifting manual.

## Stack Tecnológico

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Cache/Queue**: Redis + BullMQ
- **Email**: Resend
- **Hosting**: Vercel (frontend) + Railway (backend/worker)
- **Containerización**: Docker + Docker Compose

## Configuración Global

| Aspecto | Valor |
|---------|-------|
| Marca | KindStyle |
| Idioma | Español |
| Mercado | Latam + España |
| Zona horaria | UTC-6 (México) |
| Moneda base | MXN |
| Monedas soportadas | USD, MXN, COP, ARS, PEN, EUR |
| Conversión | Dinámica vs MXN |
| WhatsApp | +52 3531022207 |
| Email contacto | @store.kindstyles |
| Colores | Morado Fortnite + blanco/negro |

## Flujo Principal

```
CLIENTE
  ↓
Navega tienda (colecciones como Fortnite)
  ↓
Ve producto (nombre + V-Bucks + precio + icono)
  ↓
Agrega al carrito
  ↓
¿Es regalo? → Continuar normal
¿Es V-Bucks/Crew? → Pedir email + contraseña cuenta Epic
  ↓
Registra Fortnite ID (plataforma + ID)
  ↓
Solicita bots de amistad
  ↓
Ve estado de bots (tracking individual)
  ↓
Genera solicitud → Copia o abre WhatsApp
  ↓
Vendedor recibe solicitud
  ↓
Vendedor envía solicitudes de amistad
  ↓
Cliente acepta → Vendedor confirma
  ↓
Timer individual inicia por bot
  ↓
Cliente ve timer en su panel
  ↓
Cliente va a pagar → Página de pagos
  ↓
Elige método (Transferencia / OXXO)
  ↓
Copia datos bancarios → Sube comprobante
  ↓
Estado: "Validación en proceso" + tracker visual
  ↓
Admin valida → Notificación al cliente
  ↓
Fulfillment manual (cuando bots elegibles)
```

## Fases de Implementación

- **FASE 0**: Foundation (monorepo, DB, Docker, env)
- **FASE 1**: Catálogo (API, Snapshots, SKU, colecciones)
- **FASE 2**: Autenticación (email + código, sesiones)
- **FASE 3**: Carrito (add/remove, persistencia, productos especiales)
- **FASE 4**: Request System (Request ID, WhatsApp, Copy)
- **FASE 5**: Bot System (Friendship Requests, Admin Panel)
- **FASE 6**: Individual Timers (cronómetros por bot)
- **FASE 7**: Sistema de Pagos (transferencia, OXXO, comprobantes)
- **FASE 8**: Notifications (Web, Email, WhatsApp)
- **FASE 9**: Admin Operations (Queue, Priority, Audit, Dashboard)
- **FASE 10**: Monedas (conversión dinámica, selector)

## No implementar en MVP

- Pago online (pasarela)
- Fulfillment automático
- Verificación automática de destinatario
- WhatsApp Business API (usar wa.me)
